import { useSearchParams } from "react-router-dom";

export type ViewMode = "today" | "week";

export function useViewMode() {
  const [searchParams, setSearchParams] = useSearchParams();

  const viewMode: ViewMode =
    searchParams.get("view") === "week" ? "week" : "today";

  const setViewMode = (mode: ViewMode) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (mode === "today") {
          next.delete("view");
        } else {
          next.set("view", mode);
        }
        return next;
      },
      { replace: true }
    );
  };

  return { viewMode, setViewMode } as const;
}
