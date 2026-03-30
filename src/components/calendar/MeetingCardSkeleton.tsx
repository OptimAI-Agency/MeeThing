import { Skeleton } from "@/components/ui/skeleton";

const MeetingCardSkeleton = () => {
  return (
    <div className="glass-light rounded-2xl p-4 sm:p-6">
      <div className="flex items-start space-x-4">
        {/* Provider color bar */}
        <Skeleton className="w-1 h-16 sm:h-20 rounded-full flex-shrink-0" />
        {/* Text content */}
        <div className="space-y-2 flex-1 min-w-0">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  );
};

export default MeetingCardSkeleton;
