
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Image } from "lucide-react";
import { useBackground, backgroundOptions, BackgroundOption } from "@/hooks/useBackground";

const BackgroundSettings = () => {
  const { selectedBackground, updateBackground } = useBackground();

  return (
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
  );
};

export default BackgroundSettings;
