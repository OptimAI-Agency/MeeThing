
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserSettings, mapDbToUi, mapUiToDb, UiSettings } from "@/hooks/useUserSettings";
import SettingsHeader from "./settings/SettingsHeader";
import BackgroundSettings from "./settings/BackgroundSettings";
import SyncSettings from "./settings/SyncSettings";
import NotificationSettings from "./settings/NotificationSettings";
import WellnessSection from "./settings/WellnessSection";

const defaultSettings: UiSettings = {
  syncFrequency: "15",
  notifications: true,
  reminderTime: "10",
  wellnessTips: true,
  autoBreaks: false,
};

const CalendarSettings = () => {
  const { data: dbSettings, isLoading, isError, refetch, saveSettings } = useUserSettings();
  const { toast } = useToast();

  const [draft, setDraft] = useState<UiSettings>(defaultSettings);

  useEffect(() => {
    if (dbSettings) {
      setDraft(mapDbToUi(dbSettings));
    }
  }, [dbSettings]);

  const updateSetting = (key: keyof UiSettings, value: string | boolean) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveSettings.mutate(mapUiToDb(draft), {
      onSuccess: () => {
        toast({
          variant: "success",
          title: "Settings Saved",
          description: "Your calendar preferences have been updated successfully.",
        });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Save Failed",
          description: "Could not save your settings. Please try again.",
        });
      },
    });
  };

  return (
    <div className="space-y-8">
      <SettingsHeader />

      <BackgroundSettings />

      {isError && (
        <div className="glass-panel rounded-3xl p-6 text-center space-y-3">
          <p className="text-red-600 font-medium">Could not load your settings</p>
          <Button variant="outline" onClick={() => refetch()} className="rounded-xl">
            Try Again
          </Button>
        </div>
      )}

      <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
        <SyncSettings
          syncFrequency={draft.syncFrequency}
          onSyncFrequencyChange={(value) => updateSetting("syncFrequency", value)}
        />

        <NotificationSettings
          notifications={draft.notifications}
          wellnessTips={draft.wellnessTips}
          autoBreaks={draft.autoBreaks}
          reminderTime={draft.reminderTime}
          onNotificationsChange={(checked) => updateSetting("notifications", checked)}
          onWellnessTipsChange={(checked) => updateSetting("wellnessTips", checked)}
          onAutoBreaksChange={(checked) => updateSetting("autoBreaks", checked)}
          onReminderTimeChange={(value) => updateSetting("reminderTime", value)}
        />
      </div>

      <WellnessSection />

      <div className="flex justify-center pt-4">
        <Button
          onClick={handleSave}
          disabled={saveSettings.isPending || isLoading}
          className="bg-black hover:bg-gray-800 text-white border-0 rounded-xl px-8 py-3 font-medium transition-all duration-200 hover:scale-105 shadow-lg"
        >
          <Settings className="w-4 h-4 mr-2" />
          {saveSettings.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
};

export default CalendarSettings;
