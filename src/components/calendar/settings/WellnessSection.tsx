
import { Sparkles } from "lucide-react";

const WellnessSection = () => {
  return (
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
  );
};

export default WellnessSection;
