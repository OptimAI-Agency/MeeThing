import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MissedReminderBannerProps {
  meetingTitle: string;
  onDismiss: () => void;
  onOpenOverlay: () => void;
}

const MissedReminderBanner = ({
  meetingTitle,
  onDismiss,
  onOpenOverlay,
}: MissedReminderBannerProps) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-40 glass-panel rounded-b-2xl p-4 shadow-lg animate-toast-in">
      <div className="flex items-center justify-between gap-3">
        <p className="text-gray-700 text-sm">
          You had a breathing moment before {meetingTitle}.{" "}
          <button
            onClick={onOpenOverlay}
            className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            Take a moment now
          </button>
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="shrink-0 h-8 w-8 rounded-xl hover:bg-gray-100/60"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-gray-500" />
        </Button>
      </div>
    </div>
  );
};

export default MissedReminderBanner;
