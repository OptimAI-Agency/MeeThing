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
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white mb-4 sm:mb-6 leading-tight font-extrabold nature-text-shadow px-2">
            Calendar Integration
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed nature-text-shadow px-4">
            Connect your calendars and streamline your meeting management with MeeThing's wellness-focused approach.
          </p>
        </div>

        {/* Navigation Tabs - Mobile First */}
        <div className="flex justify-center mb-8 px-2">
          <div className="backdrop-blur-sm border border-white/20 rounded-2xl sm:rounded-full p-1 bg-white/10 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button 
                variant={activeTab === "overview" ? "default" : "ghost"} 
                onClick={() => setActiveTab("overview")} 
                className={`rounded-xl sm:rounded-full px-6 py-3 min-h-[44px] justify-start sm:justify-center ${activeTab === "overview" ? "bg-white text-green-800 hover:bg-white/90" : "text-white hover:bg-white/20"}`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Overview
              </Button>
              <Button 
                variant={activeTab === "connections" ? "default" : "ghost"} 
                onClick={() => setActiveTab("connections")} 
                className={`rounded-xl sm:rounded-full px-6 py-3 min-h-[44px] justify-start sm:justify-center ${activeTab === "connections" ? "bg-white text-green-800 hover:bg-white/90" : "text-white hover:bg-white/20"}`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Connections
              </Button>
              <Button 
                variant={activeTab === "settings" ? "default" : "ghost"} 
                onClick={() => setActiveTab("settings")} 
                className={`rounded-xl sm:rounded-full px-6 py-3 min-h-[44px] justify-start sm:justify-center ${activeTab === "settings" ? "bg-white text-green-800 hover:bg-white/90" : "text-white hover:bg-white/20"}`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === "overview" && <div className="space-y-6">
              {connectedCalendars.length === 0 ? <Card className="text-center py-16 backdrop-blur-sm bg-white/90 border-white/20 wellness-shadow rounded-3xl ">
                  <CardHeader>
                    <CardTitle className="text-3xl text-gray-800 mb-4">
                      Welcome to Calendar Integration
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600">
                      Connect your calendars to get started with seamless meeting management.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setActiveTab("connections")} size="lg" className="backdrop-blur-sm border border-white/20 text-lg px-12 py-4 rounded-full transition-all duration-300 hover:scale-105 text-white font-extrabold bg-cyan-800 hover:bg-cyan-700">
                      <Plus className="w-5 h-5 mr-2" />
                      Connect Your First Calendar
                    </Button>
                  </CardContent>
                </Card> : <div className="backdrop-blur-sm bg-white/90 rounded-lg p-6">
                  <MeetingsList />
                </div>}
            </div>}

          {activeTab === "connections" && <div className="backdrop-blur-sm bg-white/90 rounded-lg p-6">
              <CalendarConnections connectedCalendars={connectedCalendars} setConnectedCalendars={setConnectedCalendars} />
            </div>}

          {activeTab === "settings" && <div className="backdrop-blur-sm bg-white/90 rounded-lg p-6">
              <CalendarSettings />
            </div>}
        </div>
      </div>
    </div>;
};
export default CalendarHub;