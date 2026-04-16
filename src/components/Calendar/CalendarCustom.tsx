import {
	addMonths,
	subMonths,
	format,
	startOfMonth,
	endOfMonth,
	startOfWeek,
	endOfWeek,
	addDays,
	isSameMonth,
	isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AgendaEvent } from "../BandProfile/Agenda";
import { sortByDate } from "@/utils/sortByDate";

interface CalendarProps {
	onSelectDate: (date: Date) => void;
	onHasDateForDay?: (event: Array<AgendaEvent> | null) => void;
	events: Array<AgendaEvent>;
	currentMonth: Date;
	setCurrentMonth: (date: Date) => void;
}

export const CalendarCustom = ({
	onSelectDate,
	onHasDateForDay = () => null,
	events,
	currentMonth = new Date(),
	setCurrentMonth,
}: CalendarProps) => {
	const nextMonth = () => {
		setCurrentMonth(addMonths(currentMonth, 1));
	};
	const previousMonth = () => {
		setCurrentMonth(subMonths(currentMonth, 1));
	};

	const handleSelectedDate = (date: Date) => {
		onSelectDate(date);

		const hasEventForDay = events.filter(
			(event) => format(event.date, "dd/MM/yyyy") === format(date, "dd/MM/yyyy")
		);

		if (onHasDateForDay) {
			onHasDateForDay(hasEventForDay.length > 0 ? hasEventForDay : null);
		}
	};

	// Renders the Top (Month, Year, and Navigation)
	const renderHeader = () => (
		<div className="flex items-center justify-center px-6 py-4 border-b bg-white">
			<div className="flex gap-2">
				<button
					onClick={previousMonth}
					className="p-2 hover:bg-gray-100 rounded-full transition"
				>
					<ChevronLeft size={20} />
				</button>
				<button
					onClick={() => {
						setCurrentMonth(new Date());
					}}
					className="px-4 py-1 text-2xl font-semibold text-gray-800"
				>
					{format(currentMonth, "MMMM yyyy", { locale: ptBR }).replace(
						/^\w/,
						(c) => c.toUpperCase()
					)}
				</button>
				<button
					onClick={nextMonth}
					className="p-2 hover:bg-gray-100 rounded-full transition"
				>
					<ChevronRight size={20} />
				</button>
			</div>
		</div>
	);

	// Renders the days of the week
	const renderDaysOfWeek = () => {
		const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
		return (
			<div className="grid grid-cols-7 border-b bg-gray-50">
				{days.map((day) => (
					<div
						key={day}
						className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
					>
						{day}
					</div>
				))}
			</div>
		);
	};

	const renderCells = () => {
		const monthStart = startOfMonth(currentMonth);
		const monthEnd = endOfMonth(monthStart);
		const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
		const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

		const calendarRows = [];
		let day = startDate;

		while (day <= endDate) {
			const daysInWeek = [];
			for (let index = 0; index < 7; index++) {
				const cloneDay = day;
				const isCurrentMonth = isSameMonth(cloneDay, monthStart);

				const eventsForDay = events.filter(
					(event) =>
						format(event.date, "dd/MM/yyyy") === format(cloneDay, "dd/MM/yyyy")
				);

				daysInWeek.push(
					<div
						key={cloneDay.toString()}
						onClick={() => {
							handleSelectedDate(cloneDay);
						}}
						className={`min-h-[120px] border-r border-b p-2 transition-colors cursor-pointer hover:bg-gray-50 flex flex-col
              ${!isCurrentMonth ? "bg-gray-50/50 text-gray-400" : "bg-white text-gray-700"}
            `}
					>
						<span
							className={`
              text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
              ${isToday(cloneDay) ? "bg-primary-500 text-white" : ""}
            `}
						>
							{format(cloneDay, "d")}
						</span>

						{/* Event Space */}
						<div className="mt-1 flex-1 overflow-y-auto">
							{eventsForDay.length > 0 &&
								eventsForDay
									.sort((a, b) => {
										return sortByDate({
											valueA: new Date(a.date),
											valueB: new Date(b.date),
											startTimeA: a.startTime ?? "",
											startTimeB: b.startTime ?? "",
										});
									})
									.map((event) => (
										<div
											key={event.id}
											className="bg-primary-100 text-primary-700 text-[10px] px-1 py-0.5 rounded mb-1 truncate"
										>
											{event.title}
										</div>
									))}
						</div>
					</div>
				);
				day = addDays(day, 1);
			}
			calendarRows.push(
				<div key={day.toString()} className="grid grid-cols-7">
					{daysInWeek}
				</div>
			);
		}

		return <div className="flex-1 overflow-auto">{calendarRows}</div>;
	};

	return (
		<div className="flex flex-col w-full bg-gray-100 border rounded-lg overflow-hidden shadow-xl">
			{renderHeader()}
			{renderDaysOfWeek()}
			{renderCells()}
		</div>
	);
};
