import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UiSettings {
  syncFrequency: string;
  notifications: boolean;
  reminderTime: string;
  wellnessTips: boolean;
  autoBreaks: boolean;
}

interface DbPayload {
  sync_frequency_minutes: number;
  notifications_enabled: boolean;
  reminder_minutes: number;
  wellness_tips_enabled: boolean;
  auto_breaks_enabled: boolean;
}

export function mapDbToUi(db: {
  sync_frequency_minutes: number;
  notifications_enabled: boolean;
  reminder_minutes: number;
  wellness_tips_enabled: boolean;
  auto_breaks_enabled: boolean;
}): UiSettings {
  return {
    syncFrequency: String(db.sync_frequency_minutes),
    notifications: db.notifications_enabled,
    reminderTime: String(db.reminder_minutes),
    wellnessTips: db.wellness_tips_enabled,
    autoBreaks: db.auto_breaks_enabled,
  };
}

export function mapUiToDb(ui: UiSettings): DbPayload {
  return {
    sync_frequency_minutes: parseInt(ui.syncFrequency, 10),
    notifications_enabled: ui.notifications,
    reminder_minutes: parseInt(ui.reminderTime, 10),
    wellness_tips_enabled: ui.wellnessTips,
    auto_breaks_enabled: ui.autoBreaks,
  };
}

export function useUserSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["user-settings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select(
          "sync_frequency_minutes, notifications_enabled, reminder_minutes, wellness_tips_enabled, auto_breaks_enabled, breathing_reminder_enabled, breathing_reminder_minutes, transition_buffer_enabled"
        )
        .eq("user_id", user!.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const saveSettings = useMutation({
    mutationFn: async (payload: DbPayload) => {
      const { error } = await supabase
        .from("user_settings")
        .update(payload)
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    saveSettings,
  };
}
