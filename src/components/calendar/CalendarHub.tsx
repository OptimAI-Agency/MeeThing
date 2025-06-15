
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Calendar Integration
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Connect your calendars and streamline your meeting management with MeeThing's wellness-focused approach.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-full p-1 shadow-lg">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            onClick={() => setActiveTab("overview")}
            className="rounded-full px-6"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={activeTab === "connections" ? "default" : "ghost"}
            onClick={() => setActiveTab("connections")}
            className="rounded-full px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Connections
          </Button>
          <Button
            variant={activeTab === "settings" ? "default" : "ghost"}
            onClick={() => setActiveTab("settings")}
            className="rounded-full px-6"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {connectedCalendars.length === 0 ? (
              <Card className="text-center py-12">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-700">
                    Welcome to Calendar Integration
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Connect your calendars to get started with seamless meeting management.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setActiveTab("connections")}
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Connect Your First Calendar
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <MeetingsList />
            )}
          </div>
        )}

        {activeTab === "connections" && (
          <CalendarConnections
            connectedCalendars={connectedCalendars}
            setConnectedCalendars={setConnectedCalendars}
          />
        )}

        {activeTab === "settings" && (
          <CalendarSettings />
        )}
      </div>
    </div>
  );
};

export default CalendarHub;
