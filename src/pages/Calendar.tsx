
import CalendarHub from "@/components/calendar/CalendarHub";

const Calendar = () => {
  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat relative" style={{
      backgroundImage: `url('https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1920&h=1080&fit=crop&auto=format')`
    }}>
      <div className="absolute inset-0 bg-black/30"></div>
      <div className="relative z-10">
        <CalendarHub />
      </div>
    </div>
  );
};

export default Calendar;
