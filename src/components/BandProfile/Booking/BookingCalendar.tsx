import { useState, useMemo } from "react";
import {
	format,
	addMonths,
	subMonths,
	startOfMonth,
	endOfMonth,
	eachDayOfInterval,
	isSameDay,
	isToday,
	parseISO,
	addDays,
	startOfWeek,
	endOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { useCalendarEvents } from "../../../hooks/useBookings";
import { CreateBookingModal } from "./CreateBookingModal";
import { BookingDetailsModal } from "./BookingDetailsModal";
import type { Booking, MusicalProduct } from "../../../api/types";

interface BookingEvent {
	id: number;
	title: string;
	start: string;
	end: string;
	status: string;
	productId?: number;
	booking?: Booking;
}

interface BookingCalendarProps {
	productId?: number;
	musicalProduct?: MusicalProduct;
}

export const BookingCalendar = ({ musicalProduct }: BookingCalendarProps) => {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [viewType, setViewType] = useState<"month" | "week">("month");
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showDetailsModal, setShowDetailsModal] = useState(false);

	// Calculate date ranges
	const monthStart = startOfMonth(currentDate);
	const monthEnd = endOfMonth(currentDate);
	const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
	const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

	const calendarStart = viewType === "month" ? monthStart : weekStart;
	const calendarEnd = viewType === "month" ? monthEnd : weekEnd;

	// Fetch calendar events
	const { data: calendarEvents, isLoading } = useCalendarEvents(
		format(calendarStart, "yyyy-MM-dd"),
		format(calendarEnd, "yyyy-MM-dd")
	);

	// Generate calendar days
	const calendarDays = useMemo(() => {
		if (viewType === "month") {
			// For month view, include days from previous/next months to fill the grid
			const start = startOfWeek(monthStart, { weekStartsOn: 0 });
			const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
			return eachDayOfInterval({ start, end });
		} else {
			// For week view, only show the current week
			return eachDayOfInterval({ start: weekStart, end: weekEnd });
		}
	}, [currentDate, viewType, monthStart, monthEnd, weekStart, weekEnd]);

	const events: Array<BookingEvent> = calendarEvents || [];

	// Navigation functions
	const navigatePrevious = () => {
		if (viewType === "month") {
			setCurrentDate(subMonths(currentDate, 1));
		} else {
			setCurrentDate(addDays(currentDate, -7));
		}
	};

	const navigateNext = () => {
		if (viewType === "month") {
			setCurrentDate(addMonths(currentDate, 1));
		} else {
			setCurrentDate(addDays(currentDate, 7));
		}
	};

	const goToToday = () => {
		setCurrentDate(new Date());
	};

	// Event handlers
	const handleDateClick = (date: Date) => {
		setSelectedDate(date);
		if (musicalProduct) {
			setShowCreateModal(true);
		}
	};

	const handleEventClick = (event: BookingEvent) => {
		setSelectedEvent(event);
		setShowDetailsModal(true);
	};

	// Get events for a specific day
	const getEventsForDay = (date: Date) => {
		return events.filter((event) => {
			const eventDate = parseISO(event.start);
			return isSameDay(eventDate, date);
		});
	};

	// Get status color
	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case "pendente":
				return "bg-yellow-100 border-yellow-300 text-yellow-800";
			case "confirmado":
				return "bg-green-100 border-green-300 text-green-800";
			case "cancelado":
				return "bg-red-100 border-red-300 text-red-800";
			case "concluido":
				return "bg-blue-100 border-blue-300 text-blue-800";
			default:
				return "bg-gray-100 border-gray-300 text-gray-800";
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-gray-500">Carregando calendário...</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow-sm border">
			{/* Header */}
			<div className="p-4 border-b">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-4">
						<h2 className="text-xl font-bold text-gray-900">
							{viewType === "month"
								? format(currentDate, "MMMM yyyy", { locale: ptBR })
								: `${format(weekStart, "dd MMM", { locale: ptBR })} - ${format(weekEnd, "dd MMM yyyy", { locale: ptBR })}`}
						</h2>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={navigatePrevious}
								className="p-2"
							>
								<ChevronLeft className="w-4 h-4" />
							</Button>
							<Button variant="outline" size="sm" onClick={goToToday}>
								Hoje
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={navigateNext}
								className="p-2"
							>
								<ChevronRight className="w-4 h-4" />
							</Button>
						</div>
					</div>

					<div className="flex items-center gap-2">
						{/* View Toggle */}
						<div className="flex border rounded-lg overflow-hidden">
							{" "}
							<button
								onClick={() => {
									setViewType("month");
								}}
								className={`px-3 py-1 text-sm ${viewType === "month" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
							>
								Mês
							</button>
							<button
								onClick={() => {
									setViewType("week");
								}}
								className={`px-3 py-1 text-sm ${viewType === "week" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
							>
								Semana
							</button>
						</div>{" "}
						{musicalProduct && (
							<Button
								onClick={() => {
									setShowCreateModal(true);
								}}
								className="flex items-center gap-2"
							>
								<Plus className="w-4 h-4" />
								Nova Contratação
							</Button>
						)}
					</div>
				</div>

				{/* Legend */}
				<div className="flex items-center gap-4 text-sm">
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></div>
						<span>Pendente</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
						<span>Confirmado</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
						<span>Concluído</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
						<span>Cancelado</span>
					</div>
				</div>
			</div>

			{/* Calendar Grid */}
			<div className="p-4">
				{viewType === "month" ? (
					<>
						{/* Month View */}
						{/* Days of week header */}
						<div className="grid grid-cols-7 gap-1 mb-2">
							{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
								<div
									key={day}
									className="p-2 text-center font-medium text-gray-600 text-sm"
								>
									{day}
								</div>
							))}
						</div>

						{/* Calendar days */}
						<div className="grid grid-cols-7 gap-1">
							{calendarDays.map((day, index) => {
								const dayEvents = getEventsForDay(day);
								const isCurrentMonth =
									day.getMonth() === currentDate.getMonth();
								const isSelected = selectedDate && isSameDay(day, selectedDate);

								return (
									<div
										key={index}
										onClick={() => {
											handleDateClick(day);
										}}
										className={`
											min-h-24 p-2 border rounded cursor-pointer hover:bg-gray-50
											${isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"}
											${isToday(day) ? "bg-blue-50 border-blue-200" : "border-gray-200"}
											${isSelected ? "ring-2 ring-blue-500" : ""}
										`}
									>
										<div
											className={`text-sm font-medium mb-1 ${isToday(day) ? "text-blue-600" : ""}`}
										>
											{format(day, "d")}
										</div>

										<div className="space-y-1">
											{dayEvents.slice(0, 2).map((event) => (
												<div
													key={event.id}
													onClick={(e) => {
														e.stopPropagation();
														handleEventClick(event);
													}}
													className={`
														text-xs p-1 rounded border cursor-pointer hover:opacity-75
														${getStatusColor(event.status)}
													`}
												>
													<div className="truncate font-medium">
														{event.title}
													</div>
													<div className="truncate">
														{format(parseISO(event.start), "HH:mm")} -{" "}
														{format(parseISO(event.end), "HH:mm")}
													</div>
												</div>
											))}
											{dayEvents.length > 2 && (
												<div className="text-xs text-gray-500 pl-1">
													+{dayEvents.length - 2} mais
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</>
				) : (
					<>
						{/* Week View */}
						<div className="grid grid-cols-8 gap-1">
							{/* Time column */}
							<div className="space-y-12">
								{Array.from({ length: 24 }, (_, index) => (
									<div
										key={index}
										className="text-xs text-gray-500 h-12 flex items-start"
									>
										{index.toString().padStart(2, "0")}:00
									</div>
								))}
							</div>

							{/* Day columns */}
							{calendarDays.map((day, index) => (
								<div key={index} className="relative">
									{/* Day header */}
									<div
										className={`
										text-center p-2 mb-2 rounded
										${isToday(day) ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}
									`}
									>
										<div className="text-xs font-medium">
											{format(day, "EEE", { locale: ptBR })}
										</div>
										<div className="text-lg font-bold">{format(day, "d")}</div>
									</div>

									{/* Hour grid */}
									<div className="space-y-12">
										{Array.from({ length: 24 }, (_, index_) => (
											<div
												key={index_}
												className="h-12 border-t border-gray-100"
											></div>
										))}
									</div>

									{/* Events */}
									<div className="absolute top-16 left-0 right-0">
										{getEventsForDay(day).map((event) => {
											const startTime = parseISO(event.start);
											const endTime = parseISO(event.end);
											const startHour =
												startTime.getHours() + startTime.getMinutes() / 60;
											const duration =
												(endTime.getTime() - startTime.getTime()) /
												(1000 * 60 * 60);

											return (
												<div
													key={event.id}
													onClick={() => {
														handleEventClick(event);
													}}
													style={{
														top: `${startHour * 48}px`,
														height: `${duration * 48}px`,
													}}
													className={`
														absolute left-1 right-1 p-1 rounded border cursor-pointer hover:opacity-75
														${getStatusColor(event.status)}
													`}
												>
													<div className="text-xs font-medium truncate">
														{event.title}
													</div>
													<div className="text-xs truncate">
														{format(startTime, "HH:mm")} -{" "}
														{format(endTime, "HH:mm")}
													</div>
												</div>
											);
										})}
									</div>
								</div>
							))}
						</div>
					</>
				)}
			</div>

			{/* Modals */}
			{musicalProduct && (
				<CreateBookingModal
					isOpen={showCreateModal}
					onClose={() => {
						setShowCreateModal(false);
						setSelectedDate(null);
					}}
					musicalProduct={musicalProduct}
				/>
			)}

			{selectedEvent?.booking && (
				<BookingDetailsModal
					isOpen={showDetailsModal}
					onClose={() => {
						setShowDetailsModal(false);
						setSelectedEvent(null);
					}}
					booking={selectedEvent.booking}
				/>
			)}
		</div>
	);
};
