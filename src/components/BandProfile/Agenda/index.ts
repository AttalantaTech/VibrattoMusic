// Main exports for the Agenda component module
export { AgendaView } from "./AgendaView";
export { AgendaTab } from "./AgendaTab";
export { DraggableEvent } from "./DraggableEvent";
export { DroppableTimeSlot } from "./DroppableTimeSlot";
export { CreateEventModal } from "./CreateEventModal";
export { EventDetailsModal } from "./EventDetailsModal";

// Type exports
export type {
	AgendaEvent,
	Event,
	EventType,
	EventStatus,
	EventTypeConfig,
	AgendaViewProps,
	CreateEventModalProps,
	EventDetailsModalProps,
	DraggableEventProps,
	DroppableTimeSlotProps,
} from "./types";

// Re-export eventTypeConfig from types
export { eventTypeConfig } from "./types";

// Constants exports
export {
	mockEvents,
	CALENDAR_CONSTANTS,
	DEFAULT_EVENT_VALUES,
	statusConfig,
} from "./constants";
