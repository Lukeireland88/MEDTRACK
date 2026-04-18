import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { toDateInputValue, fromDateInputValue, formatDateLine } from '../utils/dateUtils';

interface DateNavProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DateNav({ selectedDate, onDateChange }: DateNavProps) {
  const { weekday, fullDate } = formatDateLine(selectedDate);

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newDate = fromDateInputValue(e.target.value);
      onDateChange(newDate);
    }
  };

  return (
    <div>
      <div className="flex gap-1.5 sm:gap-2 items-center flex-wrap mb-2 rounded-xl border border-slate-200/90 bg-white/90 shadow-sm px-2 py-2">
        <button
          onClick={handlePrevDay}
          className="px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200 bg-white text-slate-900 rounded-lg font-semibold hover:bg-slate-50 active:translate-y-px text-sm sm:text-base min-w-[40px] touch-manipulation"
          title="Previous day"
          aria-label="Previous day"
        >
          ◀
        </button>
        <input
          type="date"
          value={toDateInputValue(selectedDate)}
          onChange={handleInputChange}
          className="px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 bg-white rounded-lg font-semibold text-slate-900 text-sm sm:text-base touch-manipulation"
        />
        <button
          onClick={handleNextDay}
          className="px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200 bg-white text-slate-900 rounded-lg font-semibold hover:bg-slate-50 active:translate-y-px text-sm sm:text-base min-w-[40px] touch-manipulation"
          title="Next day"
          aria-label="Next day"
        >
          ▶
        </button>
        <button
          onClick={handleToday}
          className="px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200 bg-white text-slate-900 rounded-lg font-semibold hover:bg-slate-50 active:translate-y-px text-sm sm:text-base touch-manipulation"
          title="Jump to today"
        >
          Today
        </button>
        <Link
          to="/history"
          className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200 bg-white text-slate-900 rounded-lg font-semibold hover:bg-slate-50 active:translate-y-px text-sm sm:text-base touch-manipulation"
          title="View history across all medications"
        >
          <ClipboardList className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" />
          <span className="hidden sm:inline">History</span>
        </Link>
      </div>
      <div className="text-slate-500 text-xs sm:text-sm font-medium tabular-nums">
        {weekday} · {fullDate}
      </div>
    </div>
  );
}
