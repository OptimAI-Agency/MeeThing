
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import googleCalendarLogo from "@/assets/google-calendar-logo.png";
import microsoftOutlookLogo from "@/assets/microsoft-outlook-logo.png";
import appleCalendarLogo from "@/assets/apple-calendar-logo.png";

interface CalendarConnection {
  id: string;
  name: string;
  provider: "google" | "microsoft" | "apple";
  color: string;
  icon: string;
  description: string;
}

const calendarProviders: CalendarConnection[] = [
  {
    id: "google",
    name: "Google Calendar",
    provider: "google",
    color: "bg-white",
    icon: googleCalendarLogo,
    description: "Connect your Google Calendar to sync events and meetings"
  },
  {
    id: "microsoft",
    name: "Microsoft Outlook",
    provider: "microsoft",
    color: "bg-white",
    icon: microsoftOutlookLogo,
    description: "Sync your Outlook calendar and Office 365 events"
  },
  {
    id: "apple",
    name: "Apple Calendar",
    provider: "apple",
    color: "bg-white",
    icon: appleCalendarLogo,
    description: "Connect your iCloud calendar for seamless Apple ecosystem integration"
  }
];

interface CalendarConnectionsProps {
  connectedCalendars: string[];
  setConnectedCalendars: (calendars: string[]) => void;
}

const CalendarConnections = ({ connectedCalendars, setConnectedCalendars }: CalendarConnectionsProps) => {
  const [connecting, setConnecting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleConnect = async (providerId: string) => {
    setConnecting(providerId);
    
    setTimeout(() => {
      setConnectedCalendars([...connectedCalendars, providerId]);
      setConnecting(null);
      
      const provider = calendarProviders.find(p => p.id === providerId);
      toast({
        title: "Calendar Connected!",
        description: `Successfully connected ${provider?.name}. Your events will sync shortly.`,
      });
    }, 2000);
  };

  const handleDisconnect = (providerId: string) => {
    setConnectedCalendars(connectedCalendars.filter(id => id !== providerId));
    
    const provider = calendarProviders.find(p => p.id === providerId);
    toast({
      title: "Calendar Disconnected",
      description: `${provider?.name} has been disconnected from your account.`,
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Calendar Connections</h2>
        <p className="text-gray-600 text-base max-w-md mx-auto leading-relaxed">
          Connect your calendar providers to sync meetings and events seamlessly
        </p>
      </div>

      {/* Connection Cards */}
      <div className="space-y-4">
        {calendarProviders.map((provider) => {
          const isConnected = connectedCalendars.includes(provider.id);
          const isConnecting = connecting === provider.id;

          return (
            <div
              key={provider.id}
              className="group relative bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/90 transition-all duration-300 hover:shadow-xl hover:shadow-black/5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 ${provider.color} rounded-xl flex items-center justify-center shadow-lg border border-gray-200 p-2`}>
                    <img src={provider.icon} alt={`${provider.name} logo`} className="w-full h-full object-contain" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium text-gray-900 text-lg">{provider.name}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed max-w-xs">{provider.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {isConnected && (
                    <Badge className="bg-green-100 text-green-800 border-green-200 font-medium px-3 py-1">
                      <CheckCircle className="w-3 h-3 mr-1.5" />
                      Connected
                    </Badge>
                  )}
                  
                  {isConnected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(provider.id)}
                      className="border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-all duration-200 rounded-xl px-4 py-2"
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleConnect(provider.id)}
                      disabled={isConnecting}
                      className="bg-black hover:bg-gray-800 text-white border-0 rounded-xl px-6 py-2 font-medium transition-all duration-200 group-hover:scale-105 shadow-lg"
                    >
                      {isConnecting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Connecting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>Connect</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Success State */}
      {connectedCalendars.length > 0 && (
        <div className="bg-green-50/80 backdrop-blur-xl rounded-2xl border border-green-200/50 p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-900">All Set!</h3>
              <p className="text-green-700 text-sm">Your calendars are connected and ready to sync</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center space-x-2 text-sm text-green-700">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span>Auto-sync every 15 minutes</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-green-700">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span>Wellness tips included</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-green-700">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span>View in Overview tab</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarConnections;
