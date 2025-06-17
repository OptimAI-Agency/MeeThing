
import MinimalHero from "@/components/MinimalHero";
import { useBackground } from "@/hooks/useBackground";

const Index = () => {
  const { backgroundUrl } = useBackground();

  return (
    <div className="min-h-screen relative bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `url('${backgroundUrl}')`
    }}>
      <div className="absolute inset-0 bg-black/30"></div>
      <div className="relative z-10">
        <MinimalHero />
        
        {/* Trademark text at bottom */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <p className="text-white/70 text-sm font-medium">
            2025 MeeThing™ ~ All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
