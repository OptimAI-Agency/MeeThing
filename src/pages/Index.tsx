
import MinimalHero from "@/components/MinimalHero";

const Index = () => {
  return (
    <div className="min-h-screen relative">
      <MinimalHero />
      
      {/* Trademark text at bottom */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
        <p className="text-white/70 text-sm font-medium">
          2025 MeeThing™ ~ All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Index;
