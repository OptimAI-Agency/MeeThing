
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Image } from "lucide-react";
import { useBackground, backgroundOptions, BackgroundOption } from "@/hooks/useBackground";

const BackgroundSettings = () => {
  const { selectedBackground, updateBackground } = useBackground();

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 edge-highlight spring-smooth">
      <div className="flex items-center space-x-4 pb-5 border-b border-white/10">
        <div className="w-12 h-12 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-2xl flex items-center justify-center backdrop-blur-sm ring-1 ring-white/20">
          <Image className="w-6 h-6 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">Background</h3>
          <p className="text-gray-600 text-sm mt-0.5">Choose your preferred nature scene</p>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-gray-900 font-medium">Background Scene</Label>
        <RadioGroup
          value={selectedBackground}
          onValueChange={(value) => updateBackground(value as BackgroundOption)}
          className="space-y-3"
        >
          {Object.entries(backgroundOptions).map(([key, option]) => (
            <label 
              key={key} 
              htmlFor={key}
              className="glass-light rounded-2xl p-4 border border-white/10 hover:border-white/25 spring-smooth cursor-pointer group active:scale-[0.98] flex items-center justify-between"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div 
                  className="w-16 h-16 rounded-xl bg-cover bg-center ring-2 ring-white/30 shadow-md flex-shrink-0"
                  style={{ backgroundImage: `url(${option.url})` }}
                />
                <span className="font-medium text-gray-900">{option.name}</span>
              </div>
              <RadioGroupItem value={key} id={key} className="flex-shrink-0" />
            </label>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};

export default BackgroundSettings;
