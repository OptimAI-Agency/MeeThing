import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Bell, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
      title: "Settings Saved",
      description: "Your calendar preferences have been updated successfully.",
    });
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Sync Preferences
          </CardTitle>
          <CardDescription>
            Configure how often your calendars sync and update
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="sync-frequency">Sync Frequency</Label>
            <Select
              value={settings.syncFrequency}
              onValueChange={(value) => updateSetting("syncFrequency", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Every 5 minutes</SelectItem>
                <SelectItem value="15">Every 15 minutes</SelectItem>
                <SelectItem value="30">Every 30 minutes</SelectItem>
                <SelectItem value="60">Every hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage your meeting reminders and wellness notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Meeting Notifications</Label>
              <p className="text-sm text-gray-500">Get notified about upcoming meetings</p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) => updateSetting("notifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Wellness Tips</Label>
              <p className="text-sm text-gray-500">Receive wellness tips before meetings</p>
            </div>
            <Switch
              checked={settings.wellnessTips}
              onCheckedChange={(checked) => updateSetting("wellnessTips", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Wellness Breaks</Label>
              <p className="text-sm text-gray-500">Automatically schedule breaks between meetings</p>
            </div>
            <Switch
              checked={settings.autoBreaks}
              onCheckedChange={(checked) => updateSetting("autoBreaks", checked)}
            />
          </div>

          {settings.notifications && (
            <div className="space-y-2">
              <Label htmlFor="reminder-time">Reminder Time</Label>
              <Select
                value={settings.reminderTime}
                onValueChange={(value) => updateSetting("reminderTime", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes before</SelectItem>
                  <SelectItem value="10">10 minutes before</SelectItem>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">Wellness Integration</CardTitle>
          <CardDescription className="text-green-600">
            MeeThing's unique approach to healthier meeting habits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-green-700">
            <p>✨ Smart break suggestions between back-to-back meetings</p>
            <p>🌱 Mindfulness reminders before important calls</p>
            <p>💡 Wellness tips personalized to your meeting patterns</p>
            <p>🎯 Focus time protection for deep work sessions</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
        >
          <Settings className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default CalendarSettings;
