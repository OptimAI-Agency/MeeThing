
import { Settings } from "lucide-react";

const SettingsHeader = () => {
  return (
    <div className="text-center space-y-3">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
        <Settings className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Calendar Settings</h2>
      <p className="text-gray-600 text-base max-w-md mx-auto leading-relaxed">
        Customize your calendar experience and wellness preferences
      </p>
    </div>
  );
};

export default SettingsHeader;
