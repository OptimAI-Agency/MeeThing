
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const MinimalHero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white mb-8 sm:mb-12 leading-tight font-extrabold">
          <span className="block sm:whitespace-nowrap">Redefine digital meetings.</span>
          <span className="block bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mt-2">
            Make it your MeeThing
          </span>
        </h1>
        
        <Button 
          size="lg" 
          className="backdrop-blur-sm border border-white/20 text-base sm:text-lg px-8 sm:px-12 py-3 sm:py-4 min-h-[48px] rounded-full transition-all duration-300 hover:scale-105 bg-slate-50 text-green-800 font-extrabold w-full sm:w-auto max-w-xs sm:max-w-none"
          onClick={() => navigate('/calendar')}
        >
          Let's go for a walk
        </Button>
      </div>
    </section>
  );
};

export default MinimalHero;
