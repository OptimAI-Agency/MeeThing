import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import BreathingCircle from "./BreathingCircle";

interface BreathingOverlayProps {
  onDismiss: () => void;
  meetingTitle: string;
  minutesAway: number;
}

const BreathingOverlay = ({ onDismiss, meetingTitle, minutesAway }: BreathingOverlayProps) => {
  // ESC key handler (D-05)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onDismiss]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-dark rounded-3xl p-8 sm:p-10 max-w-md w-full mx-4 text-center space-y-6">
        {/* Static calm header (D-02) */}
        <p className="text-white/80 text-sm">This moment is yours before your next meeting.</p>

        {/* Animated breathing circle with phase text (D-03, D-04) */}
        <BreathingCircle />

        {/* Meeting context (D-06) */}
        <p className="text-white/70 text-sm">
          {meetingTitle} in {minutesAway} minute{minutesAway !== 1 ? "s" : ""}
        </p>

        {/* Dismiss button -- always visible (D-05) */}
        <Button
          onClick={onDismiss}
          variant="outline"
          className="rounded-2xl border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent"
        >
          Dismiss
        </Button>
      </div>
    </div>,
    document.body
  );
};

export default BreathingOverlay;
