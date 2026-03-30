export const WELLNESS_QUOTES = [
  "You can do anything, but not everything.",
  "Take care of your own time first.",
  "Rest is not idleness.",
  "Between stimulus and response there is a space.",
  "The present moment is filled with joy and happiness.",
  "Almost everything will work again if you unplug it for a few minutes.",
  "Slow down. Calm down. Don't worry. Don't hurry. Trust the process.",
  "Breathing in, I calm my body. Breathing out, I smile.",
] as const;

export function getQuoteForGap(meetingIndex: number, dayOfWeek: number): string {
  const index = (meetingIndex + dayOfWeek) % WELLNESS_QUOTES.length;
  return WELLNESS_QUOTES[index];
}
