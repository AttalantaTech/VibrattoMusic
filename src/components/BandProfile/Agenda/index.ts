// Main exports for the Agenda component module
export { AgendaTab } from "./AgendaTab";

// Type exports
export type {
	AgendaEvent,
	Event,
	EventType,
	EventStatus,
	EventTypeConfig,
	AgendaViewProps,
	EventDetailsModalProps,
	DraggableEventProps,
	DroppableTimeSlotProps,
} from "./types";

// Re-export eventTypeConfig from types
export { eventTypeConfig } from "./types";
