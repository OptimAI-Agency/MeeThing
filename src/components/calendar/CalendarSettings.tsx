
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SettingsHeader from "./settings/SettingsHeader";
import BackgroundSettings from "./settings/BackgroundSettings";
import SyncSettings from "./settings/SyncSettings";
import NotificationSettings from "./settings/NotificationSettings";
import WellnessSection from "./settings/WellnessSection";

const CalendarSettings = () => {
  const [settings, setSettings] = useState({
    syncFrequency: "15",
    notifications: true,
    wellnessTips: true,
    autoBreaks: false,
    reminderTime: "10"
  });
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      variant: "success",
      title: "Settings Saved",
      description: "Your calendar preferences have been updated successfully.",
    });
  };

  const updateSetting = (key: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8">
      <SettingsHeader />

      <BackgroundSettings />

      <SyncSettings
        syncFrequency={settings.syncFrequency}
        onSyncFrequencyChange={(value) => updateSetting("syncFrequency", value)}
      />

      <NotificationSettings
        notifications={settings.notifications}
        wellnessTips={settings.wellnessTips}
        autoBreaks={settings.autoBreaks}
        reminderTime={settings.reminderTime}
        onNotificationsChange={(checked) => updateSetting("notifications", checked)}
        onWellnessTipsChange={(checked) => updateSetting("wellnessTips", checked)}
        onAutoBreaksChange={(checked) => updateSetting("autoBreaks", checked)}
        onReminderTimeChange={(value) => updateSetting("reminderTime", value)}
      />

      <WellnessSection />

      <div className="flex justify-center pt-4">
        <Button
          onClick={handleSave}
          className="bg-black hover:bg-gray-800 text-white border-0 rounded-xl px-8 py-3 font-medium transition-all duration-200 hover:scale-105 shadow-lg"
        >
          <Settings className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default CalendarSettings;
