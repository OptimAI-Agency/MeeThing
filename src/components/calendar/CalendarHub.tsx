import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Settings, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { COPY } from "@/copy/glossary";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCalendarConnections } from "@/hooks/useCalendarConnections";
import { useMeetings } from "@/hooks/useMeetings";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useBreathingReminder } from "@/hooks/useBreathingReminder";
import CalendarConnections from "./CalendarConnections";
import MeetingsList from "./MeetingsList";
import MeetingCardSkeleton from "./MeetingCardSkeleton";
import CalendarSettings from "./CalendarSettings";
import BreathingOverlay from "@/components/wellness/BreathingOverlay";
import MissedReminderBanner from "@/components/wellness/MissedReminderBanner";

const TAB_LABELS: Record<"overview" | "connections" | "settings", string> = {
  overview: COPY.nav.calendar,       // "Your Calendar" — D-01
  connections: COPY.nav.connections, // "Your Calendars" — D-03
  settings: COPY.nav.settings,       // "Your Settings" — D-02
};

const CalendarHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"overview" | "connections" | "settings">("overview");
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: connections = [], isLoading: connectionsLoading } = useCalendarConnections();
  const { data: meetings = [] } = useMeetings();
  const { data: settings } = useUserSettings();
  const breathing = useBreathingReminder(meetings, settings);

  const connectedProviders = connections.map((c) => c.provider);

  // Clear the ?tab query param after applying it on first render
  useEffect(() => {
    if (searchParams.get("tab")) {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Intentionally run once on mount to consume the ?tab param and clear it.
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-sync");

      // Network-level failure
      if (error) {
        toast({
          title: COPY.sync.errorTitle,
          description: COPY.sync.errorBody,
        });
        return;
      }

      // Edge function returned a structured error response
      if (data?.error) {
        if (data.error_type === "auth_expired") {
          toast({
            title: COPY.sync.sessionExpiredTitle,
            description: COPY.sync.sessionExpiredBody,
            action: (
              <ToastAction altText={COPY.sync.sessionExpiredAction} onClick={() => setActiveTab("connections")}>
                {COPY.sync.sessionExpiredAction}
              </ToastAction>
            ),
          });
        } else {
          toast({
            title: COPY.sync.errorTitle,
            description: COPY.sync.errorBody,
          });
        }
        return;
      }

      // Success — invalidate both meetings and calendar-connections (per D-09)
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-connections"] });
      toast({ title: COPY.sync.successTitle, description: COPY.sync.successBody });
    } catch (err: unknown) {
      toast({
        title: COPY.sync.errorTitle,
        description: COPY.sync.errorBody,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl sm:text-6xl md:text-7xl text-white mb-6 font-bold tracking-tight">
            <span className="inline-block bg-gradient-to-br from-white to-white/80 bg-clip-text text-transparent drop-shadow-2xl">
              {COPY.welcome.heading}
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-white/95 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
            {COPY.welcome.subheading}
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
                  className={`rounded-2xl px-6 py-4 min-h-[52px] spring-bounce font-medium ${
                    activeTab === tab
                      ? "bg-white text-blue-600 shadow-lg hover:shadow-xl"
                      : "text-gray-700 hover:bg-white/50 hover:text-gray-900"
                  }`}
                >
                  {tab === "overview" && <Calendar className="w-5 h-5 mr-2" />}
                  {tab === "connections" && <Plus className="w-5 h-5 mr-2" />}
                  {tab === "settings" && <Settings className="w-5 h-5 mr-2" />}
                  {TAB_LABELS[tab]}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <div className="relative glass-panel rounded-3xl p-8 sm:p-10 space-y-8 animate-scale-in">
            {breathing.showBanner && (
              <MissedReminderBanner
                meetingTitle={breathing.meetingTitle}
                onDismiss={breathing.dismissBanner}
                onOpenOverlay={breathing.openOverlayFromBanner}
              />
            )}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {connectionsLoading ? (
                  <div className="space-y-4">
                    <MeetingCardSkeleton />
                    <MeetingCardSkeleton />
                    <MeetingCardSkeleton />
                  </div>
                ) : connectedProviders.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mb-6">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-3xl flex items-center justify-center backdrop-blur-sm ring-1 ring-white/20">
                        <Calendar className="w-10 h-10 text-blue-600" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">{COPY.empty.noConnectionTitle}</h2>
                    <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                      {COPY.empty.noConnectionBody}
                    </p>
                    <Button
                      onClick={() => setActiveTab("connections")}
                      size="lg"
                      className="rounded-2xl px-8 py-4 spring-smooth active:scale-95 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      {COPY.welcome.cta}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSync}
                        disabled={syncing}
                        aria-label={COPY.sync.iconAriaLabel}
                        className="rounded-full h-9 w-9 text-gray-500 hover:text-gray-700 hover:bg-white/60"
                      >
                        <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} aria-hidden="true" />
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

    {breathing.showOverlay && (
      <BreathingOverlay
        onDismiss={breathing.dismissOverlay}
        meetingTitle={breathing.meetingTitle}
        minutesAway={breathing.meetingMinutesAway}
      />
    )}
    </>
  );
};

export default CalendarHub;
