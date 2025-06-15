
import { Heart } from "lucide-react";

const MinimalFooter = () => {
  return (
    <footer className="bg-white/90 backdrop-blur-sm border-t border-gray-200/50 py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-blue-500"></div>
            <span className="text-lg font-semibold text-gray-900">MeeThing</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span>for healthier meetings</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MinimalFooter;
