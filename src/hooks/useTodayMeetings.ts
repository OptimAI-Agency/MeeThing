import { useMeetings } from "./useMeetings";
import { isToday } from "date-fns";

export function useTodayMeetings() {
  const query = useMeetings();

  const todayMeetings = (query.data ?? []).filter((meeting) => {
    if (!meeting.start_time) return false;
    const d = new Date(meeting.start_time);
    if (isNaN(d.getTime())) {
      if (import.meta.env.DEV) {
        console.warn("useTodayMeetings: invalid start_time", meeting.id, meeting.start_time);
      }
      return false;
    }
    return isToday(d);
  });

  return {
    ...query,
    data: todayMeetings,
    allMeetings: query.data,
  };
}
