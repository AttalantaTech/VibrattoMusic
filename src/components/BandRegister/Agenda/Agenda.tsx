import { useState } from "react";
import {
	format,
	addMonths,
	subMonths,
	startOfMonth,
	endOfMonth,
	eachDayOfInterval,
	isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Trash } from "lucide-react";
import { InputField } from "../../forms/InputField/InputField";
import { TextAreaField } from "../../forms/TextAreaField/TextAreaField";
import type { Event } from "../../../common/types";

interface AgendaProps {
	onEventsChange?: (events: Array<Event>) => void;
}

export const Agenda = ({ onEventsChange }: AgendaProps) => {
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [events, setEvents] = useState<Array<Event>>([]);
	const [newEvent, setNewEvent] = useState({
		title: "",
		description: "",
		startTime: "12:00",
		endTime: "13:00",
	});

	const monthStart = startOfMonth(currentMonth);
	const monthEnd = endOfMonth(currentMonth);
	const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

	const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

	const nextMonth = () => {
		setCurrentMonth(addMonths(currentMonth, 1));
	};
	const previousMonth = () => {
		setCurrentMonth(subMonths(currentMonth, 1));
	};

	const handleDateClick = (day: Date) => {
		setSelectedDate(day);
	};
	const handleAddEvent = () => {
		if (!selectedDate || !newEvent.title) return;

		const event: Event = {
			id: 1,
			title: newEvent.title,
			description: newEvent.description,
			date: selectedDate,
			startTime: newEvent.startTime,
			endTime: newEvent.endTime,
		};

		const updatedEvents = [...events, event];
		setEvents(updatedEvents);
		setNewEvent({
			title: "",
			description: "",
			startTime: "12:00",
			endTime: "13:00",
		});

		// Notify parent component of events change
		onEventsChange?.(updatedEvents);
	};

	const handleRemoveEvent = (id: number) => {
		const updatedEvents = events.filter((event) => event.id !== id);
		setEvents(updatedEvents);

		// Notify parent component of events change
		onEventsChange?.(updatedEvents);
	};

	const formatDate = (date: Date) => {
		return format(date, "dd MMMM yyyy", { locale: ptBR });
	};

	return (
		<div className="w-full mx-auto p-4 bg-white">
			{/* Cabeçalho do calendário */}
			<div className="flex justify-between items-center mb-4">
				<button
					className="p-2 rounded hover:bg-gray-100"
					onClick={previousMonth}
				>
					<ChevronLeft size={28} />
				</button>
				<h2 className="text-xl font-bold">
					{format(currentMonth, "MMMM yyyy", { locale: ptBR }).toUpperCase()}
				</h2>
				<button className="p-2 rounded hover:bg-gray-100" onClick={nextMonth}>
					<ChevronRight size={28} />
				</button>
			</div>
			{/* Dias da semana */}
			<div className="grid grid-cols-7 gap-1 mb-2">
				{weekDays.map((day) => (
					<div key={day} className="text-center font-medium text-sm">
						{day}
					</div>
				))}
			</div>
			{/* Dias do mês */}
			<div className="grid grid-cols-7 gap-1">
				{monthDays.map((day) => {
					const dayEvents = events.filter((event) =>
						isSameDay(event.date, day)
					);
					return (
						<div
							key={day.toString()}
							className={`min-h-16 p-1 border rounded cursor-pointer hover:bg-gray-50 ${
								isSameDay(day, new Date()) ? "bg-blue-50" : ""
							} ${
								selectedDate && isSameDay(day, selectedDate)
									? "border-blue-500 border-2"
									: ""
							}`}
							onClick={() => {
								handleDateClick(day);
							}}
						>
							<div className="text-right text-sm">{format(day, "d")}</div>
							<div className="space-y-1">
								{dayEvents.slice(0, 2).map((event) => (
									<div
										key={event.id}
										className="text-xs p-1 bg-blue-100 rounded truncate"
									>
										{event.title}
									</div>
								))}
								{dayEvents.length > 2 && (
									<div className="text-xs text-gray-500">
										+{dayEvents.length - 2} mais
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
			{/* Formulário de evento */}
			{selectedDate && (
				<div className="flex flex-col w-full mt-6 p-4 border rounded-lg">
					<h3 className="font-bold mb-2">
						Adicionar evento para {formatDate(selectedDate)}
					</h3>
					<div className="flex flex-col w-full gap-4">
						<InputField
							label="Título"
							name="event-title"
							placeholder="Ex: Show Empresarial"
							value={newEvent.title}
							onChange={(event) => {
								setNewEvent({ ...newEvent, title: event.target.value });
							}}
						/>
						<div className="flex w-full gap-4">
							<div className="w-full">
								<InputField
									label="Início"
									name="start-time"
									type="time"
									value={newEvent.startTime}
									onChange={(event) => {
										setNewEvent({ ...newEvent, startTime: event.target.value });
									}}
								/>
							</div>
							<div className="w-full">
								<InputField
									label="Fim"
									name="end-time"
									type="time"
									value={newEvent.endTime}
									onChange={(event) => {
										setNewEvent({ ...newEvent, endTime: event.target.value });
									}}
								/>
							</div>
						</div>
						<div className="w-full">
							<TextAreaField
								label="Descrição"
								name="description"
								placeholder="Digitar..."
								onChange={(event) => {
									setNewEvent({ ...newEvent, description: event.target.value });
								}}
							/>
						</div>
						<button
							className="w-full bg-blue-500 text-white py-2 px-4 rounded disabled:bg-blue-300"
							disabled={!newEvent.title}
							onClick={handleAddEvent}
						>
							Adicionar Evento
						</button>
					</div>
				</div>
			)}
			{/* Lista de eventos */}{" "}
			{events.length > 0 &&
				(() => {
					const sortedEvents = [...events].sort(
						(a, b) => a.date.getTime() - b.date.getTime()
					);
					return (
						<div className="mt-8">
							<h3 className="text-lg font-bold mb-4">Agenda</h3>
							<div className="space-y-3">
								{sortedEvents.map((event) => (
									<div
										key={event.id}
										className="p-3 border rounded-lg flex justify-between items-center"
									>
										<div>
											<div className="font-medium">{event.title}</div>
											<div className="text-sm text-gray-600">
												{formatDate(event.date)} • {event.startTime} -{" "}
												{event.endTime}
											</div>
										</div>
										<button
											className="text-red-500 hover:text-red-700"
											onClick={() => {
												handleRemoveEvent(Number(event.id));
											}}
										>
											<Trash size={28} />
										</button>
									</div>
								))}
							</div>
						</div>
					);
				})()}
		</div>
	);
};
