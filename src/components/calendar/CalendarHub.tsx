import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Settings, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCalendarConnections } from "@/hooks/useCalendarConnections";
import CalendarConnections from "./CalendarConnections";
import MeetingsList from "./MeetingsList";
import CalendarSettings from "./CalendarSettings";

const CalendarHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"overview" | "connections" | "settings">("overview");
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: connections = [], isLoading: connectionsLoading } = useCalendarConnections();

  const connectedProviders = connections.map((c) => c.provider);

  // Clear the ?tab query param after applying it on first render
  useEffect(() => {
    if (searchParams.get("tab")) {
      setSearchParams({}, { replace: true });
    }
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-sync");

      // Network-level failure
      if (error) {
        toast({
          title: "Sync failed",
          description: "Sync failed — check your connection and try again.",
          variant: "destructive",
        });
        return;
      }

      // Edge function returned a structured error response
      if (data?.error) {
        if (data.error_type === "auth_expired") {
          toast({
            title: "Session expired",
            description: "Your Google Calendar session expired — please reconnect.",
            variant: "destructive",
            action: (
              <ToastAction altText="Reconnect" onClick={() => setActiveTab("connections")}>
                Reconnect
              </ToastAction>
            ),
          });
        } else {
          toast({
            title: "Sync failed",
            description: "Google Calendar sync failed — try again.",
            variant: "destructive",
          });
        }
        return;
      }

      // Success — invalidate both meetings and calendar-connections (per D-09)
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-connections"] });
      toast({ title: "Synced", description: "Your calendar events have been refreshed." });
    } catch (err: unknown) {
      toast({
        title: "Sync failed",
        description: "Sync failed — check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl sm:text-6xl md:text-7xl text-white mb-6 font-bold tracking-tight">
            <span className="inline-block bg-gradient-to-br from-white to-white/80 bg-clip-text text-transparent drop-shadow-2xl">
              Calendar Integration
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-white/95 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
            Connect your calendars and streamline your meeting management
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-10">
          <div className="glass-panel rounded-3xl p-2 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              {(["overview", "connections", "settings"] as const).map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? "default" : "ghost"}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-2xl px-6 py-4 min-h-[52px] spring-bounce font-medium capitalize ${
                    activeTab === tab
                      ? "bg-white text-blue-600 shadow-lg hover:shadow-xl"
                      : "text-gray-700 hover:bg-white/50 hover:text-gray-900"
                  }`}
                >
                  {tab === "overview" && <Calendar className="w-5 h-5 mr-2" />}
                  {tab === "connections" && <Plus className="w-5 h-5 mr-2" />}
                  {tab === "settings" && <Settings className="w-5 h-5 mr-2" />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel rounded-3xl p-8 sm:p-10 space-y-8 animate-scale-in">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {connectionsLoading ? (
                  <div className="text-center py-16">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading…</p>
                  </div>
                ) : connectedProviders.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mb-6">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-3xl flex items-center justify-center backdrop-blur-sm ring-1 ring-white/20">
                        <Calendar className="w-10 h-10 text-blue-600" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Calendar Integration</h2>
                    <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                      Connect your calendars to get started with seamless meeting management
                    </p>
                    <Button
                      onClick={() => setActiveTab("connections")}
                      size="lg"
                      className="rounded-2xl px-8 py-4 spring-smooth active:scale-95 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Connect Your First Calendar
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSync}
                        disabled={syncing}
                        className="rounded-xl border-gray-200 hover:bg-white/80 gap-2"
                      >
                        <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                        {syncing ? "Syncing…" : "Sync now"}
                      </Button>
                    </div>
                    <MeetingsList />
                  </>
                )}
              </div>
            )}

            {activeTab === "connections" && (
              <CalendarConnections connectedProviders={connectedProviders} syncing={syncing} />
            )}

            {activeTab === "settings" && <CalendarSettings />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarHub;
