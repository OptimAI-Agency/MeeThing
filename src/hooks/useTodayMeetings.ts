import { useMeetings } from "./useMeetings";
import { isToday } from "date-fns";

export function useTodayMeetings() {
  const query = useMeetings();

  const todayMeetings = (query.data ?? []).filter((meeting) =>
    isToday(new Date(meeting.start_time))
  );

  return {
    ...query,
    data: todayMeetings,
    allMeetings: query.data,
  };
}
