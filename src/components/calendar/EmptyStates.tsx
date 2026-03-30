import { Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const NoMeetingsEmpty = () => {
  return (
    <div className="text-center py-12 space-y-4">
      <Calendar className="w-16 h-16 text-green-500/40 mx-auto" />
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 text-lg">Your schedule is clear</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Enjoy the space — events from your connected calendars will appear here
        </p>
      </div>
    </div>
  );
};

interface NoCalendarEmptyProps {
  onConnect?: () => void;
}

export const NoCalendarEmpty = ({ onConnect }: NoCalendarEmptyProps) => {
  return (
    <div className="text-center py-12 space-y-4">
      <Calendar className="w-16 h-16 text-blue-500/40 mx-auto" />
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 text-lg">Let's get you connected</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Connect your Google Calendar to see your upcoming meetings
        </p>
      </div>
      {onConnect && (
        <Button
          onClick={onConnect}
          className="bg-black hover:bg-gray-800 text-white rounded-xl px-6 py-2.5 min-h-[44px]"
        >
          Connect Calendar
        </Button>
      )}
    </div>
  );
};

interface NoConnectionsEmptyProps {
  onConnect?: () => void;
}

export const NoConnectionsEmpty = ({ onConnect }: NoConnectionsEmptyProps) => {
  return (
    <div className="text-center py-12 space-y-4">
      <Calendar className="w-16 h-16 text-blue-500/40 mx-auto" />
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 text-lg">Let's get you connected</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Connect your Google Calendar to start syncing your meetings
        </p>
      </div>
      {onConnect && (
        <Button
          onClick={onConnect}
          className="bg-black hover:bg-gray-800 text-white rounded-xl px-6 py-2.5 min-h-[44px]"
        >
          Connect Google Calendar
        </Button>
      )}
    </div>
  );
};

interface MeetingsErrorProps {
  onRetry: () => void;
}

export const MeetingsError = ({ onRetry }: MeetingsErrorProps) => {
  return (
    <div className="text-center py-12 space-y-4">
      <AlertCircle className="w-12 h-12 text-red-400/60 mx-auto" />
      <div className="space-y-2">
        <h3 className="font-medium text-gray-700 text-lg">Couldn't refresh your calendar</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Something went wrong while loading your meetings.
        </p>
      </div>
      <Button
        onClick={onRetry}
        variant="outline"
        className="rounded-xl px-6 py-2.5 min-h-[44px] border-gray-200"
      >
        Try again
      </Button>
    </div>
  );
};
