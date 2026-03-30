import { useState, useEffect, useRef, useCallback } from "react";
import { differenceInMinutes, isBefore, isAfter, addMinutes } from "date-fns";

interface Meeting {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

interface Settings {
  breathing_reminder_enabled: boolean;
  breathing_reminder_minutes: number;
}

export interface BreathingReminderState {
  showOverlay: boolean;
  showBanner: boolean;
  meetingTitle: string;
  meetingMinutesAway: number;
  dismissOverlay: () => void;
  dismissBanner: () => void;
  openOverlayFromBanner: () => void;
}

export function useBreathingReminder(
  meetings: Meeting[],
  settings: Settings | undefined
): BreathingReminderState {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingMinutesAway, setMeetingMinutesAway] = useState(0);

  // Use refs to avoid stale closures in setInterval callbacks (Pitfall 1)
  const meetingsRef = useRef(meetings);
  const settingsRef = useRef(settings);
  const shownIdsRef = useRef<Set<string>>(new Set());
  const hiddenAtRef = useRef<number | null>(null);
  const hasBeenVisibleRef = useRef(false);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync with latest props (Pitfall 1)
  useEffect(() => {
    meetingsRef.current = meetings;
  }, [meetings]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Find the soonest qualifying meeting for overlay trigger
  const findSoonestQualifyingMeeting = useCallback(
    (meetingsList: Meeting[], currentSettings: Settings | undefined) => {
      if (!currentSettings?.breathing_reminder_enabled) return null;

      const now = new Date();
      const reminderMinutes = currentSettings.breathing_reminder_minutes;

      for (const meeting of meetingsList) {
        const startTime = new Date(meeting.start_time);
        // Meeting must not have started yet
        if (isBefore(startTime, now)) continue;

        const minutesUntil = differenceInMinutes(startTime, now);
        // Check if within reminder window
        if (minutesUntil <= reminderMinutes && minutesUntil >= 0) {
          return { meeting, minutesUntil };
        }
      }
      return null;
    },
    []
  );

  // 30s polling interval (Pitfall 2: return cleanup clearInterval)
  useEffect(() => {
    const tick = () => {
      const result = findSoonestQualifyingMeeting(
        meetingsRef.current,
        settingsRef.current
      );

      if (result && !shownIdsRef.current.has(result.meeting.id)) {
        shownIdsRef.current.add(result.meeting.id);
        setMeetingTitle(result.meeting.title);
        setMeetingMinutesAway(result.minutesUntil);
        setShowOverlay(true);
      }
    };

    const intervalId = setInterval(tick, 30000);
    // Also run immediately on mount
    tick();

    return () => clearInterval(intervalId);
  }, [findSoonestQualifyingMeeting]);

  // Page Visibility API: detect missed reminders (Pitfall 3: hasBeenVisible guard)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
      } else {
        // Tab became visible
        if (!hasBeenVisibleRef.current) {
          // First visibility event -- skip (Pitfall 3)
          hasBeenVisibleRef.current = true;
          hiddenAtRef.current = null;
          return;
        }

        const currentSettings = settingsRef.current;
        const hiddenAt = hiddenAtRef.current;

        if (hiddenAt !== null && currentSettings?.breathing_reminder_enabled) {
          const now = new Date();
          const hiddenAtDate = new Date(hiddenAt);
          const reminderMinutes = currentSettings.breathing_reminder_minutes;

          // Find any meeting whose reminder window was passed while tab was hidden
          // AND meeting hasn't ended yet (D-15)
          const missedMeeting = meetingsRef.current.find((meeting) => {
            if (shownIdsRef.current.has(meeting.id)) return false;

            const startTime = new Date(meeting.start_time);
            const endTime = new Date(meeting.end_time);

            // Meeting must not have ended yet
            if (isBefore(endTime, now)) return false;

            // The trigger time is when reminder window starts (startTime - reminderMinutes)
            const triggerTime = addMinutes(startTime, -reminderMinutes);

            // Trigger time must fall between when tab was hidden and now
            return isAfter(triggerTime, hiddenAtDate) && isBefore(triggerTime, now);
          });

          if (missedMeeting) {
            shownIdsRef.current.add(missedMeeting.id);
            setMeetingTitle(missedMeeting.title);
            const minutesUntil = differenceInMinutes(new Date(missedMeeting.start_time), now);
            setMeetingMinutesAway(Math.max(0, minutesUntil));
            setShowBanner(true);

            // Auto-dismiss banner after 8s (D-14)
            if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
            bannerTimerRef.current = setTimeout(() => {
              setShowBanner(false);
            }, 8000);
          }
        }

        hiddenAtRef.current = null;
      }
    };

    // Set initial visible state
    if (!document.hidden) {
      hasBeenVisibleRef.current = true;
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  const dismissOverlay = useCallback(() => {
    // Do NOT remove from shownIds -- prevents re-triggering (Pitfall 6)
    setShowOverlay(false);
  }, []);

  const dismissBanner = useCallback(() => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setShowBanner(false);
  }, []);

  const openOverlayFromBanner = useCallback(() => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setShowBanner(false);
    setShowOverlay(true);
  }, []);

  return {
    showOverlay,
    showBanner,
    meetingTitle,
    meetingMinutesAway,
    dismissOverlay,
    dismissBanner,
    openOverlayFromBanner,
  };
}
