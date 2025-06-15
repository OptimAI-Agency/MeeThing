
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    color: "bg-red-500",
    icon: "🗓️",
    description: "Connect your Google Calendar to sync events and meetings"
  },
  {
    id: "microsoft",
    name: "Microsoft Outlook",
    provider: "microsoft",
    color: "bg-blue-600",
    icon: "📅",
    description: "Sync your Outlook calendar and Office 365 events"
  },
  {
    id: "apple",
    name: "Apple Calendar",
    provider: "apple",
    color: "bg-gray-700",
    icon: "🍎",
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
    
    // Simulate OAuth flow - in real implementation, this would redirect to provider's OAuth
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
    <div className="space-y-6">
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Calendar className="w-5 h-5" />
            Calendar Connections
          </CardTitle>
          <CardDescription className="text-gray-600">
            Connect your calendar providers to sync meetings and events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {calendarProviders.map((provider) => {
            const isConnected = connectedCalendars.includes(provider.id);
            const isConnecting = connecting === provider.id;

            return (
              <div
                key={provider.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-white/50 transition-colors bg-white/30 backdrop-blur-sm"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${provider.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                    {provider.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{provider.name}</h3>
                    <p className="text-sm text-gray-600">{provider.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {isConnected && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                  
                  {isConnected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(provider.id)}
                      className="border-gray-300 hover:bg-red-50 hover:border-red-300"
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleConnect(provider.id)}
                      disabled={isConnecting}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isConnecting ? "Connecting..." : "Connect"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {connectedCalendars.length > 0 && (
        <Card className="border-0 shadow-none bg-white/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-gray-800">Next Steps</CardTitle>
            <CardDescription className="text-gray-600">
              Your calendars are connected! Here's what happens next:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Events will sync automatically every 15 minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Meeting reminders will include wellness tips</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>View all your meetings in the Overview tab</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CalendarConnections;
