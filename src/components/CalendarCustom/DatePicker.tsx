import type { SetStateAction } from "react";
import { useState } from "react";
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

interface DatePickerProps {
	onSelectDate: (value: SetStateAction<Date | null>) => void;
	onModal?: (value: boolean) => void;
}

function capitalize(text: string) {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

export function DatePicker({ onSelectDate, onModal }: DatePickerProps) {
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState<string | number | Date>("");

	const handleSelectedDate = (date: Date) => {
		setSelectedDate(date);
		onSelectDate(date);

		if (onModal) onModal(false);
	};

	const nextMonth = () => {
		setCurrentMonth(addMonths(currentMonth, 1));
	};

	const previousMonth = () => {
		setCurrentMonth(subMonths(currentMonth, 1));
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

	const renderCells = () => {
		const monthStart = startOfMonth(currentMonth);
		const monthEnd = endOfMonth(monthStart);
		const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
		const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

		const rows = [];
		let days = [];
		let day = startDate;

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
								isSameDay(cloneDay, selectedDate)
									? "bg-primary-50 rounded-full border-2 border-primary-500"
									: isSameMonth(cloneDay, monthStart)
										? "text-gray-900"
										: "text-gray-400"
							}
            `}
					>
						{format(cloneDay, "d")}
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
