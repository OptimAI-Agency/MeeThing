
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell } from "lucide-react";

interface NotificationSettingsProps {
  notifications: boolean;
  wellnessTips: boolean;
  autoBreaks: boolean;
  reminderTime: string;
  onNotificationsChange: (checked: boolean) => void;
  onWellnessTipsChange: (checked: boolean) => void;
  onAutoBreaksChange: (checked: boolean) => void;
  onReminderTimeChange: (value: string) => void;
}

const NotificationSettings = ({
  notifications,
  wellnessTips,
  autoBreaks,
  reminderTime,
  onNotificationsChange,
  onWellnessTipsChange,
  onAutoBreaksChange,
  onReminderTimeChange
}: NotificationSettingsProps) => {
  return (
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
            checked={notifications}
            onCheckedChange={onNotificationsChange}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <Label className="text-gray-900 font-medium">Wellness Tips</Label>
            <p className="text-sm text-gray-600">Receive wellness tips before meetings</p>
          </div>
          <Switch
            checked={wellnessTips}
            onCheckedChange={onWellnessTipsChange}
            className="data-[state=checked]:bg-green-600"
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <Label className="text-gray-900 font-medium">Auto Wellness Breaks</Label>
            <p className="text-sm text-gray-600">Automatically schedule breaks between meetings</p>
          </div>
          <Switch
            checked={autoBreaks}
            onCheckedChange={onAutoBreaksChange}
            className="data-[state=checked]:bg-purple-600"
          />
        </div>

        {notifications && (
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <Label htmlFor="reminder-time" className="text-gray-800 font-medium">Reminder Time</Label>
            <Select
              value={reminderTime}
              onValueChange={onReminderTimeChange}
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
  );
};

export default NotificationSettings;
