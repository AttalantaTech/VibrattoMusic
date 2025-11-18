import { useState } from "react";
import {
	format,
	startOfMonth,
	endOfMonth,
	eachDayOfInterval,
	isSameDay,
	isToday,
	addMonths,
	subMonths,
	startOfWeek,
	endOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
	ChevronLeft,
	ChevronRight,
	Calendar,
	Clock,
	MapPin,
	User,
} from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { Badge } from "../../ui/Badge/Badge";
import { Modal } from "../../ui/Modal/Modal";
import { useCalendarEvents } from "../../../hooks/useBookings";
import type { Booking } from "../../../api/types";

interface BookingCalendarProps {
	productId?: number;
	onDateSelect?: (date: Date) => void;
	onBookingClick?: (booking: Booking) => void;
}

interface CalendarEvent {
	id: number;
	title: string;
	start: string;
	end: string;
	status: string;
	productId: number;
	booking?: Booking;
}

export const BookingCalendar = ({
	onDateSelect,
	onBookingClick,
}: BookingCalendarProps) => {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
		null
	);

	const monthStart = startOfMonth(currentDate);
	const monthEnd = endOfMonth(currentDate);
	const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
	const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

	// Get calendar events for the current month
	const { data: events, isLoading } = useCalendarEvents(
		format(monthStart, "yyyy-MM-dd"),
		format(monthEnd, "yyyy-MM-dd"),
		true
	);

	const calendarDays = eachDayOfInterval({
		start: calendarStart,
		end: calendarEnd,
	});

	const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

	const nextMonth = () => {
		setCurrentDate(addMonths(currentDate, 1));
	};

	const previousMonth = () => {
		setCurrentDate(subMonths(currentDate, 1));
	};

	const getEventsForDay = (day: Date): Array<CalendarEvent> => {
		if (!events) return [];

		return events.filter((event) => {
			const eventDate = new Date(event.start);
			return isSameDay(eventDate, day);
		});
	};

	const getStatusColor = (status: string) => {
		const colors = {
			pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
			confirmado: "bg-green-100 text-green-800 border-green-200",
			cancelado: "bg-red-100 text-red-800 border-red-200",
			concluido: "bg-gray-100 text-gray-800 border-gray-200",
		};

		return (
			colors[status as keyof typeof colors] ||
			"bg-blue-100 text-blue-800 border-blue-200"
		);
	};

	const handleDayClick = (day: Date) => {
		onDateSelect?.(day);
	};

	const handleEventClick = (event: CalendarEvent) => {
		setSelectedEvent(event);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow">
			{/* Calendar Header */}
			<div className="flex items-center justify-between p-4 border-b">
				<Button variant="outline" size="sm" onClick={previousMonth}>
					<ChevronLeft className="w-4 h-4" />
				</Button>

				<h2 className="text-xl font-semibold">
					{format(currentDate, "MMMM yyyy", { locale: ptBR })}
				</h2>

				<Button variant="outline" size="sm" onClick={nextMonth}>
					<ChevronRight className="w-4 h-4" />
				</Button>
			</div>

			{/* Week Days Header */}
			<div className="grid grid-cols-7 border-b">
				{weekDays.map((day) => (
					<div
						key={day}
						className="p-3 text-center text-sm font-medium text-gray-600 border-r last:border-r-0"
					>
						{day}
					</div>
				))}
			</div>

			{/* Calendar Grid */}
			<div className="grid grid-cols-7">
				{calendarDays.map((day, dayIndex) => {
					const dayEvents = getEventsForDay(day);
					const isCurrentMonth = day.getMonth() === currentDate.getMonth();
					const isCurrentDay = isToday(day);

					return (
						<div
							key={dayIndex}
							className={`min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer hover:bg-gray-50 ${
								!isCurrentMonth ? "bg-gray-50" : ""
							}`}
							onClick={() => {
								handleDayClick(day);
							}}
						>
							<div className="flex items-center justify-between mb-2">
								<span
									className={`text-sm font-medium ${
										isCurrentDay
											? "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
											: isCurrentMonth
												? "text-gray-900"
												: "text-gray-400"
									}`}
								>
									{format(day, "d")}
								</span>
							</div>

							{/* Events for this day */}
							<div className="space-y-1">
								{dayEvents.slice(0, 3).map((event, eventIndex) => (
									<div
										key={eventIndex}
										className={`text-xs p-1 rounded border cursor-pointer truncate ${getStatusColor(event.status)}`}
										onClick={(e) => {
											e.stopPropagation();
											handleEventClick(event);
										}}
									>
										<div className="font-medium truncate">{event.title}</div>
										<div className="text-xs opacity-75">
											{format(new Date(event.start), "HH:mm")} -{" "}
											{format(new Date(event.end), "HH:mm")}
										</div>
									</div>
								))}

								{dayEvents.length > 3 && (
									<div className="text-xs text-gray-500 p-1">
										+{dayEvents.length - 3} mais
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Event Details Modal */}
			{selectedEvent && (
				<Modal
					isOpen={!!selectedEvent}
					onClose={() => {
						setSelectedEvent(null);
					}}
				>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
							<Badge
								variant={
									selectedEvent.status === "confirmado" ? "success" : "warning"
								}
							>
								{selectedEvent.status}
							</Badge>
						</div>

						<div className="space-y-3">
							<div className="flex items-center gap-2 text-gray-600">
								<Calendar className="w-4 h-4" />
								<span>
									{format(
										new Date(selectedEvent.start),
										"dd 'de' MMMM 'de' yyyy",
										{ locale: ptBR }
									)}
								</span>
							</div>

							<div className="flex items-center gap-2 text-gray-600">
								<Clock className="w-4 h-4" />
								<span>
									{format(new Date(selectedEvent.start), "HH:mm")} -{" "}
									{format(new Date(selectedEvent.end), "HH:mm")}
								</span>
							</div>

							{selectedEvent.booking && (
								<>
									<div className="flex items-center gap-2 text-gray-600">
										<MapPin className="w-4 h-4" />
										<span>{selectedEvent.booking.local}</span>
									</div>

									<div className="flex items-center gap-2 text-gray-600">
										<User className="w-4 h-4" />
										<span>
											{selectedEvent.booking.usuario?.nome || "Cliente"}
										</span>
									</div>
								</>
							)}
						</div>

						<div className="flex gap-3 pt-4 border-t">
							<Button
								variant="outline"
								onClick={() => {
									setSelectedEvent(null);
								}}
								className="flex-1"
							>
								Fechar
							</Button>

							{selectedEvent.booking && onBookingClick && (
								<Button
									onClick={() => {
										onBookingClick(selectedEvent.booking!);
										setSelectedEvent(null);
									}}
									className="flex-1"
								>
									Ver Detalhes
								</Button>
							)}
						</div>
					</div>
				</Modal>
			)}
		</div>
	);
};
