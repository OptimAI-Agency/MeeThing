import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckCircle, Calendar, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCalendarConnections } from "@/hooks/useCalendarConnections";
import googleCalendarLogo from "@/assets/google-calendar-logo.png";
import microsoftOutlookLogo from "@/assets/microsoft-outlook-logo.png";
import appleCalendarLogo from "@/assets/apple-calendar-logo.png";

const calendarProviders = [
  {
    id: "google",
    name: "Google Calendar",
    icon: googleCalendarLogo,
    description: "Connect your Google Calendar to sync events and meetings",
    supported: true,
  },
  {
    id: "microsoft",
    name: "Microsoft Outlook",
    icon: microsoftOutlookLogo,
    description: "Sync your Outlook calendar and Office 365 events",
    supported: false,
  },
  {
    id: "apple",
    name: "Apple Calendar",
    icon: appleCalendarLogo,
    description: "Connect your iCloud calendar for seamless Apple ecosystem integration",
    supported: false,
  },
];

interface Props {
  connectedProviders: string[];
  syncing?: boolean;
}

const CalendarConnections = ({ connectedProviders, syncing }: Props) => {
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: connections = [] } = useCalendarConnections();

  const handleConnect = (providerId: string) => {
    if (providerId !== "google") {
      toast({
        title: "Coming soon",
        description: `${calendarProviders.find((p) => p.id === providerId)?.name} integration is coming soon.`,
      });
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast({
        title: "Configuration missing",
        description: "VITE_GOOGLE_CLIENT_ID is not set.",
        variant: "destructive",
      });
      return;
    }

    const redirectUri = `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`;
    const scope = "https://www.googleapis.com/auth/calendar.readonly";

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scope);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent"); // always return a refresh token
    const stateToken = crypto.randomUUID();
    sessionStorage.setItem("oauth_state", stateToken);
    url.searchParams.set("state", stateToken);

    window.location.href = url.toString();
  };

  const handleDisconnect = async (providerId: string) => {
    if (!user) return;
    setDisconnecting(providerId);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-disconnect");

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      queryClient.invalidateQueries({ queryKey: ["calendar-connections"] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });

      toast({
        title: "Calendar disconnected",
        description: `${calendarProviders.find((p) => p.id === providerId)?.name} has been disconnected and all synced meetings have been removed.`,
        variant: "destructive",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast({ title: "Failed to disconnect", description: message, variant: "destructive" });
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-2 sm:mb-4">
          <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Calendar Connections</h2>
        <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          Connect your calendar providers to sync meetings and events seamlessly
        </p>
      </div>

      {/* Provider cards */}
      <div className="space-y-4">
        {calendarProviders.map((provider) => {
          const isConnected = connectedProviders.includes(provider.id);
          const isDisconnecting = disconnecting === provider.id;

          return (
            <div
              key={provider.id}
              className="group relative bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 p-4 sm:p-6 hover:bg-white/90 transition-all duration-300 hover:shadow-xl hover:shadow-black/5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl flex items-center justify-center shadow-lg border border-gray-200 p-2 flex-shrink-0">
                    <img src={provider.icon} alt={`${provider.name} logo`} className="w-full h-full object-contain" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 text-base sm:text-lg">{provider.name}</h3>
                      {!provider.supported && (
                        <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-xs">Coming soon</Badge>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{provider.description}</p>
                    {isConnected && (() => {
                      const conn = connections.find((c) => c.provider === provider.id);
                      const lastSynced = conn?.last_synced_at;
                      return lastSynced ? (
                        <p className="text-xs text-gray-400 mt-1">
                          Last synced {formatDistanceToNow(new Date(lastSynced), { addSuffix: true })}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">Never synced</p>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 sm:flex-shrink-0">
                  {isConnected && (
                    <Badge className="bg-green-100 text-green-800 border-green-200 font-medium px-3 py-1.5 text-center">
                      <CheckCircle className="w-3 h-3 mr-1.5" />
                      Connected
                    </Badge>
                  )}

                  {isConnected ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isDisconnecting || syncing}
                          className="border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-all duration-200 rounded-xl px-4 py-2.5 min-h-[44px]"
                        >
                          {isDisconnecting ? "Disconnecting…" : "Disconnect"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disconnect Google Calendar?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove all synced meetings from MeeThing. You can reconnect at any time.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDisconnect(provider.id)}>
                            Disconnect
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button
                      onClick={() => handleConnect(provider.id)}
                      disabled={!provider.supported}
                      className="bg-black hover:bg-gray-800 text-white border-0 rounded-xl px-6 py-2.5 min-h-[44px] font-medium transition-all duration-200 group-hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                    >
                      <span>Connect</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Success state */}
      {connectedProviders.length > 0 && (
        <div className="bg-green-50/80 backdrop-blur-xl rounded-2xl border border-green-200/50 p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-900">All set!</h3>
              <p className="text-green-700 text-sm">Your calendars are connected and syncing</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center space-x-2 text-sm text-green-700">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
              <span>Events sync on connection</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-green-700">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
              <span>Next 7 days of events</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-green-700">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
              <span>View in Overview tab</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarConnections;
