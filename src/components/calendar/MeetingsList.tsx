
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users } from "lucide-react";

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Today's Meetings
          </CardTitle>
          <CardDescription>
            Your upcoming meetings with wellness-focused insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-12 ${meeting.color} rounded-full`}></div>
                <div>
                  <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {meeting.time} • {meeting.duration}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {meeting.attendees} attendees
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">from {meeting.calendar}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {meeting.type === "important" && (
                  <Badge variant="destructive">Important</Badge>
                )}
                {meeting.type === "recurring" && (
                  <Badge variant="secondary">Recurring</Badge>
                )}
                {meeting.type === "personal" && (
                  <Badge className="bg-green-100 text-green-800">Wellness</Badge>
                )}
                
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">Wellness Tip</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700">
            💡 Consider scheduling 5-minute breathing breaks between meetings to maintain focus and reduce stress.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MeetingsList;
