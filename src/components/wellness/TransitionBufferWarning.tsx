import { Wind } from "lucide-react";
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
      <div className="w-px h-4 border-l-2 border-dashed border-primary/25" />

      {/* Awareness label — calm sage tone, not alarm amber */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-primary/15 flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-slate-700 text-sm font-medium">{label}</span>
        </div>
        <p className="text-xs italic text-slate-500">{quote}</p>
      </div>

      {/* Dashed connector below */}
      <div className="w-px h-4 border-l-2 border-dashed border-primary/25" />
    </div>
  );
};

export default TransitionBufferWarning;
