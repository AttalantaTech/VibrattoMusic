// Enhanced Event interface for the agenda system
export interface AgendaEvent {
	id: number | string;
	title: string;
	description?: string;
	date: Date;
	startTime: string;
	endTime: string;
	location?: string;
	type: "show" | "rehearsal" | "meeting" | "personal";
	status?: "confirmed" | "pending" | "cancelled";
}

// Event type for external use (backward compatibility)
export type Event = AgendaEvent;

// Event Types
export type EventType = AgendaEvent["type"];
export type EventStatus = AgendaEvent["status"];

// Event Type Configuration
export interface EventTypeConfig {
	label: string;
	color: string;
	lightColor: string;
	borderColor: string;
	textColor: string;
	hoverColor: string;
}

export const eventTypeConfig: Record<EventType, EventTypeConfig> = {
	show: {
		label: "Show",
		color: "bg-blue-500",
		lightColor: "bg-blue-50",
		borderColor: "border-blue-500",
		textColor: "text-blue-700",
		hoverColor: "hover:bg-blue-100",
	},
	rehearsal: {
		label: "Ensaio",
		color: "bg-emerald-500",
		lightColor: "bg-emerald-50",
		borderColor: "border-emerald-500",
		textColor: "text-emerald-700",
		hoverColor: "hover:bg-emerald-100",
	},
	meeting: {
		label: "Reunião",
		color: "bg-purple-500",
		lightColor: "bg-purple-50",
		borderColor: "border-purple-500",
		textColor: "text-purple-700",
		hoverColor: "hover:bg-purple-100",
	},
	personal: {
		label: "Pessoal",
		color: "bg-gray-500",
		lightColor: "bg-gray-50",
		borderColor: "border-gray-500",
		textColor: "text-gray-700",
		hoverColor: "hover:bg-gray-100",
	},
} as const;

export interface CreateEventModalProps {
	onClose: () => void;
	onSubmit: (event: Partial<AgendaEvent>) => void;
	initialDate?: Date;
}

export interface DraggableEventProps {
	event: AgendaEvent;
	style?: React.CSSProperties;
	onClick: () => void;
}

export interface DroppableTimeSlotProps {
	id: string;
	hour: number;
	dayIndex: number;
	day: Date;
}
export interface AgendaViewProps {
	events?: Array<AgendaEvent>;
	onEventCreate?: (event: Partial<AgendaEvent>) => void;
	onEventUpdate?: (event: AgendaEvent) => void;
	onEventDelete?: (eventId: number | string) => void;
	onEventClick?: (event: AgendaEvent) => void;
	initialDate?: Date;
	readOnly?: boolean;
	allowDragAndDrop?: boolean;
	showCreateButton?: boolean;
	filterTypes?: Array<string>;
	readonly?: boolean;
	produtoMusicalId?: number;
}

export interface CreateEventModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (event: Partial<AgendaEvent>) => void;
	initialDate?: Date;
	initialType?: AgendaEvent["type"];
	initialStartTime?: string;
	initialEndTime?: string;
}

export interface EventDetailsModalProps {
	isOpen: boolean;
	event: AgendaEvent | null;
	onClose: () => void;
	onUpdate?: (event: AgendaEvent) => void;
	onDelete?: (eventId: number | string) => void;
	readOnly?: boolean;
}

export interface DraggableEventProps {
	event: AgendaEvent;
	style?: React.CSSProperties;
	onClick: () => void;
}

export interface DroppableTimeSlotProps {
	id: string;
	hour: number;
	dayIndex: number;
	day: Date;
	className?: string;
	children?: React.ReactNode;
	onClick?: () => void;
}
