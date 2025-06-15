
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Map } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-green-50 to-blue-50 py-20 sm:py-32">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Transform Your Meetings with
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              {" "}Wellness-Focused{" "}
            </span>
            Suggestions
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            MeeThing helps you create healthier digital meetings by suggesting alternative locations, 
            analyzing your schedule, and promoting better meeting environments based on your role.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-3">
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Watch Demo
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="flex flex-col items-center p-6 bg-white/60 backdrop-blur-sm rounded-lg wellness-shadow">
              <Calendar className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Calendar Integration</h3>
              <p className="text-muted-foreground text-center">
                Seamlessly connect with your existing calendar apps
              </p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-white/60 backdrop-blur-sm rounded-lg wellness-shadow">
              <Clock className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Smart Analysis</h3>
              <p className="text-muted-foreground text-center">
                AI-powered insights into your meeting patterns
              </p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-white/60 backdrop-blur-sm rounded-lg wellness-shadow">
              <Map className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Environment Suggestions</h3>
              <p className="text-muted-foreground text-center">
                Personalized recommendations for healthier meeting spaces
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
