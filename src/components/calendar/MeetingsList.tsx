
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Lightbulb } from "lucide-react";

// Mock meeting data - in real app this would come from connected calendars
const mockMeetings = [
  {
    id: "1",
    title: "Team Standup",
    time: "9:00 AM",
    duration: "30 min",
    attendees: 5,
    type: "recurring",
    calendar: "Google Calendar",
    color: "bg-blue-500"
  },
  {
    id: "2",
    title: "Client Presentation",
    time: "2:00 PM",
    duration: "1 hour",
    attendees: 8,
    type: "important",
    calendar: "Microsoft Outlook",
    color: "bg-purple-500"
  },
  {
    id: "3",
    title: "Wellness Break",
    time: "3:30 PM",
    duration: "15 min",
    attendees: 1,
    type: "personal",
    calendar: "Apple Calendar",
    color: "bg-green-500"
  }
];

const MeetingsList = () => {
  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6 animate-breathe">
          <Calendar className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl text-foreground text-wellness-heading">Today's Mindful Schedule</h2>
        <p className="text-muted-foreground text-wellness-body max-w-lg mx-auto">
          Your upcoming meetings crafted with intention and wellness in mind
        </p>
      </div>

      {/* Meetings List */}
      <div className="space-y-6">
        {mockMeetings.map((meeting, index) => (
          <div
            key={meeting.id}
            className="group bg-card/60 wellness-blur rounded-3xl border border-border/50 p-8 hover:bg-card/80 transition-all duration-500 wellness-shadow-gentle hover:wellness-shadow-soft animate-subtle-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className={`w-2 h-20 ${meeting.color} rounded-full opacity-60`}></div>
                <div className="space-y-3">
                  <h3 className="text-xl text-card-foreground text-wellness-heading">{meeting.title}</h3>
                  <div className="flex items-center space-x-8 text-muted-foreground text-wellness-body">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5" />
                      <span>{meeting.time} • {meeting.duration}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5" />
                      <span>{meeting.attendees} attendees</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground/70">from {meeting.calendar}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {meeting.type === "important" && (
                  <Badge className="bg-destructive/10 text-destructive border-destructive/20 px-4 py-2 rounded-2xl text-wellness-body">
                    Important
                  </Badge>
                )}
                {meeting.type === "recurring" && (
                  <Badge className="bg-muted text-muted-foreground border-border px-4 py-2 rounded-2xl text-wellness-body">
                    Recurring
                  </Badge>
                )}
                {meeting.type === "personal" && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 rounded-2xl text-wellness-body">
                    Wellness
                  </Badge>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-border hover:border-border/80 hover:bg-muted/50 rounded-2xl px-6 py-3 transition-all duration-300 group-hover:scale-105 text-wellness-body"
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Wellness Tip */}
      <div className="wellness-gradient-neutral rounded-3xl border border-border/30 p-8 wellness-shadow-gentle animate-gentle-float">
        <div className="flex items-start space-x-6">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0 animate-soft-pulse">
            <Lightbulb className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-3">
            <h3 className="text-lg text-card-foreground text-wellness-heading">Today's Wellness Insight</h3>
            <p className="text-muted-foreground text-wellness-body">
              Create gentle transitions between meetings with 3-minute mindful breathing exercises. This simple practice can enhance focus, reduce stress, and bring more presence to your day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingsList;
