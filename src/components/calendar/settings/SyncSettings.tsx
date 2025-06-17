
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";

interface SyncSettingsProps {
  syncFrequency: string;
  onSyncFrequencyChange: (value: string) => void;
}

const SyncSettings = ({ syncFrequency, onSyncFrequencyChange }: SyncSettingsProps) => {
  return (
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
          value={syncFrequency}
          onValueChange={onSyncFrequencyChange}
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
  );
};

export default SyncSettings;
