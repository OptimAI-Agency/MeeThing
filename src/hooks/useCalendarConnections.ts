import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCalendarConnections() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["calendar-connections", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_connections")
        .select("id, provider, connected_at, last_synced_at, is_active")
        .eq("is_active", true)
        .order("connected_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}
