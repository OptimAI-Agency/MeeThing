import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        toast({
          title: "Connection failed",
          description: errorDescription ?? error,
          variant: "destructive",
        });
        navigate("/calendar");
        return;
      }

      // CSRF validation: compare callback state to stored state
      const expectedState = sessionStorage.getItem("oauth_state");
      sessionStorage.removeItem("oauth_state"); // clear immediately, single-use

      if (!code || !state || state !== expectedState) {
        toast({
          title: "Connection failed",
          description: "Invalid or expired OAuth state. Please try connecting again.",
          variant: "destructive",
        });
        navigate("/calendar");
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login");
          return;
        }

        // Exchange the authorization code for tokens (stored in calendar_connections)
        const { error: oauthError } = await supabase.functions.invoke("google-oauth", {
          body: { code },
        });
        if (oauthError) throw new Error(oauthError.message);

        // Trigger an initial sync to populate the meetings table
        const { error: syncError } = await supabase.functions.invoke("google-calendar-sync");
        if (syncError) {
          // Non-fatal: connection succeeded but initial sync failed; user can retry
          console.warn("Initial sync failed:", syncError.message);
          toast({
            title: "Google Calendar connected",
            description: "Connected successfully. Syncing events may take a moment.",
          });
        } else {
          toast({ title: "Google Calendar connected", description: "Your events are ready." });
        }

        navigate("/calendar?tab=overview");
      } catch (err: unknown) {
        console.error("OAuth callback error:", err);
        toast({
          title: "Connection failed",
          description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
          variant: "destructive",
        });
        navigate("/calendar");
      }
    };

    handleCallback();
  }, []); // run once on mount

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-600 text-lg">Connecting your calendar…</p>
      </div>
    </div>
  );
};

export default AuthCallback;
