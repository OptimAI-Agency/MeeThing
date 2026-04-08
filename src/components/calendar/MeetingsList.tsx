import { Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Lightbulb, MapPin } from "lucide-react";
import { useMeetings } from "@/hooks/useMeetings";
import { useUserSettings } from "@/hooks/useUserSettings";
import { format, formatDuration, intervalToDuration, differenceInMinutes } from "date-fns";
import MeetingCardSkeleton from "./MeetingCardSkeleton";
import { NoMeetingsEmpty, MeetingsError } from "./EmptyStates";
import TransitionBufferWarning from "@/components/wellness/TransitionBufferWarning";

const providerLabel: Record<string, string> = {
  google: "Google Calendar",
  microsoft: "Microsoft Outlook",
  apple: "Apple Calendar",
};

const providerColor: Record<string, string> = {
  google: "bg-blue-500",
  microsoft: "bg-indigo-500",
  apple: "bg-gray-500",
};

function getSafeHref(metadata: Record<string, unknown> | null): string | null {
  const link = metadata?.htmlLink;
  if (typeof link !== "string") return null;
  try {
    const url = new URL(link);
    if (url.protocol === "https:" || url.protocol === "http:") return link;
  } catch {
    // not a valid URL
  }
  return null;
}

const MeetingsList = () => {
  const { data: meetings = [], isLoading, error, refetch } = useMeetings();
  const { data: settings } = useUserSettings();
  const transitionBufferEnabled = settings?.transition_buffer_enabled ?? false;

  const header = (
    <div className="text-center space-y-3 px-4">
      <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 mb-2 sm:mb-4">
        <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Upcoming Meetings</h2>
      <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
        Your next 7 days of events
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        {header}
        <div className="space-y-4">
          <MeetingCardSkeleton />
          <MeetingCardSkeleton />
          <MeetingCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        {header}
        <MeetingsError onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      {header}

      {meetings.length === 0 ? (
        <NoMeetingsEmpty />
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting, index) => {
            const start = new Date(meeting.start_time);
            const end = new Date(meeting.end_time);
            const duration = intervalToDuration({ start, end });
            const durationLabel = formatDuration(duration, { format: ["hours", "minutes"] }) || "< 1 min";
            const provider = (meeting.calendar_connections as { provider?: string } | null)?.provider ?? "google";
            const attendees = Array.isArray(meeting.attendees) ? meeting.attendees : [];

            // Compute gap to next meeting for transition buffer warning
            const nextMeeting = meetings[index + 1];
            const gapToNext =
              nextMeeting && transitionBufferEnabled
                ? differenceInMinutes(new Date(nextMeeting.start_time), end)
                : null;

            return (
              <Fragment key={meeting.id}>
                <div
                  className="group glass-light rounded-2xl p-4 sm:p-6 hover:glass-panel spring-smooth cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1">
                      <div className={`w-1 h-16 sm:h-20 ${providerColor[provider] ?? "bg-blue-500"} rounded-full flex-shrink-0`} />
                      <div className="space-y-2 flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-base sm:text-lg truncate">{meeting.title}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>
                              {format(start, "EEE, MMM d · h:mm a")} · {durationLabel}
                            </span>
                          </div>
                          {attendees.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 flex-shrink-0" />
                              <span>{attendees.length} attendee{attendees.length !== 1 ? "s" : ""}</span>
                            </div>
                          )}
                          {meeting.location && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate max-w-[200px]">{meeting.location}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">from {providerLabel[provider] ?? provider}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                      {(() => {
                        const safeHref = getSafeHref(meeting.metadata as Record<string, unknown> | null);
                        return safeHref ? (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="rounded-xl px-4 py-2.5 min-h-[44px] spring-smooth active:scale-95 bg-white/50 hover:bg-white/80 border-white/30"
                          >
                            <a href={safeHref} target="_blank" rel="noopener noreferrer">
                              Open
                            </a>
                          </Button>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Transition buffer warning between consecutive back-to-back meetings */}
                {gapToNext !== null && gapToNext <= 5 && (
                  <TransitionBufferWarning gapMinutes={gapToNext} meetingIndex={index} />
                )}
              </Fragment>
            );
          })}
        </div>
      )}

      {/* Wellness tip */}
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
