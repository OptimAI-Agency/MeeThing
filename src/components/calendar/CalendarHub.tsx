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
  return <div className="min-h-screen flex items-center justify-center px-4 py-8">
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

        {/* Navigation Tabs with Glass Effect */}
        <div className="flex justify-center mb-10">
          <div className="glass-panel rounded-3xl p-2 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant={activeTab === "overview" ? "default" : "ghost"} 
                onClick={() => setActiveTab("overview")} 
                className={`rounded-2xl px-6 py-4 min-h-[52px] spring-bounce font-medium ${
                  activeTab === "overview" 
                    ? "bg-white text-blue-600 shadow-lg hover:shadow-xl" 
                    : "text-gray-700 hover:bg-white/50 hover:text-gray-900"
                }`}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Overview
              </Button>
              <Button 
                variant={activeTab === "connections" ? "default" : "ghost"} 
                onClick={() => setActiveTab("connections")} 
                className={`rounded-2xl px-6 py-4 min-h-[52px] spring-bounce font-medium ${
                  activeTab === "connections" 
                    ? "bg-white text-blue-600 shadow-lg hover:shadow-xl" 
                    : "text-gray-700 hover:bg-white/50 hover:text-gray-900"
                }`}
              >
                <Plus className="w-5 h-5 mr-2" />
                Connections
              </Button>
              <Button 
                variant={activeTab === "settings" ? "default" : "ghost"} 
                onClick={() => setActiveTab("settings")} 
                className={`rounded-2xl px-6 py-4 min-h-[52px] spring-bounce font-medium ${
                  activeTab === "settings" 
                    ? "bg-white text-blue-600 shadow-lg hover:shadow-xl" 
                    : "text-gray-700 hover:bg-white/50 hover:text-gray-900"
                }`}
              >
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area with Glass Panel */}
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel rounded-3xl p-8 sm:p-10 space-y-8 animate-scale-in">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {connectedCalendars.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mb-6">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-3xl flex items-center justify-center backdrop-blur-sm ring-1 ring-white/20">
                        <Calendar className="w-10 h-10 text-blue-600" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Welcome to Calendar Integration
                    </h2>
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
                  <MeetingsList />
                )}
              </div>
            )}

            {activeTab === "connections" && (
              <CalendarConnections connectedCalendars={connectedCalendars} setConnectedCalendars={setConnectedCalendars} />
            )}

            {activeTab === "settings" && (
              <CalendarSettings />
            )}
          </div>
        </div>
      </div>
    </div>;
};
export default CalendarHub;