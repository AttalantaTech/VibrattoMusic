import { useState, useEffect, useCallback } from "react";
import {
	Plus,
	ChevronLeft,
	ChevronRight,
	Calendar,
	Clock,
	Filter,
	X,
	Loader2,
} from "lucide-react";
import {
	format,
	startOfWeek,
	endOfWeek,
	eachDayOfInterval,
	isToday,
	addWeeks,
	subWeeks,
	isSameDay,
	parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
	DndContext,
	DragOverlay,
	type DragEndEvent,
	type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";

// Internal imports
import type { AgendaEvent, AgendaViewProps } from "./types";
import { eventTypeConfig } from "./types";
import { DraggableEvent } from "./DraggableEvent";
import { DroppableTimeSlot } from "./DroppableTimeSlot";
import { CreateEventModal } from "./CreateEventModal";
import { EventDetailsModal } from "./EventDetailsModal";
import { Button } from "../../ui/Button/Button";
import { onboardingService } from "../../../api";

// Calendar utilities
const getEventHeight = (event: AgendaEvent) => {
	const [startHour = 0, startMinute = 0] = event.startTime
		.split(":")
		.map(Number);
	const [endHour = 0, endMinute = 0] = event.endTime.split(":").map(Number);

	const startInMinutes = startHour * 60 + startMinute;
	const endInMinutes = endHour * 60 + endMinute;

	return ((endInMinutes - startInMinutes) / 60) * 64; // 64px per hour
};

const getEventTopPosition = (event: AgendaEvent) => {
	const [startHour = 0, startMinute = 0] = event.startTime
		.split(":")
		.map(Number);
	return (((startHour - 7) * 60 + startMinute) / 60) * 64; // 7 AM is grid start
};

const getEventsForDay = (events: Array<AgendaEvent>, day: Date) => {
	return events.filter((event) => isSameDay(event.date, day));
};

export const AgendaView = ({
	events: propEvents = [],
	onEventCreate,
	onEventUpdate,
	onEventDelete,
	onEventClick,
	initialDate = new Date(),
	readOnly = false,
	allowDragAndDrop = true,
	showCreateButton = true,
	produtoMusicalId: propProdutoMusicalId,
}: AgendaViewProps) => {
	const [currentDate, setCurrentDate] = useState(initialDate);
	const [events, setEvents] = useState<Array<AgendaEvent>>(propEvents);
	const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [draggedEvent, setDraggedEvent] = useState<AgendaEvent | null>(null);
	const [filterType, setFilterType] = useState<string>("all");
	const [loading, setLoading] = useState(false);
	const [produtoMusicalId, setProdutoMusicalId] = useState<number | null>(null);
	const [viewMode, setViewMode] = useState<"week" | "month">("week");
	const [showFilterMenu, setShowFilterMenu] = useState(false);
	const [createEventData, setCreateEventData] = useState<{
		date?: Date;
		startTime?: string;
		endTime?: string;
	}>({});

	// Get produtoMusicalId from props or URL
	useEffect(() => {
		if (propProdutoMusicalId) {
			setProdutoMusicalId(propProdutoMusicalId);
		} else {
			const urlParameters = new URLSearchParams(window.location.search);
			const idFromUrl = urlParameters.get("id");
			if (idFromUrl) {
				setProdutoMusicalId(Number(idFromUrl));
			}
		}
	}, [propProdutoMusicalId]);

	// Load events from API
	const loadEvents = useCallback(async () => {
		if (!produtoMusicalId) return;

		setLoading(true);
		try {
			const response = await onboardingService.getSchedule(produtoMusicalId);

			if (response && Array.isArray(response)) {
				const apiEvents: Array<AgendaEvent> = [];

				response.forEach((dayData) => {
					if (dayData.compromissos && dayData.compromissos.length > 0) {
						dayData.compromissos.forEach((compromisso) => {
							// Map API event to AgendaEvent format
							apiEvents.push({
								id: compromisso.id,
								title: compromisso.titulo,
								description: compromisso.descricao,
								date: parseISO(dayData.data),
								startTime: compromisso.horaInicio,
								endTime: compromisso.horaFim,
								type: "show", // Default type, could be enhanced to detect from title/description
								status: "confirmed",
							});
						});
					}
				});

				setEvents(apiEvents);
			}
		} catch (error) {
			console.error(error);
			toast.error("Erro ao carregar eventos");
		} finally {
			setLoading(false);
		}
	}, [produtoMusicalId]);

	// Load events on mount and when produtoMusicalId changes
	useEffect(() => {
		if (produtoMusicalId && (!propEvents || propEvents.length === 0)) {
			void loadEvents();
		}
	}, [produtoMusicalId, loadEvents, propEvents]);

	// Update events when propEvents changes
	useEffect(() => {
		if (propEvents && propEvents.length > 0) {
			setEvents(propEvents);
		}
	}, [propEvents]);

	// Update currentDate when initialDate changes
	useEffect(() => {
		setCurrentDate(initialDate);
	}, [initialDate]);

	// Calculate week boundaries
	const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
	const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
	const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

	// Hours from 7 AM to 11 PM
	const hours = Array.from({ length: 17 }, (_, index) => index + 7);
	const weekDayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

	// Navigation functions
	const nextPeriod = () => {
		setCurrentDate(addWeeks(currentDate, viewMode === "week" ? 1 : 4));
	};
	const previousPeriod = () => {
		setCurrentDate(subWeeks(currentDate, viewMode === "week" ? 1 : 4));
	};
	const goToToday = () => {
		setCurrentDate(new Date());
	};

	// Filter events
	const filteredEvents = events.filter(
		(event) => filterType === "all" || event.type === filterType
	);

	// Drag and Drop handlers
	const handleDragStart = (event: DragStartEvent) => {
		const { active } = event;
		if (active.data.current?.["type"] === "event") {
			setDraggedEvent(active.data.current["event"] as AgendaEvent);
		}
	};

	// Save events to API
	const saveEventsToAPI = async (eventsToSave: Array<AgendaEvent>) => {
		if (!produtoMusicalId) return;

		const scheduleData = {
			id: produtoMusicalId,
			compromissos: eventsToSave.map((event) => ({
				titulo: event.title,
				descricao: event.description || "",
				data: format(event.date, "yyyy-MM-dd"),
				horaInicio: event.startTime,
				horaFim: event.endTime,
				disponibilidadeOutrosEventos: event.type !== "show",
			})),
		};

		await onboardingService.updateSchedule(produtoMusicalId, scheduleData);
	};

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;
		setDraggedEvent(null);

		if (!over || !active.data.current || !allowDragAndDrop || readOnly) return;

		const draggedEventData = active.data.current["event"] as AgendaEvent;
		const targetSlot = over.data.current;

		if (targetSlot?.["type"] === "timeslot") {
			const newDate = targetSlot["day"] as Date;
			const newStartHour = targetSlot["hour"] as number;

			// Calculate event duration to maintain it
			const [originalStartHour = 0, originalStartMinute = 0] =
				draggedEventData.startTime.split(":").map(Number);
			const [originalEndHour = 0, originalEndMinute = 0] =
				draggedEventData.endTime.split(":").map(Number);

			const originalDurationMinutes =
				originalEndHour * 60 +
				originalEndMinute -
				(originalStartHour * 60 + originalStartMinute);

			const newStartTime = `${String(newStartHour).padStart(2, "0")}:00`;
			const newEndHour = Math.floor(
				(newStartHour * 60 + originalDurationMinutes) / 60
			);
			const newEndMinute = (newStartHour * 60 + originalDurationMinutes) % 60;
			const newEndTime = `${String(newEndHour).padStart(2, "0")}:${String(newEndMinute).padStart(2, "0")}`;

			const updatedEvent: AgendaEvent = {
				...draggedEventData,
				date: newDate,
				startTime: newStartTime,
				endTime: newEndTime,
			};

			// Update local state immediately
			setEvents((previousEvents) =>
				previousEvents.map((event) =>
					event.id === updatedEvent.id ? updatedEvent : event
				)
			);

			// Call parent handler
			onEventUpdate?.(updatedEvent);

			// Save to API if we have produtoMusicalId
			if (produtoMusicalId) {
				try {
					await saveEventsToAPI([
						...events.filter((event) => event.id !== updatedEvent.id),
						updatedEvent,
					]);
					toast.success("Evento movido com sucesso");
				} catch (error) {
					console.error(error);
					// Revert on error
					setEvents(events);
					toast.error("Erro ao mover evento");
				}
			}
		}
	};

	// Event handlers
	const handleEventClick = (event: AgendaEvent) => {
		if (readOnly) {
			onEventClick?.(event);
			return;
		}
		setSelectedEvent(event);
		setShowDetailsModal(true);
		onEventClick?.(event);
	};

	const handleCreateEvent = () => {
		if (readOnly) return;
		setShowCreateModal(true);
	};

	const handleTimeSlotClick = (day: Date, hour: number) => {
		if (readOnly) return;

		setCreateEventData({
			date: day,
			startTime: `${String(hour).padStart(2, "0")}:00`,
			endTime: `${String(hour + 1).padStart(2, "0")}:00`,
		});
		setShowCreateModal(true);
	};

	const handleEventCreate = async (eventData: Partial<AgendaEvent>) => {
		const newEvent: AgendaEvent = {
			id: Date.now(),
			title: eventData.title || "",
			description: eventData.description,
			date: eventData.date || currentDate,
			startTime: eventData.startTime || "09:00",
			endTime: eventData.endTime || "10:00",
			type: eventData.type || "show",
			status: "confirmed",
			...eventData,
		};

		// Update local state
		const updatedEvents = [...events, newEvent];
		setEvents(updatedEvents);

		// Call parent handler
		onEventCreate?.(eventData);

		// Save to API
		if (produtoMusicalId) {
			try {
				await saveEventsToAPI(updatedEvents);
				toast.success("Evento criado com sucesso");
			} catch (error) {
				console.error(error);
				// Revert on error
				setEvents(events);
				toast.error("Erro ao criar evento");
			}
		}

		setShowCreateModal(false);
	};

	const handleEventUpdate = async (updatedEvent: AgendaEvent) => {
		const updatedEvents = events.map((event) =>
			event.id === updatedEvent.id ? updatedEvent : event
		);
		setEvents(updatedEvents);

		onEventUpdate?.(updatedEvent);

		if (produtoMusicalId) {
			try {
				await saveEventsToAPI(updatedEvents);
				toast.success("Evento atualizado com sucesso");
			} catch (error) {
				console.error(error);
				setEvents(events);
				toast.error("Erro ao atualizar evento");
			}
		}

		setShowDetailsModal(false);
		setSelectedEvent(null);
	};

	const handleEventDelete = async (eventId: string | number) => {
		const updatedEvents = events.filter((event) => event.id !== eventId);
		setEvents(updatedEvents);

		onEventDelete?.(eventId);

		if (produtoMusicalId) {
			try {
				await saveEventsToAPI(updatedEvents);
				toast.success("Evento removido com sucesso");
			} catch (error) {
				console.error(error);
				setEvents(events);
				toast.error("Erro ao remover evento");
			}
		}

		setShowDetailsModal(false);
		setSelectedEvent(null);
	};

	// Event type colors
	const getEventTypeColor = (type: string) => {
		const config = eventTypeConfig[type as keyof typeof eventTypeConfig];
		return config
			? `${config.color} ${config.borderColor} text-white`
			: "bg-primary-500 border-primary-600 text-white";
	};

	// Render loading state
	if (loading) {
		return (
			<div className="flex items-center justify-center h-full bg-gray-50">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
					<p className="text-gray-600">Carregando agenda...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-gray-50">
			{/* Header */}
			<div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
				<div className="flex flex-col gap-3">
					{/* Title and main controls */}
					<div className="flex items-center justify-between">
						<h1 className="text-xl sm:text-2xl font-bold text-gray-900">
							Agenda
						</h1>

						{/* Desktop controls */}
						<div className="hidden sm:flex items-center gap-4">
							{/* View mode toggle */}
							<div className="flex items-center bg-gray-100 rounded-lg p-1">
								<button
									onClick={() => {
										setViewMode("week");
									}}
									className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
										viewMode === "week"
											? "bg-white text-primary-600 shadow-sm"
											: "text-gray-600 hover:text-gray-900"
									}`}
								>
									Semana
								</button>
								<button
									onClick={() => {
										setViewMode("month");
									}}
									className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
										viewMode === "month"
											? "bg-white text-primary-600 shadow-sm"
											: "text-gray-600 hover:text-gray-900"
									}`}
								>
									Mês
								</button>
							</div>

							{showCreateButton && !readOnly && (
								<Button
									onClick={handleCreateEvent}
									variant="primary"
									className="flex items-center gap-2"
								>
									<Plus size={16} />
									Adicionar Evento
								</Button>
							)}
						</div>

						{/* Mobile controls */}
						<div className="flex sm:hidden items-center gap-2">
							<button
								onClick={() => {
									setShowFilterMenu(!showFilterMenu);
								}}
								className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
							>
								<Filter size={20} className="text-gray-600" />
								{filterType !== "all" && (
									<div className="absolute top-1 right-1 w-2 h-2 bg-primary-600 rounded-full"></div>
								)}
							</button>

							{showCreateButton && !readOnly && (
								<Button onClick={handleCreateEvent} variant="primary" size="sm">
									<Plus size={20} />
								</Button>
							)}
						</div>
					</div>

					{/* Navigation and period display */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Button variant="outline" size="sm" onClick={goToToday}>
								Hoje
							</Button>
							<div className="flex items-center">
								<button
									onClick={previousPeriod}
									className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
								>
									<ChevronLeft size={20} className="text-gray-600" />
								</button>
								<button
									onClick={nextPeriod}
									className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
								>
									<ChevronRight size={20} className="text-gray-600" />
								</button>
							</div>
						</div>

						{/* Period display */}
						<h2 className="text-sm sm:text-base font-semibold text-gray-800">
							{format(weekStart, "d", { locale: ptBR })} -{" "}
							{format(weekEnd, "d 'de' MMMM", { locale: ptBR })}
						</h2>
					</div>

					{/* Desktop filter */}
					<div className="hidden sm:flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="text-sm text-gray-600">Filtrar:</span>
							<div className="flex items-center gap-1">
								{["all", "show", "rehearsal", "meeting", "personal"].map(
									(type) => (
										<button
											key={type}
											onClick={() => {
												setFilterType(type);
											}}
											className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
												filterType === type
													? type === "all"
														? "bg-gray-800 text-white"
														: `${eventTypeConfig[type as keyof typeof eventTypeConfig]?.color} text-white`
													: "bg-gray-100 text-gray-600 hover:bg-gray-200"
											}`}
										>
											{type === "all"
												? "Todos"
												: eventTypeConfig[type as keyof typeof eventTypeConfig]
														?.label}
										</button>
									)
								)}
							</div>
						</div>

						{/* Legend */}
						<div className="flex items-center gap-3 text-xs">
							{Object.entries(eventTypeConfig).map(([type, config]) => (
								<div key={type} className="flex items-center gap-1">
									<div className={`w-3 h-3 rounded-full ${config.color}`}></div>
									<span className="text-gray-600">{config.label}</span>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Mobile filter menu */}
				{showFilterMenu && (
					<div className="sm:hidden absolute top-16 right-3 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-gray-700">Filtros</span>
							<button
								onClick={() => {
									setShowFilterMenu(false);
								}}
								className="p-1 hover:bg-gray-100 rounded"
							>
								<X size={16} className="text-gray-500" />
							</button>
						</div>
						<div className="space-y-1">
							{["all", "show", "rehearsal", "meeting", "personal"].map(
								(type) => (
									<button
										key={type}
										onClick={() => {
											setFilterType(type);
											setShowFilterMenu(false);
										}}
										className={`w-full px-3 py-2 rounded text-left text-sm transition-colors ${
											filterType === type
												? "bg-primary-50 text-primary-700 font-medium"
												: "hover:bg-gray-100 text-gray-700"
										}`}
									>
										<div className="flex items-center gap-2">
											{type !== "all" && (
												<div
													className={`w-3 h-3 rounded-full ${eventTypeConfig[type as keyof typeof eventTypeConfig]?.color}`}
												></div>
											)}
											<span>
												{type === "all"
													? "Todos"
													: eventTypeConfig[
															type as keyof typeof eventTypeConfig
														]?.label}
											</span>
										</div>
									</button>
								)
							)}
						</div>
					</div>
				)}
			</div>

			{/* Calendar Grid */}
			<div className="flex-1 bg-white border-l border-r border-gray-200 overflow-hidden">
				<DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
					{/* Week days header */}
					<div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
						<div className="p-2 sm:p-4 border-r border-gray-200"></div>
						{weekDays.map((day, index) => {
							const dayEvents = getEventsForDay(filteredEvents, day);
							const hasEvents = dayEvents.length > 0;

							return (
								<div
									key={day.toISOString()}
									className="p-2 sm:p-4 border-r border-gray-200 text-center relative"
								>
									<div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
										{weekDayNames[index]}
									</div>
									<div
										className={`text-sm sm:text-lg font-semibold ${
											isToday(day)
												? "text-primary-600 bg-primary-100 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mx-auto text-xs sm:text-base"
												: "text-gray-900"
										}`}
									>
										{format(day, "d")}
									</div>

									{/* "Ocupado" indicator */}
									{hasEvents && (
										<div className="absolute top-1 right-1">
											<div className="w-2 h-2 bg-red-500 rounded-full border border-white shadow-sm"></div>
										</div>
									)}
								</div>
							);
						})}
					</div>

					{/* Time grid with events */}
					<div
						className="flex-1 overflow-y-auto"
						style={{ maxHeight: "calc(100vh - 200px)" }}
					>
						<div className="relative">
							{/* Time slots grid */}
							{hours.map((hour) => (
								<div
									key={hour}
									className="grid grid-cols-8 border-b border-gray-100"
									style={{ height: "64px" }}
								>
									{/* Hour label */}
									<div className="p-2 sm:p-4 border-r border-gray-200 text-xs sm:text-sm text-gray-500 font-medium bg-gray-50 flex items-start">
										{String(hour).padStart(2, "0")}:00
									</div>

									{/* Day columns */}
									{weekDays.map((day, dayIndex) => (
										<DroppableTimeSlot
											key={`${day.toISOString()}-${hour}`}
											id={`slot-${dayIndex}-${hour}`}
											day={day}
											dayIndex={dayIndex}
											hour={hour}
											className="border-r border-gray-200 hover:bg-primary-50 transition-colors cursor-pointer min-h-[64px]"
											onClick={() => {
												handleTimeSlotClick(day, hour);
											}}
										/>
									))}
								</div>
							))}

							{/* Events overlay */}
							<div className="absolute top-0 left-0 w-full h-full pointer-events-none">
								{weekDays.map((day, dayIndex) => {
									const dayEvents = getEventsForDay(filteredEvents, day);

									return dayEvents.map((event) => (
										<div
											key={event.id}
											className="absolute pointer-events-auto"
											style={{
												left: `${100 / 8 + (100 / 8) * dayIndex + 0.5}%`,
												width: `${100 / 8 - 1}%`,
												top: `${getEventTopPosition(event)}px`,
												height: `${getEventHeight(event)}px`,
												minHeight: "32px",
											}}
										>
											<DraggableEvent
												event={event}
												style={{
													width: "100%",
													height: "100%",
												}}
												onClick={() => {
													handleEventClick(event);
												}}
											/>
										</div>
									));
								})}
							</div>
						</div>
					</div>

					{/* Drag Overlay */}
					<DragOverlay>
						{draggedEvent ? (
							<div
								className={`rounded-lg border-l-4 px-3 py-2 shadow-lg ${getEventTypeColor(draggedEvent.type)} opacity-80 cursor-grabbing`}
								style={{
									width: "200px",
									height: `${getEventHeight(draggedEvent)}px`,
									minHeight: "32px",
								}}
							>
								<div className="text-sm font-medium truncate">
									{draggedEvent.title}
								</div>
								{getEventHeight(draggedEvent) > 40 && (
									<div className="text-xs opacity-90 truncate">
										{draggedEvent.startTime} - {draggedEvent.endTime}
									</div>
								)}
							</div>
						) : null}
					</DragOverlay>
				</DndContext>
			</div>

			{/* Events list for small screens */}
			<div className="sm:hidden bg-white border-t border-gray-200 max-h-48 overflow-y-auto">
				{filteredEvents.length > 0 ? (
					<div className="p-4">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-sm font-semibold text-gray-800">
								Eventos ({filteredEvents.length})
							</h3>
							{showCreateButton && !readOnly && (
								<Button onClick={handleCreateEvent} size="sm" variant="primary">
									<Plus size={16} className="mr-1" />
									Novo
								</Button>
							)}
						</div>
						<div className="space-y-2">
							{filteredEvents.map((event) => (
								<div
									key={event.id}
									className="bg-gray-50 rounded-lg p-3 border border-gray-200 relative"
									onClick={() => {
										handleEventClick(event);
									}}
								>
									<div className="flex items-center justify-between">
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<h4 className="font-medium text-gray-900 text-sm truncate">
													{event.title}
												</h4>
												<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800 border border-red-200">
													Ocupado
												</span>
											</div>
											<div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
												<span className="flex items-center gap-1">
													<Calendar className="h-3 w-3" />
													{format(event.date, "dd/MM", { locale: ptBR })}
												</span>
												<span className="flex items-center gap-1">
													<Clock className="h-3 w-3" />
													{event.startTime} - {event.endTime}
												</span>
											</div>
										</div>
										<div
											className={`w-3 h-3 rounded-full ${eventTypeConfig[event.type]?.color || "bg-gray-400"}`}
										/>
									</div>
								</div>
							))}
						</div>
					</div>
				) : (
					<div className="p-4 text-center text-gray-500 text-sm">
						Nenhum evento encontrado
					</div>
				)}
			</div>

			{/* Modals */}
			<EventDetailsModal
				event={selectedEvent}
				isOpen={showDetailsModal}
				onClose={() => {
					setShowDetailsModal(false);
					setSelectedEvent(null);
				}}
				onUpdate={handleEventUpdate}
				onDelete={handleEventDelete}
				readOnly={readOnly}
			/>

			<CreateEventModal
				isOpen={showCreateModal}
				onClose={() => {
					setShowCreateModal(false);
					setCreateEventData({});
				}}
				onSubmit={handleEventCreate}
				initialDate={createEventData.date || currentDate}
				initialStartTime={createEventData.startTime}
				initialEndTime={createEventData.endTime}
			/>
		</div>
	);
};
