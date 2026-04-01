
import CalendarHub from "@/components/calendar/CalendarHub";
import { useBackground } from "@/hooks/useBackground";

const Calendar = () => {
  const { backgroundUrl } = useBackground();

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat relative bg-[#0a1a2a]" style={{
      backgroundImage: `url('${backgroundUrl}')`
    }}>
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative z-10">
        <CalendarHub />
      </div>
    </div>
  );
};

export default Calendar;
