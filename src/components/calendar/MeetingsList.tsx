
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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-3 px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 mb-2 sm:mb-4">
          <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Today's Meetings</h2>
        <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          Your upcoming meetings with wellness-focused insights
        </p>
      </div>

      {/* Meetings List */}
      <div className="space-y-4">
        {mockMeetings.map((meeting) => (
          <div
            key={meeting.id}
            className="group glass-light rounded-2xl p-4 sm:p-6 hover:glass-panel spring-smooth cursor-pointer active:scale-[0.99]"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1">
                <div className={`w-1 h-16 sm:h-20 ${meeting.color} rounded-full flex-shrink-0`}></div>
                <div className="space-y-2 flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-base sm:text-lg">{meeting.title}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{meeting.time} • {meeting.duration}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span>{meeting.attendees} attendees</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">from {meeting.calendar}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {meeting.type === "important" && (
                  <Badge className="bg-red-100 text-red-800 border-red-200 font-medium px-3 py-1.5 text-center">
                    Important
                  </Badge>
                )}
                {meeting.type === "recurring" && (
                  <Badge className="bg-gray-100 text-gray-800 border-gray-200 font-medium px-3 py-1.5 text-center">
                    Recurring
                  </Badge>
                )}
                {meeting.type === "personal" && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 font-medium px-3 py-1.5 text-center">
                    Wellness
                  </Badge>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl px-4 py-2.5 min-h-[44px] spring-smooth active:scale-95 bg-white/50 hover:bg-white/80 border-white/30"
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Wellness Tip */}
      <div className="glass-light rounded-2xl border border-blue-200/30 p-6 spring-smooth">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm ring-1 ring-white/20">
            <Lightbulb className="w-6 h-6 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 text-lg">Wellness Tip</h3>
            <p className="text-gray-700 leading-relaxed">
              Consider scheduling 5-minute breathing breaks between meetings to maintain focus and reduce stress.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingsList;
