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
	isSameDay,
	isBefore,
	startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AgendaEvent } from "../BandProfile/Agenda";
import { sortByDate } from "@/utils/sortByDate";
import type { AgendaDateStatus, ScheduleApiResponse } from "@/api/types";

interface CalendarProps {
	onSelectDate: (date: Date) => void;
	onHasDateForDay?: (event: Array<AgendaEvent> | null) => void;
	eventsAgendaFormat: Array<AgendaEvent>;
	currentMonth: Date;
	setCurrentMonth: (date: Date) => void;
	agendaData?: Array<ScheduleApiResponse>;
}

export const CalendarCustom = ({
	onSelectDate,
	onHasDateForDay = () => null,
	eventsAgendaFormat,
	currentMonth = new Date(),
	setCurrentMonth,
	agendaData = [],
}: CalendarProps) => {
	const nextMonth = () => {
		setCurrentMonth(addMonths(currentMonth, 1));
	};
	const previousMonth = () => {
		setCurrentMonth(subMonths(currentMonth, 1));
	};

	const handleSelectedDate = (date: Date) => {
		onSelectDate(date);

		const hasEventForDay = eventsAgendaFormat.filter(
			(event) => format(event.date, "dd/MM/yyyy") === format(date, "dd/MM/yyyy")
		);

		if (onHasDateForDay) {
			onHasDateForDay(hasEventForDay.length > 0 ? hasEventForDay : null);
		}
	};

	const dateStatusStyle = (
		status: AgendaDateStatus,
		isBefore: boolean,
		isToday: boolean
	): string => {
		switch (status) {
			case "Livre": {
				return `${isBefore || isToday ? "bg-[#039855]" : "bg-[#039855]/50"} text-white rounded-full`;
			}
			case "Ocupado": {
				return `${isBefore || isToday ? "bg-[#D92D20] opacity-50" : "bg-[#D92D20]/40 opacity-50"} text-white rounded-full`;
			}
			case "OcupadoComEspaco": {
				return `${isBefore || isToday ? "bg-[#FEF0C7] text-[#DC6803]" : "bg-[#FEF0C7]/50 text-[#DC6803]/40"} rounded-full`;
			}
			default:
				return "";
		}
	};

	const todayStatusCollor = (status: AgendaDateStatus): string => {
		switch (status) {
			case "Livre": {
				return "bg-[#039855] w-7 h-1 rounded-full";
			}
			case "Ocupado": {
				return "bg-[#D92D20] opacity-50  w-7 h-1 rounded-full";
			}
			case "OcupadoComEspaco": {
				return "bg-[#DC6803]  w-7 h-1 rounded-full";
			}
			default:
				return "";
		}
	};

	// Renders the Top (Month, Year, and Navigation)
	const renderHeader = () => (
		<div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between px-6 py-4 border-b bg-white">
			<div className="ml-6" />
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

			<div className="grid grid-cols-2 min-[420px]:grid-cols-3 items-end gap-6 sm:gap-1 text-xs text-gray-500 sm:flex sm:flex-col">
				<div className="flex items-center gap-1">
					<span className="block">Disponível</span>
					<span className="block h-3 w-3 rounded-full bg-[#039855] border border-[#039855]" />
				</div>

				<div className="flex items-center gap-1">
					<span className="block">A Consultar</span>
					<span className="block h-3 w-3 rounded-full bg-[#FEF0C7] border border-orange-300" />
				</div>

				<div className="flex items-center gap-1">
					<span className="block">Indisponível</span>
					<span className="block h-3 w-3 rounded-full bg-[#D92D20] opacity-50 border border-[#D92D20]" />
				</div>
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

				const eventsForDay = eventsAgendaFormat.filter(
					(event) =>
						format(event.date, "dd/MM/yyyy") === format(cloneDay, "dd/MM/yyyy")
				);

				const agendaDateStatus = agendaData.find((eventApi) => {
					return (
						format(eventApi.data, "dd/MM/yyyy") ===
						format(cloneDay, "dd/MM/yyyy")
					);
				});

				const currentDate = startOfDay(new Date());

				daysInWeek.push(
					<div
						key={cloneDay.toString()}
						onClick={() => {
							if (isCurrentMonth) {
								handleSelectedDate(cloneDay);
							}
						}}
						className={`min-h-[120px] border-r border-b p-2 transition-colors  flex flex-col
              ${
								!isCurrentMonth
									? "bg-gray-50/50 text-gray-400 cursor-not-allowed"
									: `${isBefore(currentDate, monthStart) ? "bg-gray-50/50 text-gray-400" : "bg-white text-gray-700 cursor-pointer hover:bg-gray-50"}`
							}
							
							
            `}
					>
						<span
							className={`
              text-sm font-medium w-7 h-7 border border-white flex items-center justify-center rounded-full
							${
								agendaDateStatus && isSameDay(cloneDay, agendaDateStatus.data)
									? dateStatusStyle(
											agendaDateStatus.status,
											isBefore(currentDate, monthStart),
											isToday(cloneDay)
										)
									: ""
							}
            `}
						>
							{format(cloneDay, "d")}
						</span>

						{isToday(cloneDay) && (
							<span
								className={
									agendaDateStatus
										? todayStatusCollor(agendaDateStatus.status)
										: ""
								}
							/>
						)}

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
