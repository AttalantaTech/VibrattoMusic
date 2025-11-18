import type { AgendaEvent } from "./types";

// Mock events for development and testing
export const mockEvents: Array<AgendaEvent> = [
	{
		id: 1,
		title: "Show no Casamento Silva",
		description: "Apresentação musical para cerimônia",
		date: new Date(2025, 0, 21),
		startTime: "19:00",
		endTime: "23:00",
		location: "Buffet Villa Rosa",
		type: "show",
		status: "confirmed",
	},
	{
		id: 2,
		title: "Ensaio Geral",
		description: "Preparação para o show",
		date: new Date(2025, 0, 20),
		startTime: "15:00",
		endTime: "18:00",
		location: "Estúdio de Ensaio",
		type: "rehearsal",
		status: "confirmed",
	},
	{
		id: 3,
		title: "Reunião com Cliente",
		description: "Definir repertório",
		date: new Date(2025, 0, 19),
		startTime: "14:00",
		endTime: "15:30",
		location: "Escritório Central",
		type: "meeting",
		status: "pending",
	},
	{
		id: 4,
		title: "Show Corporativo",
		description: "Evento de fim de ano da empresa",
		date: new Date(2025, 0, 22),
		startTime: "20:00",
		endTime: "23:30",
		location: "Hotel Nacional",
		type: "show",
		status: "confirmed",
	},
	{
		id: 5,
		title: "Ensaio das Músicas Novas",
		description: "Treinar repertório novo",
		date: new Date(2025, 0, 18),
		startTime: "16:00",
		endTime: "19:00",
		location: "Estúdio Musical",
		type: "rehearsal",
		status: "pending",
	},
];

// Calendar configuration constants
export const CALENDAR_CONSTANTS = {
	HOURS_START: 7,
	HOURS_END: 24,
	HOUR_HEIGHT: 80, // pixels
	WEEK_DAYS: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
	WEEK_DAYS_FULL: [
		"Domingo",
		"Segunda",
		"Terça",
		"Quarta",
		"Quinta",
		"Sexta",
		"Sábado",
	],
} as const;

// Default values for forms
export const DEFAULT_EVENT_VALUES = {
	startTime: "09:00",
	endTime: "10:00",
	type: "personal" as const,
	status: "pending" as const,
	duration: 60, // minutes
} as const;

// Status configuration
export const statusConfig = {
	confirmed: {
		label: "Confirmado",
		color: "bg-green-100 text-green-700",
		icon: "check-circle",
	},
	pending: {
		label: "Pendente",
		color: "bg-yellow-100 text-yellow-700",
		icon: "clock",
	},
	cancelled: {
		label: "Cancelado",
		color: "bg-red-100 text-red-700",
		icon: "x-circle",
	},
} as const;
