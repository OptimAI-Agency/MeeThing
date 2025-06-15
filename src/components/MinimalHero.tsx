
import { Button } from "@/components/ui/button";

const MinimalHero = () => {
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Nature Background */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `url('https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1920&h=1080&fit=crop&auto=format')`
    }}>
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl text-white mb-12 leading-tight px-0 font-extrabold">
          Redefine your digital meetings.
          <span className="block bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Make it your MeeThing
          </span>
        </h1>
        
        <Button size="lg" className="backdrop-blur-sm border border-white/20 text-lg px-12 py-4 rounded-full transition-all duration-300 hover:scale-105 bg-slate-50 text-green-800 font-extrabold">Let's go for a walk</Button>
      </div>
    </section>;
};

export default MinimalHero;
