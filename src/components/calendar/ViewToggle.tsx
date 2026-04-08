import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useViewMode, type ViewMode } from "@/hooks/useViewMode";
import { COPY } from "@/copy/glossary";

const ViewToggle = () => {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <div className="flex justify-center">
      <ToggleGroup
        type="single"
        value={viewMode}
        onValueChange={(value: string) => {
          if (value) setViewMode(value as ViewMode);
        }}
        aria-label={COPY.view.toggleAriaLabel}
        className="glass-light rounded-2xl p-1"
      >
        <ToggleGroupItem
          value="today"
          className={`rounded-xl px-4 py-2 text-sm font-normal min-h-[36px] spring-smooth ${
            viewMode === "today"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/40"
          }`}
        >
          {COPY.view.today}
        </ToggleGroupItem>
        <ToggleGroupItem
          value="week"
          className={`rounded-xl px-4 py-2 text-sm font-normal min-h-[36px] spring-smooth ${
            viewMode === "week"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/40"
          }`}
        >
          {COPY.view.week}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default ViewToggle;
