
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings, Bell, RefreshCw, Sparkles, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBackground, backgroundOptions, BackgroundOption } from "@/hooks/useBackground";

const CalendarSettings = () => {
  const [settings, setSettings] = useState({
    syncFrequency: "15",
    notifications: true,
    wellnessTips: true,
    autoBreaks: false,
    reminderTime: "10"
  });
  const { toast } = useToast();
  const { selectedBackground, updateBackground } = useBackground();

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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
          <Settings className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Calendar Settings</h2>
        <p className="text-gray-600 text-base max-w-md mx-auto leading-relaxed">
          Customize your calendar experience and wellness preferences
        </p>
      </div>

      {/* Background Selection */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 p-6 space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Image className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Background</h3>
            <p className="text-gray-600 text-sm">Choose your preferred nature scene</p>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-gray-800 font-medium">Background Scene</Label>
          <RadioGroup
            value={selectedBackground}
            onValueChange={(value) => updateBackground(value as BackgroundOption)}
            className="space-y-3"
          >
            {Object.entries(backgroundOptions).map(([key, option]) => (
              <div key={key} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <RadioGroupItem value={key} id={key} />
                <div className="flex-1">
                  <Label htmlFor={key} className="text-gray-900 font-medium cursor-pointer">
                    {option.name}
                  </Label>
                </div>
                <div 
                  className="w-16 h-10 rounded-md bg-cover bg-center border border-gray-200"
                  style={{ backgroundImage: `url(${option.url})` }}
                />
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      {/* Sync Preferences */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 p-6 space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Sync Preferences</h3>
            <p className="text-gray-600 text-sm">Configure how often your calendars update</p>
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="sync-frequency" className="text-gray-800 font-medium">Sync Frequency</Label>
          <Select
            value={settings.syncFrequency}
            onValueChange={(value) => updateSetting("syncFrequency", value)}
          >
            <SelectTrigger className="bg-gray-50/80 border-gray-200 rounded-xl h-12 text-gray-900 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-xl border-gray-200 rounded-xl shadow-xl">
              <SelectItem value="5" className="rounded-lg">Every 5 minutes</SelectItem>
              <SelectItem value="15" className="rounded-lg">Every 15 minutes</SelectItem>
              <SelectItem value="30" className="rounded-lg">Every 30 minutes</SelectItem>
              <SelectItem value="60" className="rounded-lg">Every hour</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 p-6 space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Notifications</h3>
            <p className="text-gray-600 text-sm">Manage your meeting reminders and alerts</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-gray-900 font-medium">Meeting Notifications</Label>
              <p className="text-sm text-gray-600">Get notified about upcoming meetings</p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) => updateSetting("notifications", checked)}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-gray-900 font-medium">Wellness Tips</Label>
              <p className="text-sm text-gray-600">Receive wellness tips before meetings</p>
            </div>
            <Switch
              checked={settings.wellnessTips}
              onCheckedChange={(checked) => updateSetting("wellnessTips", checked)}
              className="data-[state=checked]:bg-green-600"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-gray-900 font-medium">Auto Wellness Breaks</Label>
              <p className="text-sm text-gray-600">Automatically schedule breaks between meetings</p>
            </div>
            <Switch
              checked={settings.autoBreaks}
              onCheckedChange={(checked) => updateSetting("autoBreaks", checked)}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>

          {settings.notifications && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <Label htmlFor="reminder-time" className="text-gray-800 font-medium">Reminder Time</Label>
              <Select
                value={settings.reminderTime}
                onValueChange={(value) => updateSetting("reminderTime", value)}
              >
                <SelectTrigger className="bg-gray-50/80 border-gray-200 rounded-xl h-12 text-gray-900 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border-gray-200 rounded-xl shadow-xl">
                  <SelectItem value="5" className="rounded-lg">5 minutes before</SelectItem>
                  <SelectItem value="10" className="rounded-lg">10 minutes before</SelectItem>
                  <SelectItem value="15" className="rounded-lg">15 minutes before</SelectItem>
                  <SelectItem value="30" className="rounded-lg">30 minutes before</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Wellness Integration */}
      <div className="bg-gradient-to-br from-green-50/80 to-blue-50/80 backdrop-blur-xl rounded-2xl border border-green-200/50 p-6 space-y-4">
        <div className="flex items-center space-x-3 pb-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-green-900">Wellness Integration</h3>
            <p className="text-green-700 text-sm">MeeThing's unique approach to healthier meeting habits</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 text-sm text-green-800">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span>Smart break suggestions</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-green-800">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span>Mindfulness reminders</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-green-800">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span>Personalized wellness tips</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-green-800">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span>Focus time protection</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
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
