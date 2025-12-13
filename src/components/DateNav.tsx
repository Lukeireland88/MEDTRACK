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
      <div className="flex gap-1.5 sm:gap-2 items-center flex-wrap mb-2">
        <button
          onClick={handlePrevDay}
          className="px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-50 active:translate-y-px text-sm sm:text-base min-w-[40px] touch-manipulation"
          title="Previous day"
          aria-label="Previous day"
        >
          ◀
        </button>
        <input
          type="date"
          value={toDateInputValue(selectedDate)}
          onChange={handleInputChange}
          className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 bg-white rounded-lg font-semibold text-gray-900 text-sm sm:text-base touch-manipulation"
        />
        <button
          onClick={handleNextDay}
          className="px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-50 active:translate-y-px text-sm sm:text-base min-w-[40px] touch-manipulation"
          title="Next day"
          aria-label="Next day"
        >
          ▶
        </button>
        <button
          onClick={handleToday}
          className="px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-50 active:translate-y-px text-sm sm:text-base touch-manipulation"
          title="Jump to today"
        >
          Today
        </button>
      </div>
      <div className="text-gray-600 text-xs sm:text-sm">
        {weekday} · {fullDate}
      </div>
    </div>
  );
}
