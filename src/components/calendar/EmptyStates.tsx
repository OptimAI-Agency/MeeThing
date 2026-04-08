import { Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COPY } from "@/copy/glossary";

interface NoMeetingsEmptyProps {
  weekMeetingCount?: number;
}

export const NoMeetingsEmpty = ({ weekMeetingCount }: NoMeetingsEmptyProps) => {
  return (
    <div className="text-center py-12 space-y-4">
      <Calendar className="w-16 h-16 text-green-500/40 mx-auto" />
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 text-lg">{COPY.empty.noMeetingsTitle}</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          {COPY.empty.noMeetingsBody}
        </p>
        {weekMeetingCount != null && weekMeetingCount > 0 && (
          <p className="text-gray-400 text-xs mt-2">
            {COPY.view.todayEmptyWithWeek.replace("{count}", String(weekMeetingCount))}
          </p>
        )}
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
        <h3 className="font-medium text-gray-900 text-lg">{COPY.empty.noConnectionTitle}</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          {COPY.empty.noConnectionBody}
        </p>
      </div>
      {onConnect && (
        <Button
          onClick={onConnect}
          className="bg-black hover:bg-gray-800 text-white rounded-xl px-6 py-2.5 min-h-[44px]"
        >
          {COPY.welcome.cta}
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
        <h3 className="font-medium text-gray-900 text-lg">{COPY.empty.noConnectionTitle}</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          {COPY.empty.noConnectionBody}
        </p>
      </div>
      {onConnect && (
        <Button
          onClick={onConnect}
          className="bg-black hover:bg-gray-800 text-white rounded-xl px-6 py-2.5 min-h-[44px]"
        >
          {COPY.welcome.cta}
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
        <h3 className="font-medium text-gray-700 text-lg">{COPY.errors.meetingsLoadTitle}</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          {COPY.errors.meetingsLoadBody}
        </p>
      </div>
      <Button
        onClick={onRetry}
        variant="outline"
        className="rounded-xl px-6 py-2.5 min-h-[44px] border-gray-200"
      >
        {COPY.errors.retry}
      </Button>
    </div>
  );
};
