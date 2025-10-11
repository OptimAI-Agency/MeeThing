
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
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-1 edge-highlight spring-smooth">
      <div className="flex items-center space-x-4 pb-5 border-b border-white/10">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-400/20 to-orange-600/20 rounded-2xl flex items-center justify-center backdrop-blur-sm ring-1 ring-white/20">
          <Bell className="w-6 h-6 text-orange-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">Notifications</h3>
          <p className="text-gray-600 text-sm mt-0.5">Manage your meeting reminders and alerts</p>
        </div>
      </div>

      <div className="space-y-0 divide-y divide-white/10">
        <div className="flex items-center justify-between gap-4 py-4 group">
          <div className="space-y-1 flex-1">
            <Label className="text-base font-medium text-gray-900 cursor-pointer">Meeting Notifications</Label>
            <p className="text-sm text-gray-600">Get notified about upcoming meetings</p>
          </div>
          <Switch
            checked={notifications}
            onCheckedChange={onNotificationsChange}
            className="flex-shrink-0"
          />
        </div>

        <div className="flex items-center justify-between gap-4 py-4 group">
          <div className="space-y-1 flex-1">
            <Label className="text-base font-medium text-gray-900 cursor-pointer">Wellness Tips</Label>
            <p className="text-sm text-gray-600">Receive wellness tips before meetings</p>
          </div>
          <Switch
            checked={wellnessTips}
            onCheckedChange={onWellnessTipsChange}
            className="flex-shrink-0"
          />
        </div>

        <div className="flex items-center justify-between gap-4 py-4 group">
          <div className="space-y-1 flex-1">
            <Label className="text-base font-medium text-gray-900 cursor-pointer">Auto Wellness Breaks</Label>
            <p className="text-sm text-gray-600">Automatically schedule breaks between meetings</p>
          </div>
          <Switch
            checked={autoBreaks}
            onCheckedChange={onAutoBreaksChange}
            className="flex-shrink-0"
          />
        </div>

        {notifications && (
          <div className="space-y-3 pt-5">
            <Label htmlFor="reminder-time" className="text-gray-900 font-medium">Reminder Time</Label>
            <Select
              value={reminderTime}
              onValueChange={onReminderTimeChange}
            >
              <SelectTrigger className="glass-light rounded-2xl h-14 text-gray-900 border-white/20 focus:glass-focus spring-smooth hover:bg-white/60 active:scale-[0.98]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-heavy border-white/25 rounded-2xl shadow-2xl overflow-hidden">
                <SelectItem value="5" className="rounded-xl mx-2 my-1 focus:bg-blue-500/10 data-[state=checked]:bg-blue-500/15 spring-smooth">5 minutes before</SelectItem>
                <SelectItem value="10" className="rounded-xl mx-2 my-1 focus:bg-blue-500/10 data-[state=checked]:bg-blue-500/15 spring-smooth">10 minutes before</SelectItem>
                <SelectItem value="15" className="rounded-xl mx-2 my-1 focus:bg-blue-500/10 data-[state=checked]:bg-blue-500/15 spring-smooth">15 minutes before</SelectItem>
                <SelectItem value="30" className="rounded-xl mx-2 my-1 focus:bg-blue-500/10 data-[state=checked]:bg-blue-500/15 spring-smooth">30 minutes before</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
