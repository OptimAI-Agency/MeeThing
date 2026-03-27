import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useMeetings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["meetings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("meetings")
        .select("id, title, description, start_time, end_time, location, attendees, metadata, calendar_connections(provider)")
        .gte("start_time", timeMin)
        .lte("start_time", timeMax)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}
