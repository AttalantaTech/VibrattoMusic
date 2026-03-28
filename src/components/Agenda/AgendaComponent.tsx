// import { useState, useEffect, useCallback } from "react";

// // Temporary mock services until implementation is complete
// const eventService = {
// 	getProductEvents: async (..._args: Array<any>) => ({ data: [] }),
// 	createEvent: async (..._args: Array<any>) => ({ id: 1 }),
// 	updateEvent: async (..._args: Array<any>) => ({ id: 1 }),
// 	deleteEvent: async (..._args: Array<any>) => ({}),
// 	checkAvailability: async (..._args: Array<any>) => ({
// 		available: true,
// 		conflicts: [],
// 	}),
// };

// const EventService = {
// 	apiEventToAgendaEvent: (event: any) => event,
// 	agendaEventToApiEvent: (event: any, _produtoMusicalId?: any) => event,
// 	validateEventData: () => true,
// };

// const bookingService = {
// 	getProductBookings: async () => ({ data: [] }),
// 	getBookingCalendar: async (..._args: Array<any>) => [],
// };
// import {
// 	Plus,
// 	ChevronLeft,
// 	ChevronRight,
// 	Calendar,
// 	Clock,
// 	Filter,
// 	X,
// 	Loader2,
// 	Trash2,
// } from "lucide-react";
// import {
// 	format,
// 	startOfWeek,
// 	endOfWeek,
// 	eachDayOfInterval,
// 	isToday,
// 	addWeeks,
// 	subWeeks,
// 	isSameDay,
// 	parseISO,
// 	addMonths,
// 	subMonths,
// 	startOfMonth,
// 	endOfMonth,
// } from "date-fns";
// import { ptBR } from "date-fns/locale";
// import {
// 	DndContext,
// 	DragOverlay,
// 	type DragEndEvent,
// 	type DragStartEvent,
// } from "@dnd-kit/core";
// import { toast } from "sonner";

// // Internal imports
// import type { AgendaEvent } from "../BandProfile/Agenda/types";
// import { eventTypeConfig } from "../BandProfile/Agenda/types";
// import { DraggableEvent } from "../BandProfile/Agenda/DraggableEvent";
// import { DroppableTimeSlot } from "../BandProfile/Agenda/DroppableTimeSlot";
// import { CreateEventModal } from "../BandProfile/Agenda/CreateEventModal";
// import { EventDetailsModal } from "../BandProfile/Agenda/EventDetailsModal";
// import { Button } from "../ui/Button/Button";
// import { Input } from "../ui/Input/Input";
// import { Label } from "../ui/Label/Label";
// import { onboardingService } from "../../api";
// import type { ScheduleApiResponse, MusicalProductSchedule } from "../../api/types";

// // Props interface for the unified component
// export interface AgendaComponentProps {
// 	// Data
// 	events?: Array<AgendaEvent>;
// 	onEventsChange?: (events: Array<AgendaEvent>) => void;

// 	// Event handlers
// 	onEventCreate?: (eventData: Partial<AgendaEvent>) => void;
// 	onEventUpdate?: (updatedEvent: AgendaEvent) => void;
// 	onEventDelete?: (eventId: number) => void;
// 	onEventClick?: (event: AgendaEvent) => void;

// 	// Display options
// 	initialDate?: Date;
// 	readOnly?: boolean;
// 	allowDragAndDrop?: boolean;
// 	showCreateButton?: boolean;
// 	viewMode?: "week" | "month" | "form";

// 	// API integration
// 	produtoMusicalId?: number;
// 	enableApiSync?: boolean;

// 	// Simple mode (like old Agenda component)
// 	simpleMode?: boolean;
// }

// // Calendar utilities
// const getEventHeight = (event: AgendaEvent) => {
// 	const [startHour = 0, startMinute = 0] = event.startTime
// 		.split(":")
// 		.map(Number);
// 	const [endHour = 0, endMinute = 0] = event.endTime.split(":").map(Number);

// 	const startInMinutes = startHour * 60 + startMinute;
// 	const endInMinutes = endHour * 60 + endMinute;

// 	return ((endInMinutes - startInMinutes) / 60) * 64; // 64px per hour
// };

// const getEventTopPosition = (event: AgendaEvent) => {
// 	const [startHour = 0, startMinute = 0] = event.startTime
// 		.split(":")
// 		.map(Number);
// 	return (((startHour - 7) * 60 + startMinute) / 60) * 64; // 7 AM is grid start
// };

// const getEventsForDay = (events: Array<AgendaEvent>, day: Date) => {
// 	return events.filter((event) => isSameDay(event.date, day));
// };

// export const AgendaComponent = ({
// 	events: propEvents = [],
// 	onEventsChange,
// 	onEventCreate,
// 	onEventUpdate,
// 	onEventDelete,
// 	onEventClick,
// 	initialDate = new Date(),
// 	readOnly = false,
// 	allowDragAndDrop = true,
// 	showCreateButton = true,
// 	viewMode: initialViewMode = "week",
// 	produtoMusicalId,
// 	enableApiSync = false,
// 	simpleMode = false,
// }: AgendaComponentProps) => {
// 	const [currentDate, setCurrentDate] = useState(initialDate);
// 	const [events, setEvents] = useState<Array<AgendaEvent>>(propEvents);
// 	const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
// 	const [showCreateModal, setShowCreateModal] = useState(false);
// 	const [showDetailsModal, setShowDetailsModal] = useState(false);
// 	const [createEventData, setCreateEventData] = useState<{
// 		date?: Date;
// 		startTime?: string;
// 		endTime?: string;
// 	}>({});

// 	// Debug produtoMusicalId - log only once
// 	useEffect(() => {
// 		if (produtoMusicalId) {
// 			// Debug removed for production
// 		}
// 	}, [produtoMusicalId, enableApiSync]);
// 	const [draggedEvent, setDraggedEvent] = useState<AgendaEvent | null>(null);
// 	const [filterType, setFilterType] = useState<string>("all");
// 	const [loading, setLoading] = useState(false);
// 	const [viewMode, setViewMode] = useState<"week" | "month" | "form">(
// 		initialViewMode
// 	);
// 	const [showFilterMenu, setShowFilterMenu] = useState(false);
// 	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
// 	const [newEvent, setNewEvent] = useState({
// 		title: "",
// 		description: "",
// 		startTime: "12:00",
// 		endTime: "13:00",
// 	});
// 	const [hasLoadedEvents, setHasLoadedEvents] = useState(false);

// 	// Load events from API
// 	const loadEvents = useCallback(async () => {
// 		if (!produtoMusicalId || !enableApiSync) return;

// 		setLoading(true);
// 		try {
// 			// Get current month and year
// 			const startDate = startOfMonth(currentDate);
// 			const endDate = endOfMonth(currentDate);
// 			const startDateString = format(startDate, "yyyy-MM-dd");
// 			const endDateString = format(endDate, "yyyy-MM-dd");

// 			// Try to load from event service first (if available)
// 			try {
// 				const eventResponse = await eventService.getProductEvents(
// 					produtoMusicalId,
// 					startDateString,
// 					endDateString,
// 					{ limit: 100 }
// 				);

// 				if (eventResponse.data && eventResponse.data.length > 0) {
// 					const apiEvents = eventResponse.data.map((event: any) =>
// 						EventService.apiEventToAgendaEvent(event)
// 					);
// 					setEvents(apiEvents);
// 					onEventsChange?.(apiEvents);
// 					return;
// 				}
// 			} catch (eventError) {
// 				// Event service might not be implemented yet, fallback to other methods
// 				console.log("Event service not available, trying booking service");
// 			}

// 			// Try booking service for confirmed bookings
// 			try {
// 				const month = format(currentDate, "yyyy-MM");
// 				const bookingCalendar = await bookingService.getBookingCalendar(
// 					produtoMusicalId,
// 					month
// 				);

// 				const bookingEvents: Array<AgendaEvent> = [];
// 				(bookingCalendar as Array<any>).forEach((dayData: any) => {
// 					dayData.bookings.forEach((booking: any) => {
// 						bookingEvents.push({
// 							id: booking.id,
// 							title: `Booking #${booking.id}`,
// 							description: "",
// 							date: parseISO(dayData.data),
// 							startTime: booking.horaInicio,
// 							endTime: booking.horaFim,
// 							location: "",
// 							type: "show",
// 							status:
// 								booking.status === "confirmado"
// 									? "confirmed"
// 									: booking.status === "cancelado"
// 										? "cancelled"
// 										: "pending",
// 						});
// 					});
// 				});

// 				if (bookingEvents.length > 0) {
// 					setEvents(bookingEvents);
// 					onEventsChange?.(bookingEvents);
// 					return;
// 				}
// 			} catch (bookingError) {
// 				console.log(
// 					"Booking calendar not available, trying onboarding schedule"
// 				);
// 			}

// 			// Fallback to onboarding schedule
// 			const response = await onboardingService.getSchedule(produtoMusicalId);

// 			// Handle both array format and object format
// 			if (response) {
// 				let apiEvents: Array<AgendaEvent> = [];

// 				// If response is an object with compromissos array
// 				if (response.compromissos && Array.isArray(response.compromissos)) {
// 					apiEvents = response.compromissos.map(
// 						(compromisso: any, index: number) => {
// 							// Generate a stable ID based on the event data if not provided by backend
// 							const eventId =
// 								compromisso.id ||
// 								`${compromisso.data}_${compromisso.horaInicio}_${index}`.replace(
// 									/[^a-zA-Z0-9]/g,
// 									"_"
// 								);

// 							return {
// 								id: eventId,
// 								title: compromisso.titulo,
// 								description: compromisso.descricao || "",
// 								date: parseISO(compromisso.data),
// 								startTime: compromisso.horaInicio,
// 								endTime: compromisso.horaFim,
// 								type: determineEventType(compromisso),
// 								status: "confirmed" as const,
// 							};
// 						}
// 					);
// 				}
// 				// If response is an array of days with compromissos
// 				else if (Array.isArray(response)) {
// 					(response as Array<ScheduleApiResponse>).forEach((dayData) => {
// 						if (dayData.compromissos && dayData.compromissos.length > 0) {
// 							dayData.compromissos.forEach((compromisso) => {
// 								apiEvents.push({
// 									id: compromisso.id,
// 									title: compromisso.titulo,
// 									description: compromisso.descricao,
// 									date: parseISO(dayData.data),
// 									startTime: compromisso.horaInicio,
// 									endTime: compromisso.horaFim,
// 									type: "show",
// 									status: "confirmed",
// 								});
// 							});
// 						}
// 					});
// 				}

// 				setEvents(apiEvents);
// 				onEventsChange?.(apiEvents);
// 			}
// 		} catch (error) {
// 			toast.error("Erro ao carregar eventos");
// 		} finally {
// 			setLoading(false);
// 		}
// 	}, [produtoMusicalId, enableApiSync, onEventsChange, currentDate]);

// 	// Load events on mount and when produtoMusicalId changes
// 	useEffect(() => {
// 		if (
// 			produtoMusicalId &&
// 			enableApiSync &&
// 			!hasLoadedEvents &&
// 			(!propEvents || propEvents.length === 0)
// 		) {
// 			setHasLoadedEvents(true);
// 			loadEvents();
// 		}
// 		// eslint-disable-next-line react-hooks/exhaustive-deps
// 	}, [produtoMusicalId, enableApiSync]); // Removed loadEvents and propEvents to prevent infinite loop

// 	// Update events when propEvents changes
// 	useEffect(() => {
// 		if (propEvents && propEvents.length > 0) {
// 			setEvents(propEvents);
// 		}
// 	}, [propEvents]);

// 	// Update currentDate when initialDate changes
// 	useEffect(() => {
// 		setCurrentDate(initialDate);
// 	}, [initialDate]);

// 	// Reload events when month changes
// 	useEffect(() => {
// 		if (produtoMusicalId && enableApiSync && hasLoadedEvents) {
// 			loadEvents();
// 		}
// 		// eslint-disable-next-line react-hooks/exhaustive-deps
// 	}, [currentDate.getMonth(), currentDate.getFullYear()]); // Only reload when month or year changes

// 	// Save events to API
// 	const saveEventsToAPI = async (eventsToSave: Array<AgendaEvent>) => {
// 		if (!produtoMusicalId || !enableApiSync) {
// 			return;
// 		}

// 		// Try to use event service first
// 		try {
// 			// Check if we can use the event service
// 			const testDate = format(new Date(), "yyyy-MM-dd");
// 			await eventService.checkAvailability(
// 				produtoMusicalId,
// 				testDate,
// 				"09:00",
// 				"10:00"
// 			);

// 			// If we get here, event service is available
// 			// Delete all existing events and recreate them (simple sync approach)
// 			// In a real implementation, we'd do a proper diff
// 			const promises = eventsToSave.map((event) => {
// 				const eventData = EventService.agendaEventToApiEvent(
// 					event,
// 					produtoMusicalId
// 				);
// 				if (typeof event.id === "number" && event.id > 0) {
// 					// Update existing event
// 					return eventService.updateEvent(event.id, eventData);
// 				} else {
// 					// Create new event
// 					return eventService.createEvent(eventData);
// 				}
// 			});

// 			await Promise.all(promises);
// 			return;
// 		} catch (eventServiceError) {
// 			// Event service not available, fall back to onboarding service
// 			console.log(
// 				"Event service not available for saving, using onboarding service"
// 			);
// 		}

// 		// Fallback to onboarding service
// 		const scheduleData: MusicalProductSchedule = {
// 			compromissos: eventsToSave.map((event) => {
// 				const formattedDate = format(event.date, "yyyy-MM-dd");

// 				// Map event type to disponibilidadeOutrosEventos
// 				// personal events = true (available for other events)
// 				// show, rehearsal, meeting = false (not available)
// 				const disponibilidadeOutrosEventos = event.type === "personal";

// 				return {
// 					data: formattedDate,
// 					titulo: event.title,
// 					descricao: event.description || "",
// 					horaInicio: event.startTime,
// 					horaFim: event.endTime,
// 					disponibilidadeOutrosEventos,
// 				};
// 			}),
// 		};

// 		try {
// 			const result = await onboardingService.updateSchedule(
// 				produtoMusicalId,
// 				scheduleData
// 			);
// 			return result;
// 		} catch (apiError) {
// 			throw apiError;
// 		}
// 	};

// 	// Calculate boundaries based on view mode
// 	const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
// 	const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
// 	const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

// 	const monthStart = startOfMonth(currentDate);
// 	const monthEnd = endOfMonth(currentDate);
// 	const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

// 	// Hours from 7 AM to 11 PM
// 	const hours = Array.from({ length: 17 }, (_, index) => index + 7);
// 	const weekDayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// 	// Navigation functions
// 	const nextPeriod = () => {
// 		if (viewMode === "week") {
// 			setCurrentDate(addWeeks(currentDate, 1));
// 		} else if (viewMode === "month") {
// 			setCurrentDate(addMonths(currentDate, 1));
// 		}
// 	};

// 	const previousPeriod = () => {
// 		if (viewMode === "week") {
// 			setCurrentDate(subWeeks(currentDate, 1));
// 		} else if (viewMode === "month") {
// 			setCurrentDate(subMonths(currentDate, 1));
// 		}
// 	};

// 	const goToToday = () => {
// 		setCurrentDate(new Date());
// 	};

// 	// Helper function to determine event type from backend data
// 	const determineEventType = (compromisso: any): AgendaEvent["type"] => {
// 		// If disponibilidadeOutrosEventos is true, it's a personal event
// 		if (compromisso.disponibilidadeOutrosEventos) {
// 			return "personal";
// 		}

// 		// Try to infer from title or description
// 		const titleLower = (compromisso.titulo || "").toLowerCase();
// 		const descLower = (compromisso.descricao || "").toLowerCase();

// 		if (titleLower.includes("ensaio") || descLower.includes("ensaio")) {
// 			return "rehearsal";
// 		}
// 		if (
// 			titleLower.includes("reunião") ||
// 			titleLower.includes("meeting") ||
// 			descLower.includes("reunião") ||
// 			descLower.includes("meeting")
// 		) {
// 			return "meeting";
// 		}

// 		// Default to show
// 		return "show";
// 	};

// 	// Filter events
// 	const filteredEvents = events.filter(
// 		(event) => filterType === "all" || event.type === filterType
// 	);

// 	// Drag and Drop handlers
// 	const handleDragStart = (event: DragStartEvent) => {
// 		const { active } = event;
// 		if (active.data.current?.["type"] === "event") {
// 			setDraggedEvent(active.data.current["event"] as AgendaEvent);
// 		}
// 	};

// 	const handleDragEnd = async (event: DragEndEvent) => {
// 		const { active, over } = event;
// 		setDraggedEvent(null);

// 		if (!over || !active.data.current || !allowDragAndDrop || readOnly) return;

// 		const draggedEventData = active.data.current["event"] as AgendaEvent;
// 		const targetSlot = over.data.current;

// 		if (targetSlot?.["type"] === "timeslot") {
// 			const newDate = targetSlot["day"] as Date;
// 			const newStartHour = targetSlot["hour"] as number;

// 			// Calculate event duration to maintain it
// 			const [originalStartHour = 0, originalStartMinute = 0] =
// 				draggedEventData.startTime.split(":").map(Number);
// 			const [originalEndHour = 0, originalEndMinute = 0] =
// 				draggedEventData.endTime.split(":").map(Number);

// 			const originalDurationMinutes =
// 				originalEndHour * 60 +
// 				originalEndMinute -
// 				(originalStartHour * 60 + originalStartMinute);

// 			const newStartTime = `${String(newStartHour).padStart(2, "0")}:00`;
// 			const newEndHour = Math.floor(
// 				(newStartHour * 60 + originalDurationMinutes) / 60
// 			);
// 			const newEndMinute = (newStartHour * 60 + originalDurationMinutes) % 60;
// 			const newEndTime = `${String(newEndHour).padStart(2, "0")}:${String(newEndMinute).padStart(2, "0")}`;

// 			const updatedEvent: AgendaEvent = {
// 				...draggedEventData,
// 				date: newDate,
// 				startTime: newStartTime,
// 				endTime: newEndTime,
// 			};

// 			// Update local state immediately
// 			const newEvents = events.map((e) =>
// 				e.id === updatedEvent.id ? updatedEvent : e
// 			);
// 			setEvents(newEvents);
// 			onEventsChange?.(newEvents);

// 			// Call parent handler
// 			onEventUpdate?.(updatedEvent);

// 			// Save to API if enabled
// 			if (produtoMusicalId && enableApiSync) {
// 				try {
// 					await saveEventsToAPI(newEvents);
// 					toast.success("Evento movido com sucesso");
// 				} catch (error) {
// 					// Revert on error
// 					setEvents(events);
// 					onEventsChange?.(events);
// 					toast.error("Erro ao mover evento");
// 				}
// 			}
// 		}
// 	};

// 	// Event handlers
// 	const handleEventClick = (event: AgendaEvent) => {
// 		if (readOnly) {
// 			onEventClick?.(event);
// 			return;
// 		}
// 		setSelectedEvent(event);
// 		setShowDetailsModal(true);
// 		onEventClick?.(event);
// 	};

// 	const handleCreateEvent = () => {
// 		if (readOnly) return;
// 		setShowCreateModal(true);
// 	};

// 	const handleTimeSlotClick = (day: Date, hour: number) => {
// 		if (readOnly) return;

// 		setCreateEventData({
// 			date: day,
// 			startTime: `${String(hour).padStart(2, "0")}:00`,
// 			endTime: `${String(hour + 1).padStart(2, "0")}:00`,
// 		});
// 		setShowCreateModal(true);
// 	};

// 	const handleEventCreate = async (eventData: Partial<AgendaEvent>) => {
// 		// Check for conflicts before creating
// 		if (
// 			produtoMusicalId &&
// 			enableApiSync &&
// 			eventData.date &&
// 			eventData.startTime &&
// 			eventData.endTime
// 		) {
// 			try {
// 				const dateString = format(eventData.date, "yyyy-MM-dd");
// 				const availability = await eventService.checkAvailability(
// 					produtoMusicalId,
// 					dateString,
// 					eventData.startTime,
// 					eventData.endTime
// 				);

// 				if (!availability.available && availability.conflicts) {
// 					const conflictMessages = availability.conflicts
// 						.map(
// 							(conflict: any) =>
// 								`${conflict.title} (${conflict.startTime} - ${conflict.endTime})`
// 						)
// 						.join(", ");
// 					toast.error(`Conflito com eventos existentes: ${conflictMessages}`);
// 					return;
// 				}
// 			} catch (checkError) {
// 				// If conflict check fails, continue anyway (service might not be available)
// 				console.log("Could not check for conflicts, proceeding anyway");
// 			}
// 		}

// 		// Generate a unique ID for the new event
// 		const timestamp = Date.now();
// 		const dateString = format(
// 			eventData.date || selectedDate || currentDate,
// 			"yyyy-MM-dd"
// 		);
// 		const eventId = `new_${dateString}_${timestamp}`;

// 		const newEvent: AgendaEvent = {
// 			id: eventId,
// 			title: eventData.title || "",
// 			description: eventData.description,
// 			date: eventData.date || selectedDate || currentDate,
// 			startTime: eventData.startTime || "09:00",
// 			endTime: eventData.endTime || "10:00",
// 			type: eventData.type || "show",
// 			status: "confirmed",
// 			...eventData,
// 		};

// 		// Update local state
// 		const updatedEvents = [...events, newEvent];
// 		setEvents(updatedEvents);
// 		onEventsChange?.(updatedEvents);

// 		// Call parent handler
// 		onEventCreate?.(eventData);

// 		// Save to API
// 		if (produtoMusicalId && enableApiSync) {
// 			try {
// 				// Try event service first
// 				try {
// 					const createdEvent = await eventService.createEvent(
// 						EventService.agendaEventToApiEvent(newEvent, produtoMusicalId)
// 					);
// 					// Update the event with the real ID from backend
// 					const updatedEventsWithId = updatedEvents.map((e) =>
// 						e.id === eventId ? { ...e, id: createdEvent.id } : e
// 					);
// 					setEvents(updatedEventsWithId);
// 					onEventsChange?.(updatedEventsWithId);
// 					toast.success("Evento criado com sucesso");
// 					setShowCreateModal(false);
// 					setCreateEventData({});
// 					return;
// 				} catch (eventServiceError) {
// 					// Fall back to saveEventsToAPI
// 					console.log(
// 						"Event service not available for creating, using onboarding service"
// 					);
// 				}

// 				await saveEventsToAPI(updatedEvents);
// 				toast.success("Evento criado com sucesso");

// 				// Don't reload immediately - the event is already in the local state
// 			} catch (error) {
// 				// Revert on error
// 				setEvents(events);
// 				onEventsChange?.(events);
// 				toast.error("Erro ao criar evento");
// 			}
// 		}

// 		setShowCreateModal(false);
// 	};

// 	const handleEventUpdate = async (updatedEvent: AgendaEvent) => {
// 		// Check for conflicts if time changed
// 		if (
// 			produtoMusicalId &&
// 			enableApiSync &&
// 			(updatedEvent.date !== selectedEvent?.date ||
// 				updatedEvent.startTime !== selectedEvent?.startTime ||
// 				updatedEvent.endTime !== selectedEvent?.endTime)
// 		) {
// 			try {
// 				const dateString = format(updatedEvent.date, "yyyy-MM-dd");
// 				const availability = await eventService.checkAvailability(
// 					produtoMusicalId,
// 					dateString,
// 					updatedEvent.startTime,
// 					updatedEvent.endTime,
// 					typeof updatedEvent.id === "number" ? updatedEvent.id : undefined
// 				);

// 				if (!availability.available && availability.conflicts) {
// 					const conflictMessages = availability.conflicts
// 						.map(
// 							(conflict: any) =>
// 								`${conflict.title} (${conflict.startTime} - ${conflict.endTime})`
// 						)
// 						.join(", ");
// 					toast.error(`Conflito com eventos existentes: ${conflictMessages}`);
// 					return;
// 				}
// 			} catch (checkError) {
// 				console.log("Could not check for conflicts, proceeding anyway");
// 			}
// 		}

// 		const updatedEvents = events.map((e) =>
// 			e.id === updatedEvent.id ? updatedEvent : e
// 		);
// 		setEvents(updatedEvents);
// 		onEventsChange?.(updatedEvents);

// 		onEventUpdate?.(updatedEvent);

// 		if (produtoMusicalId && enableApiSync) {
// 			try {
// 				// Try event service first
// 				if (typeof updatedEvent.id === "number") {
// 					try {
// 						await eventService.updateEvent(
// 							updatedEvent.id,
// 							EventService.agendaEventToApiEvent(updatedEvent, produtoMusicalId)
// 						);
// 						toast.success("Evento atualizado com sucesso");
// 						setShowDetailsModal(false);
// 						setSelectedEvent(null);
// 						return;
// 					} catch (eventServiceError) {
// 						console.log(
// 							"Event service not available for updating, using onboarding service"
// 						);
// 					}
// 				}

// 				await saveEventsToAPI(updatedEvents);
// 				toast.success("Evento atualizado com sucesso");
// 			} catch (error) {
// 				setEvents(events);
// 				onEventsChange?.(events);
// 				toast.error("Erro ao atualizar evento");
// 			}
// 		}

// 		setShowDetailsModal(false);
// 		setSelectedEvent(null);
// 	};

// 	const handleEventDelete = async (eventId: number | string) => {
// 		const updatedEvents = events.filter((e) => e.id !== eventId);
// 		setEvents(updatedEvents);
// 		onEventsChange?.(updatedEvents);

// 		onEventDelete?.(
// 			typeof eventId === "number" ? eventId : parseInt(eventId.toString())
// 		);

// 		if (produtoMusicalId && enableApiSync) {
// 			try {
// 				// Try event service first
// 				if (typeof eventId === "number") {
// 					try {
// 						await eventService.deleteEvent(eventId);
// 						toast.success("Evento removido com sucesso");
// 						setShowDetailsModal(false);
// 						setSelectedEvent(null);
// 						return;
// 					} catch (eventServiceError) {
// 						console.log(
// 							"Event service not available for deleting, using onboarding service"
// 						);
// 					}
// 				}

// 				await saveEventsToAPI(updatedEvents);
// 				toast.success("Evento removido com sucesso");
// 			} catch (error) {
// 				setEvents(events);
// 				onEventsChange?.(events);
// 				toast.error("Erro ao remover evento");
// 			}
// 		}

// 		setShowDetailsModal(false);
// 		setSelectedEvent(null);
// 	};

// 	// Simple mode handlers (like the old Agenda component)
// 	const handleDateClick = (day: Date) => {
// 		setSelectedDate(day);
// 	};

// 	const handleAddEventSimple = () => {
// 		if (!selectedDate || !newEvent.title) return;

// 		// Generate a unique ID for the new event
// 		const timestamp = Date.now();
// 		const dateString = format(selectedDate, "yyyy-MM-dd");
// 		const eventId = `new_${dateString}_${timestamp}`;

// 		const event: AgendaEvent = {
// 			id: eventId,
// 			title: newEvent.title,
// 			description: newEvent.description,
// 			date: selectedDate,
// 			startTime: newEvent.startTime,
// 			endTime: newEvent.endTime,
// 			type: "show",
// 			status: "confirmed",
// 		};

// 		const updatedEvents = [...events, event];
// 		setEvents(updatedEvents);
// 		onEventsChange?.(updatedEvents);

// 		setNewEvent({
// 			title: "",
// 			description: "",
// 			startTime: "12:00",
// 			endTime: "13:00",
// 		});
// 	};

// 	const handleRemoveEventSimple = (id: number) => {
// 		const updatedEvents = events.filter((event) => event.id !== id);
// 		setEvents(updatedEvents);
// 		onEventsChange?.(updatedEvents);
// 	};

// 	// Event type colors
// 	const getEventTypeColor = (type: string) => {
// 		const config = eventTypeConfig[type as keyof typeof eventTypeConfig];
// 		return config
// 			? `${config.color} ${config.borderColor} text-white`
// 			: "bg-primary-500 border-primary-600 text-white";
// 	};

// 	const formatDate = (date: Date) => {
// 		return format(date, "dd MMMM yyyy", { locale: ptBR });
// 	};

// 	// Render loading state
// 	if (loading) {
// 		return (
// 			<div className="flex items-center justify-center h-full bg-gray-50">
// 				<div className="text-center">
// 					<Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
// 					<p className="text-gray-600">Carregando agenda...</p>
// 				</div>
// 			</div>
// 		);
// 	}

// 	// Simple month view (like the old Agenda component)
// 	if (simpleMode || viewMode === "form") {
// 		return (
// 			<div className="w-full mx-auto p-4 bg-white">
// 				{/* Cabeçalho do calendário */}
// 				<div className="flex justify-between items-center mb-4">
// 					<button
// 						className="p-2 rounded hover:bg-gray-100"
// 						onClick={previousPeriod}
// 					>
// 						<ChevronLeft size={28} />
// 					</button>
// 					<h2 className="text-xl font-bold">
// 						{format(currentDate, "MMMM yyyy", { locale: ptBR }).toUpperCase()}
// 					</h2>
// 					<button
// 						className="p-2 rounded hover:bg-gray-100"
// 						onClick={nextPeriod}
// 					>
// 						<ChevronRight size={28} />
// 					</button>
// 				</div>

// 				{/* Dias da semana */}
// 				<div className="grid grid-cols-7 gap-1 mb-2">
// 					{weekDayNames.map((day) => (
// 						<div key={day} className="text-center font-medium text-sm">
// 							{day}
// 						</div>
// 					))}
// 				</div>

// 				{/* Dias do mês */}
// 				<div className="grid grid-cols-7 gap-1">
// 					{monthDays.map((day) => {
// 						const dayEvents = events.filter((event) =>
// 							isSameDay(event.date, day)
// 						);
// 						return (
// 							<div
// 								key={day.toString()}
// 								className={`min-h-16 p-1 border rounded cursor-pointer hover:bg-gray-50 ${
// 									isToday(day) ? "bg-primary-50" : ""
// 								} ${
// 									selectedDate && isSameDay(day, selectedDate)
// 										? "border-primary-500 border-2"
// 										: ""
// 								}`}
// 								onClick={() => {
// 									handleDateClick(day);
// 								}}
// 							>
// 								<div className="text-right text-sm">{format(day, "d")}</div>
// 								<div className="space-y-1">
// 									{dayEvents.slice(0, 2).map((event) => (
// 										<div
// 											key={event.id}
// 											className="text-xs p-1 bg-primary-100 rounded truncate"
// 										>
// 											{event.title}
// 										</div>
// 									))}
// 									{dayEvents.length > 2 && (
// 										<div className="text-xs text-gray-500">
// 											+{dayEvents.length - 2} mais
// 										</div>
// 									)}
// 								</div>
// 							</div>
// 						);
// 					})}
// 				</div>

// 				{/* Formulário de evento */}
// 				{selectedDate && !readOnly && (
// 					<div className="flex flex-col w-full mt-6 p-4 border rounded-lg">
// 						<h3 className="font-bold mb-2">
// 							Adicionar evento para {formatDate(selectedDate)}
// 						</h3>
// 						<div className="flex flex-col w-full gap-4">
// 							<div>
// 								<Label htmlFor="event-title">Título</Label>
// 								<Input
// 									id="event-title"
// 									placeholder="Ex: Show Empresarial"
// 									value={newEvent.title}
// 									onChange={(event) => {
// 										setNewEvent({ ...newEvent, title: event.target.value });
// 									}}
// 								/>
// 							</div>
// 							<div className="flex w-full gap-4">
// 								<div className="w-full">
// 									<Label htmlFor="start-time">Início</Label>
// 									<Input
// 										id="start-time"
// 										type="time"
// 										value={newEvent.startTime}
// 										onChange={(event) => {
// 											setNewEvent({
// 												...newEvent,
// 												startTime: event.target.value,
// 											});
// 										}}
// 									/>
// 								</div>
// 								<div className="w-full">
// 									<Label htmlFor="end-time">Fim</Label>
// 									<Input
// 										id="end-time"
// 										type="time"
// 										value={newEvent.endTime}
// 										onChange={(event) => {
// 											setNewEvent({ ...newEvent, endTime: event.target.value });
// 										}}
// 									/>
// 								</div>
// 							</div>
// 							<div className="w-full">
// 								<Label htmlFor="description">Descrição</Label>
// 								<textarea
// 									id="description"
// 									placeholder="Digitar..."
// 									className="w-full p-2 border border-gray-300 rounded-md resize-none"
// 									rows={3}
// 									value={newEvent.description}
// 									onChange={(event) => {
// 										setNewEvent({
// 											...newEvent,
// 											description: event.target.value,
// 										});
// 									}}
// 								/>
// 							</div>
// 							<Button
// 								className="w-full"
// 								disabled={!newEvent.title}
// 								onClick={handleAddEventSimple}
// 							>
// 								Adicionar Evento
// 							</Button>
// 						</div>
// 					</div>
// 				)}

// 				{/* Lista de eventos */}
// 				{events.length > 0 && (
// 					<div className="mt-8">
// 						<h3 className="text-lg font-bold mb-4">Agenda</h3>
// 						<div className="space-y-3">
// 							{[...events]
// 								.sort((a, b) => a.date.getTime() - b.date.getTime())
// 								.map((event) => (
// 									<div
// 										key={event.id}
// 										className="p-3 border rounded-lg flex justify-between items-center"
// 									>
// 										<div>
// 											<div className="font-medium">{event.title}</div>
// 											<div className="text-sm text-gray-600">
// 												{formatDate(event.date)} • {event.startTime} -{" "}
// 												{event.endTime}
// 											</div>
// 										</div>
// 										{!readOnly && (
// 											<button
// 												className="text-red-500 hover:text-red-700"
// 												onClick={() => {
// 													handleRemoveEventSimple(Number(event.id));
// 												}}
// 											>
// 												<Trash2 size={20} />
// 											</button>
// 										)}
// 									</div>
// 								))}
// 						</div>
// 					</div>
// 				)}
// 			</div>
// 		);
// 	}

// 	// Advanced view (like AgendaView)
// 	return (
// 		<div className="flex flex-col h-full bg-gray-50">
// 			{/* Header */}
// 			<div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
// 				<div className="flex flex-col gap-3">
// 					{/* Title and main controls */}
// 					<div className="flex items-center justify-between">
// 						<h1 className="text-xl sm:text-2xl font-bold text-gray-900">
// 							Agenda
// 						</h1>

// 						{/* Desktop controls */}
// 						<div className="hidden sm:flex items-center gap-4">
// 							{/* View mode toggle */}
// 							<div className="flex items-center bg-gray-100 rounded-lg p-1">
// 								<button
// 									onClick={() => {
// 										setViewMode("week");
// 									}}
// 									className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
// 										viewMode === "week"
// 											? "bg-white text-primary-600 shadow-sm"
// 											: "text-gray-600 hover:text-gray-900"
// 									}`}
// 								>
// 									Semana
// 								</button>
// 								<button
// 									onClick={() => {
// 										setViewMode("month");
// 									}}
// 									className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
// 										viewMode === "month"
// 											? "bg-white text-primary-600 shadow-sm"
// 											: "text-gray-600 hover:text-gray-900"
// 									}`}
// 								>
// 									Mês
// 								</button>
// 							</div>

// 							{showCreateButton && !readOnly && (
// 								<Button
// 									onClick={handleCreateEvent}
// 									className="bg-primary-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
// 								>
// 									<Plus size={16} />
// 									Adicionar Evento
// 								</Button>
// 							)}
// 						</div>

// 						{/* Mobile controls */}
// 						<div className="flex sm:hidden items-center gap-2">
// 							<button
// 								onClick={() => {
// 									setShowFilterMenu(!showFilterMenu);
// 								}}
// 								className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
// 							>
// 								<Filter size={20} className="text-gray-600" />
// 								{filterType !== "all" && (
// 									<div className="absolute top-1 right-1 w-2 h-2 bg-primary-600 rounded-full"></div>
// 								)}
// 							</button>

// 							{showCreateButton && !readOnly && (
// 								<Button
// 									onClick={handleCreateEvent}
// 									className="bg-primary-600 hover:bg-blue-700 text-white p-2 rounded-lg"
// 								>
// 									<Plus size={20} />
// 								</Button>
// 							)}
// 						</div>
// 					</div>

// 					{/* Navigation and period display */}
// 					<div className="flex items-center justify-between">
// 						<div className="flex items-center gap-2">
// 							<Button
// 								variant="outline"
// 								size="sm"
// 								onClick={goToToday}
// 								className="text-xs sm:text-sm"
// 							>
// 								Hoje
// 							</Button>
// 							<div className="flex items-center">
// 								<button
// 									onClick={previousPeriod}
// 									className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
// 								>
// 									<ChevronLeft size={20} className="text-gray-600" />
// 								</button>
// 								<button
// 									onClick={nextPeriod}
// 									className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
// 								>
// 									<ChevronRight size={20} className="text-gray-600" />
// 								</button>
// 							</div>
// 						</div>

// 						{/* Period display */}
// 						<h2 className="text-sm sm:text-base font-semibold text-gray-800">
// 							{viewMode === "week"
// 								? `${format(weekStart, "d", { locale: ptBR })} - ${format(weekEnd, "d 'de' MMMM", { locale: ptBR })}`
// 								: format(currentDate, "MMMM yyyy", { locale: ptBR })}
// 						</h2>
// 					</div>

// 					{/* Desktop filter */}
// 					<div className="hidden sm:flex items-center justify-between">
// 						<div className="flex items-center gap-2">
// 							<span className="text-sm text-gray-600">Filtrar:</span>
// 							<div className="flex items-center gap-1">
// 								{["all", "show", "rehearsal", "meeting", "personal"].map(
// 									(type) => (
// 										<button
// 											key={type}
// 											onClick={() => {
// 												setFilterType(type);
// 											}}
// 											className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
// 												filterType === type
// 													? type === "all"
// 														? "bg-gray-800 text-white"
// 														: `${eventTypeConfig[type as keyof typeof eventTypeConfig]?.color} text-white`
// 													: "bg-gray-100 text-gray-600 hover:bg-gray-200"
// 											}`}
// 										>
// 											{type === "all"
// 												? "Todos"
// 												: eventTypeConfig[type as keyof typeof eventTypeConfig]
// 														?.label}
// 										</button>
// 									)
// 								)}
// 							</div>
// 						</div>

// 						{/* Legend */}
// 						<div className="flex items-center gap-3 text-xs">
// 							{Object.entries(eventTypeConfig).map(([type, config]) => (
// 								<div key={type} className="flex items-center gap-1">
// 									<div className={`w-3 h-3 rounded-full ${config.color}`}></div>
// 									<span className="text-gray-600">{config.label}</span>
// 								</div>
// 							))}
// 						</div>
// 					</div>
// 				</div>

// 				{/* Mobile filter menu */}
// 				{showFilterMenu && (
// 					<div className="sm:hidden absolute top-16 right-3 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50">
// 						<div className="flex items-center justify-between mb-2">
// 							<span className="text-sm font-medium text-gray-700">Filtros</span>
// 							<button
// 								onClick={() => {
// 									setShowFilterMenu(false);
// 								}}
// 								className="p-1 hover:bg-gray-100 rounded"
// 							>
// 								<X size={16} className="text-gray-500" />
// 							</button>
// 						</div>
// 						<div className="space-y-1">
// 							{["all", "show", "rehearsal", "meeting", "personal"].map(
// 								(type) => (
// 									<button
// 										key={type}
// 										onClick={() => {
// 											setFilterType(type);
// 											setShowFilterMenu(false);
// 										}}
// 										className={`w-full px-3 py-2 rounded text-left text-sm transition-colors ${
// 											filterType === type
// 												? "bg-primary-50 text-primary-700 font-medium"
// 												: "hover:bg-gray-100 text-gray-700"
// 										}`}
// 									>
// 										<div className="flex items-center gap-2">
// 											{type !== "all" && (
// 												<div
// 													className={`w-3 h-3 rounded-full ${eventTypeConfig[type as keyof typeof eventTypeConfig]?.color}`}
// 												></div>
// 											)}
// 											<span>
// 												{type === "all"
// 													? "Todos"
// 													: eventTypeConfig[
// 															type as keyof typeof eventTypeConfig
// 														]?.label}
// 											</span>
// 										</div>
// 									</button>
// 								)
// 							)}
// 						</div>
// 					</div>
// 				)}
// 			</div>

// 			{/* Calendar Grid */}
// 			<div className="flex-1 bg-white border-l border-r border-gray-200 overflow-hidden">
// 				<DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
// 					{/* Week days header */}
// 					<div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
// 						<div className="p-2 sm:p-4 border-r border-gray-200"></div>
// 						{weekDays.map((day, index) => {
// 							const dayEvents = getEventsForDay(filteredEvents, day);
// 							const hasEvents = dayEvents.length > 0;

// 							return (
// 								<div
// 									key={day.toISOString()}
// 									className="p-2 sm:p-4 border-r border-gray-200 text-center relative"
// 								>
// 									<div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
// 										{weekDayNames[index]}
// 									</div>
// 									<div
// 										className={`text-sm sm:text-lg font-semibold ${
// 											isToday(day)
// 												? "text-primary-600 bg-primary-100 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mx-auto text-xs sm:text-base"
// 												: "text-gray-900"
// 										}`}
// 									>
// 										{format(day, "d")}
// 									</div>

// 									{/* "Ocupado" indicator */}
// 									{hasEvents && (
// 										<div className="absolute top-1 right-1">
// 											<div className="w-2 h-2 bg-red-500 rounded-full border border-white shadow-sm"></div>
// 										</div>
// 									)}
// 								</div>
// 							);
// 						})}
// 					</div>

// 					{/* Time grid with events */}
// 					<div
// 						className="flex-1 overflow-y-auto"
// 						style={{ maxHeight: "calc(100vh - 200px)" }}
// 					>
// 						<div className="relative">
// 							{/* Time slots grid */}
// 							{hours.map((hour) => (
// 								<div
// 									key={hour}
// 									className="grid grid-cols-8 border-b border-gray-100"
// 									style={{ height: "64px" }}
// 								>
// 									{/* Hour label */}
// 									<div className="p-2 sm:p-4 border-r border-gray-200 text-xs sm:text-sm text-gray-500 font-medium bg-gray-50 flex items-start">
// 										{String(hour).padStart(2, "0")}:00
// 									</div>

// 									{/* Day columns */}
// 									{weekDays.map((day, dayIndex) => (
// 										<DroppableTimeSlot
// 											key={`${day.toISOString()}-${hour}`}
// 											id={`slot-${dayIndex}-${hour}`}
// 											day={day}
// 											dayIndex={dayIndex}
// 											hour={hour}
// 											className="border-r border-gray-200 hover:bg-primary-50 transition-colors cursor-pointer min-h-[64px]"
// 											onClick={() => {
// 												handleTimeSlotClick(day, hour);
// 											}}
// 										/>
// 									))}
// 								</div>
// 							))}

// 							{/* Events overlay */}
// 							<div className="absolute top-0 left-0 w-full h-full pointer-events-none">
// 								{weekDays.map((day, dayIndex) => {
// 									const dayEvents = getEventsForDay(filteredEvents, day);

// 									return dayEvents.map((event) => (
// 										<div
// 											key={event.id}
// 											className="absolute pointer-events-auto"
// 											style={{
// 												left: `${100 / 8 + (100 / 8) * dayIndex + 0.5}%`,
// 												width: `${100 / 8 - 1}%`,
// 												top: `${getEventTopPosition(event)}px`,
// 												height: `${getEventHeight(event)}px`,
// 												minHeight: "32px",
// 											}}
// 										>
// 											<DraggableEvent
// 												event={event}
// 												style={{
// 													width: "100%",
// 													height: "100%",
// 												}}
// 												onClick={() => {
// 													handleEventClick(event);
// 												}}
// 											/>
// 										</div>
// 									));
// 								})}
// 							</div>
// 						</div>
// 					</div>

// 					{/* Drag Overlay */}
// 					<DragOverlay>
// 						{draggedEvent ? (
// 							<div
// 								className={`rounded-lg border-l-4 px-3 py-2 shadow-lg ${getEventTypeColor(draggedEvent.type)} opacity-80 cursor-grabbing`}
// 								style={{
// 									width: "200px",
// 									height: `${getEventHeight(draggedEvent)}px`,
// 									minHeight: "32px",
// 								}}
// 							>
// 								<div className="text-sm font-medium truncate">
// 									{draggedEvent.title}
// 								</div>
// 								{getEventHeight(draggedEvent) > 40 && (
// 									<div className="text-xs opacity-90 truncate">
// 										{draggedEvent.startTime} - {draggedEvent.endTime}
// 									</div>
// 								)}
// 							</div>
// 						) : null}
// 					</DragOverlay>
// 				</DndContext>
// 			</div>

// 			{/* Events list for small screens */}
// 			<div className="sm:hidden bg-white border-t border-gray-200 max-h-48 overflow-y-auto">
// 				{filteredEvents.length > 0 ? (
// 					<div className="p-4">
// 						<h3 className="text-sm font-semibold text-gray-800 mb-3">
// 							Eventos ({filteredEvents.length})
// 						</h3>
// 						<div className="space-y-2">
// 							{filteredEvents.map((event) => (
// 								<div
// 									key={event.id}
// 									className="bg-gray-50 rounded-lg p-3 border border-gray-200 relative"
// 									onClick={() => {
// 										handleEventClick(event);
// 									}}
// 								>
// 									<div className="flex items-center justify-between">
// 										<div className="flex-1 min-w-0">
// 											<div className="flex items-center gap-2">
// 												<h4 className="font-medium text-gray-900 text-sm truncate">
// 													{event.title}
// 												</h4>
// 												<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800 border border-red-200">
// 													Ocupado
// 												</span>
// 											</div>
// 											<div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
// 												<span className="flex items-center gap-1">
// 													<Calendar className="h-3 w-3" />
// 													{format(event.date, "dd/MM", { locale: ptBR })}
// 												</span>
// 												<span className="flex items-center gap-1">
// 													<Clock className="h-3 w-3" />
// 													{event.startTime} - {event.endTime}
// 												</span>
// 											</div>
// 										</div>
// 										<div
// 											className={`w-3 h-3 rounded-full ${eventTypeConfig[event.type]?.color || "bg-gray-400"}`}
// 										/>
// 									</div>
// 								</div>
// 							))}
// 						</div>
// 					</div>
// 				) : (
// 					<div className="p-4 text-center text-gray-500 text-sm">
// 						Nenhum evento encontrado
// 					</div>
// 				)}
// 			</div>

// 			{/* Modals */}
// 			<EventDetailsModal
// 				event={selectedEvent}
// 				isOpen={showDetailsModal}
// 				onClose={() => {
// 					setShowDetailsModal(false);
// 					setSelectedEvent(null);
// 				}}
// 				onUpdate={handleEventUpdate}
// 				onDelete={handleEventDelete}
// 				readOnly={readOnly}
// 			/>

// 			<CreateEventModal
// 				isOpen={showCreateModal}
// 				onClose={() => {
// 					setShowCreateModal(false);
// 					setCreateEventData({});
// 				}}
// 				onSubmit={handleEventCreate}
// 				initialDate={createEventData.date || currentDate}
// 				initialStartTime={createEventData.startTime}
// 				initialEndTime={createEventData.endTime}
// 			/>
// 		</div>
// 	);
// };

import type { AgendaEvent } from "../BandProfile/Agenda";

// Props interface for the unified component
export interface AgendaComponentProps {
	// Data
	events?: Array<AgendaEvent>;
	onEventsChange?: (events: Array<AgendaEvent>) => void;

	// Event handlers
	onEventCreate?: (eventData: Partial<AgendaEvent>) => void;
	onEventUpdate?: (updatedEvent: AgendaEvent) => void;
	onEventDelete?: (eventId: number) => void;
	onEventClick?: (event: AgendaEvent) => void;

	// Display options
	initialDate?: Date;
	readOnly?: boolean;
	allowDragAndDrop?: boolean;
	showCreateButton?: boolean;
	viewMode?: "week" | "month" | "form";

	// API integration
	produtoMusicalId?: number;
	enableApiSync?: boolean;

	// Simple mode (like old Agenda component)
	simpleMode?: boolean;
}

export const AgendaComponent = (props: AgendaComponentProps) => {
	console.log(props);
	return <h1>Agenda!</h1>;
};
