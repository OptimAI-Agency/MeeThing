
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";

interface SyncSettingsProps {
  syncFrequency: string;
  onSyncFrequencyChange: (value: string) => void;
}

const SyncSettings = ({ syncFrequency, onSyncFrequencyChange }: SyncSettingsProps) => {
  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 edge-highlight spring-smooth">
      <div className="flex items-center space-x-4 pb-5 border-b border-white/10">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-2xl flex items-center justify-center backdrop-blur-sm ring-1 ring-white/20">
          <RefreshCw className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">Sync Preferences</h3>
          <p className="text-gray-600 text-sm mt-0.5">Configure how often your calendars update</p>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="sync-frequency" className="text-gray-900 font-medium">Sync Frequency</Label>
        <Select
          value={syncFrequency}
          onValueChange={onSyncFrequencyChange}
        >
          <SelectTrigger className="glass-light rounded-2xl h-14 text-gray-900 border-white/20 focus:glass-focus spring-smooth hover:bg-white/60 active:scale-[0.98]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-heavy border-white/25 rounded-2xl shadow-2xl overflow-hidden">
            <SelectItem value="5" className="rounded-xl mx-2 my-1 focus:bg-blue-500/10 data-[state=checked]:bg-blue-500/15 spring-smooth">Every 5 minutes</SelectItem>
            <SelectItem value="15" className="rounded-xl mx-2 my-1 focus:bg-blue-500/10 data-[state=checked]:bg-blue-500/15 spring-smooth">Every 15 minutes</SelectItem>
            <SelectItem value="30" className="rounded-xl mx-2 my-1 focus:bg-blue-500/10 data-[state=checked]:bg-blue-500/15 spring-smooth">Every 30 minutes</SelectItem>
            <SelectItem value="60" className="rounded-xl mx-2 my-1 focus:bg-blue-500/10 data-[state=checked]:bg-blue-500/15 spring-smooth">Every hour</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default SyncSettings;
