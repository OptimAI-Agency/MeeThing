import { AlertTriangle } from "lucide-react";
import { getQuoteForGap } from "@/lib/wellness-quotes";

interface Props {
  gapMinutes: number;
  meetingIndex: number;
}

const TransitionBufferWarning = ({ gapMinutes, meetingIndex }: Props) => {
  const label =
    gapMinutes === 0
      ? "No transition time"
      : `Only ${gapMinutes} min between meetings`;

  const quote = getQuoteForGap(meetingIndex, new Date().getDay());

  return (
    <div className="flex flex-col items-center py-3 px-4">
      {/* Dashed connector above */}
      <div className="w-px h-4 border-l-2 border-dashed border-amber-300" />

      {/* Warning label */}
      <div className="bg-amber-50/80 rounded-xl px-4 py-2 border border-amber-200/50 flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="text-amber-800 text-sm font-medium">{label}</span>
        </div>
        <p className="text-xs italic text-amber-700/70">{quote}</p>
      </div>

      {/* Dashed connector below */}
      <div className="w-px h-4 border-l-2 border-dashed border-amber-300" />
    </div>
  );
};

export default TransitionBufferWarning;
