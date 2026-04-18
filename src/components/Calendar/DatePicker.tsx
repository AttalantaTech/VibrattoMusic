import { useState, type SetStateAction } from "react";
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
	isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AgendaDateStatus, ScheduleApiResponse } from "@/api/types";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { TIME_ZONE } from "@/utils";
import { Popover } from "../ui/Popover/Popover";

interface DatePickerProps {
	onSelectDate: (value: SetStateAction<Date | null>) => void;
	onModal?: (value: boolean) => void;
	mode?: "default" | "check-availability";
	checkDate?: { date: Date; status: AgendaDateStatus };
	currentMonth?: Date;
	setCurrentMonth?: (date: Date) => void;
	events?: Array<ScheduleApiResponse>;
}

function capitalize(text: string) {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

export function DatePicker({
	onSelectDate,
	onModal,
	mode = "default",
	currentMonth = new Date(),
	setCurrentMonth,
	events = [],
}: DatePickerProps) {
	const [selectedDate, setSelectedDate] = useState<string | number | Date>("");
	const [checkDate, setCheckDate] = useState<{
		date: Date;
		status: AgendaDateStatus;
	} | null>(null);

	const handleSelectedDate = (date: Date) => {
		if (mode === "default") {
			setSelectedDate(date);
			onSelectDate(date);
			if (onModal) onModal(false);

			return;
		}

		const formattedSelected = format(date, "dd/MM/yyyy");

		const foundEvent = events.find((event) => {
			return (
				formatInTimeZone(event.data, TIME_ZONE, "dd/MM/yyyy") ===
				formattedSelected
			);
		});

		if (foundEvent) {
			setCheckDate({
				date: new Date(foundEvent.data),
				status: foundEvent.status,
			});

			if (foundEvent.status !== "Ocupado") {
				setSelectedDate(date);
				onSelectDate(date);
			} else {
				onSelectDate(null);
			}
		}
	};

	const dateStatusStyle = (status: AgendaDateStatus): string => {
		switch (status) {
			case "Livre": {
				return "bg-[#039855] text-white rounded-full";
			}
			case "Ocupado": {
				return "bg-[#D92D20] opacity-50 text-white rounded-full";
			}
			case "OcupadoComEspaco": {
				return "bg-[#FEF0C7] text-[#DC6803] rounded-full";
			}
		}
	};

	const dateStatusLegend = (status: AgendaDateStatus): string => {
		console.log(status);

		switch (status) {
			case "Livre": {
				return "Disponível";
			}
			case "Ocupado": {
				return "Indisponível";
			}
			case "OcupadoComEspaco": {
				return "A Consultar";
			}
		}
	};

	const nextMonth = () => {
		if (setCurrentMonth) setCurrentMonth(addMonths(currentMonth, 1));
	};

	const previousMonth = () => {
		if (setCurrentMonth) setCurrentMonth(subMonths(currentMonth, 1));
	};

	const renderHeader = () => (
		<div className="flex justify-between items-center mb-6">
			<button onClick={previousMonth}>
				<ChevronLeft />
			</button>
			<h2 className="text-base font-medium text-gray-600 py-2">
				{capitalize(format(currentMonth, "MMMM yyyy", { locale: ptBR }))}
			</h2>
			<button onClick={nextMonth}>
				<ChevronRight />
			</button>
		</div>
	);

	const renderDaysOfWeek = () => {
		const days = [];
		const startDate = startOfWeek(currentMonth, { weekStartsOn: 0 });

		for (let index = 0; index < 7; index++) {
			days.push(
				<div
					key={index}
					className="text-center text-sm font-medium text-gray-500 w-10"
				>
					{format(addDays(startDate, index), "EEEEE", { locale: ptBR })}
				</div>
			);
		}

		return <div className="grid grid-cols-7 mb-2">{days}</div>;
	};

	const toBR = (date: Date) => toZonedTime(date, TIME_ZONE);

	const renderCells = () => {
		const monthStart = startOfMonth(currentMonth);
		const monthEnd = endOfMonth(monthStart);
		const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
		const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

		const rows = [];
		let days = [];
		let day = startDate;

		const currentDate = toZonedTime(new Date(), TIME_ZONE);

		if (mode === "default") {
			while (day <= endDate) {
				for (let index = 0; index < 7; index++) {
					const cloneDay = day;

					days.push(
						<div
							key={cloneDay.toString()}
							onClick={() => {
								handleSelectedDate(cloneDay);
							}}
							className={`h-10 w-10 flex items-center justify-center cursor-pointer rounded-full
              ${
								isSameDay(toBR(cloneDay), toBR(selectedDate as Date))
									? "bg-primary-50 rounded-full border-2 border-primary-500"
									: isSameMonth(cloneDay, monthStart)
										? "text-gray-900"
										: "text-gray-400"
							}
            `}
						>
							{formatInTimeZone(cloneDay, TIME_ZONE, "d")}
						</div>
					);

					day = addDays(day, 1);
				}

				rows.push(
					<div className="grid grid-cols-7 gap-2" key={day.toString()}>
						{days}
					</div>
				);

				days = [];
			}
		} else {
			while (day <= endDate) {
				for (let index = 0; index < 7; index++) {
					const cloneDay = day;

					days.push(
						<Popover
							content={
								checkDate?.status ? dateStatusLegend(checkDate.status) : ""
							}
							disabled={isSameMonth(cloneDay, monthStart)}
							trigger={
								<div
									key={cloneDay.toString()}
									onClick={() => {
										if (isSameMonth(cloneDay, monthStart)) {
											handleSelectedDate(cloneDay);
										}
									}}
									className={`h-10 w-10 flex items-center justify-center rounded-full
								${
									checkDate?.date &&
									checkDate.date instanceof Date &&
									!isSameDay(cloneDay, checkDate.date) &&
									isSameDay(cloneDay, currentDate)
										? "bg-primary-50 rounded-full border-2 border-primary-500"
										: ""
								}
								${
									checkDate?.date &&
									checkDate.date instanceof Date &&
									isSameDay(cloneDay, checkDate.date)
										? dateStatusStyle(checkDate.status)
										: ""
								} 
              ${
								isSameMonth(cloneDay, monthStart)
									? "text-gray-900 cursor-pointer"
									: "text-gray-400 cursor-not-allowed"
							}
            `}
								>
									{formatInTimeZone(cloneDay, TIME_ZONE, "d")}
								</div>
							}
						/>
					);

					day = addDays(day, 1);
				}

				rows.push(
					<div className="grid grid-cols-7 gap-2" key={day.toString()}>
						{days}
					</div>
				);

				days = [];
			}
		}

		return <div className="mb-6">{rows}</div>;
	};

	return (
		<div className="p-4 bg-white shadow-sm w-full h-full">
			{renderHeader()}
			<div className="max-w-md mx-auto">
				{renderDaysOfWeek()}
				{renderCells()}
			</div>
		</div>
	);
}
