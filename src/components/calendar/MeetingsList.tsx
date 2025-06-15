
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
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 mb-4">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Today's Meetings</h2>
        <p className="text-gray-600 text-base max-w-md mx-auto leading-relaxed">
          Your upcoming meetings with wellness-focused insights
        </p>
      </div>

      {/* Meetings List */}
      <div className="space-y-4">
        {mockMeetings.map((meeting) => (
          <div
            key={meeting.id}
            className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/90 transition-all duration-300 hover:shadow-xl hover:shadow-black/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-1 h-16 ${meeting.color} rounded-full`}></div>
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900 text-lg">{meeting.title}</h3>
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{meeting.time} • {meeting.duration}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>{meeting.attendees} attendees</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">from {meeting.calendar}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {meeting.type === "important" && (
                  <Badge className="bg-red-100 text-red-800 border-red-200 font-medium px-3 py-1">
                    Important
                  </Badge>
                )}
                {meeting.type === "recurring" && (
                  <Badge className="bg-gray-100 text-gray-800 border-gray-200 font-medium px-3 py-1">
                    Recurring
                  </Badge>
                )}
                {meeting.type === "personal" && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 font-medium px-3 py-1">
                    Wellness
                  </Badge>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl px-4 py-2 transition-all duration-200 group-hover:scale-105"
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Wellness Tip */}
      <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-xl rounded-2xl border border-blue-200/50 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-blue-900">Wellness Tip</h3>
            <p className="text-blue-800 leading-relaxed">
              Consider scheduling 5-minute breathing breaks between meetings to maintain focus and reduce stress.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingsList;
