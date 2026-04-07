
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Bell, Map, Users, Clock, Heart } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Calendar,
      title: "Your Calendar",
      description: "Connect Google Calendar to see your meetings in a calmer, more human way.",
      badge: "Core",
      color: "text-blue-600"
    },
    {
      icon: Clock,
      title: "Meeting Analysis",
      description: "Get insights into meeting duration, frequency, and patterns to identify opportunities for improvement.",
      badge: "Analytics",
      color: "text-green-600"
    },
    {
      icon: Map,
      title: "Environment Suggestions",
      description: "Receive personalized recommendations for meeting locations based on your role, meeting type, and wellness goals.",
      badge: "AI-Powered",
      color: "text-purple-600"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Get timely reminders and suggestions to help you prepare for healthier, more productive meetings.",
      badge: "Productivity",
      color: "text-orange-600"
    },
    {
      icon: Users,
      title: "Role-Based Suggestions",
      description: "Tailored recommendations based on whether you're leading, participating, or presenting in meetings.",
      badge: "Personalized",
      color: "text-indigo-600"
    },
    {
      icon: Heart,
      title: "Wellness Tracking",
      description: "Monitor your meeting wellness score and track improvements in your digital meeting habits over time.",
      badge: "Wellness",
      color: "text-pink-600"
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything You Need for Healthier Meetings
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools designed to transform your digital meeting experience and promote wellness.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 wellness-shadow hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  <Badge variant="secondary" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
