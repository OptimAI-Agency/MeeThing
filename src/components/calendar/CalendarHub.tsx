
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Settings } from "lucide-react";
import CalendarConnections from "./CalendarConnections";
import MeetingsList from "./MeetingsList";
import CalendarSettings from "./CalendarSettings";

const CalendarHub = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "connections" | "settings">("overview");
  const [connectedCalendars, setConnectedCalendars] = useState<string[]>([]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16 animate-subtle-fade-in">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl text-white mb-8 text-wellness-heading wellness-text-soft">
            Calendar Integration
          </h1>
          <p className="text-lg text-white/95 max-w-2xl mx-auto text-wellness-body wellness-text-soft">
            Connect your calendars and embrace a mindful approach to meeting management with gentle, wellness-focused insights.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-12">
          <div className="wellness-blur border border-white/30 rounded-3xl p-2 bg-white/15 wellness-shadow-gentle">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              onClick={() => setActiveTab("overview")}
              className={`rounded-2xl px-8 py-3 transition-all duration-300 ${
                activeTab === "overview" 
                  ? "bg-white/95 text-wellness-sage shadow-sm font-medium" 
                  : "text-white/90 hover:bg-white/20 hover:text-white"
              }`}
            >
              <Calendar className="w-4 h-4 mr-3" />
              Overview
            </Button>
            <Button
              variant={activeTab === "connections" ? "default" : "ghost"}
              onClick={() => setActiveTab("connections")}
              className={`rounded-2xl px-8 py-3 transition-all duration-300 ${
                activeTab === "connections" 
                  ? "bg-white/95 text-wellness-sage shadow-sm font-medium" 
                  : "text-white/90 hover:bg-white/20 hover:text-white"
              }`}
            >
              <Plus className="w-4 h-4 mr-3" />
              Connections
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              onClick={() => setActiveTab("settings")}
              className={`rounded-2xl px-8 py-3 transition-all duration-300 ${
                activeTab === "settings" 
                  ? "bg-white/95 text-wellness-sage shadow-sm font-medium" 
                  : "text-white/90 hover:bg-white/20 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === "overview" && (
            <div className="space-y-8">
              {connectedCalendars.length === 0 ? (
                <Card className="text-center py-20 px-12 wellness-blur bg-white/95 border-white/40 wellness-shadow-soft rounded-3xl animate-subtle-fade-in">
                  <CardHeader>
                    <CardTitle className="text-3xl text-foreground mb-6 text-wellness-heading">
                      Welcome to Your Wellness Calendar
                    </CardTitle>
                    <CardDescription className="text-lg text-muted-foreground text-wellness-body max-w-md mx-auto">
                      Begin your mindful meeting journey by connecting your calendars for a more balanced approach to time management.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setActiveTab("connections")}
                      size="lg"
                      className="text-lg px-12 py-4 rounded-2xl transition-all duration-300 hover:scale-105 bg-primary hover:bg-primary/90 text-primary-foreground wellness-shadow-gentle font-medium"
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      Connect Your First Calendar
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="wellness-blur bg-white/95 rounded-3xl p-8 wellness-shadow-soft">
                  <MeetingsList />
                </div>
              )}
            </div>
          )}

          {activeTab === "connections" && (
            <div className="wellness-blur bg-white/95 rounded-3xl p-8 wellness-shadow-soft animate-subtle-fade-in">
              <CalendarConnections
                connectedCalendars={connectedCalendars}
                setConnectedCalendars={setConnectedCalendars}
              />
            </div>
          )}

          {activeTab === "settings" && (
            <div className="wellness-blur bg-white/95 rounded-3xl p-8 wellness-shadow-soft animate-subtle-fade-in">
              <CalendarSettings />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarHub;
