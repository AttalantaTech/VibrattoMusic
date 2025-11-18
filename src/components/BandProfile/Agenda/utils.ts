import type { AgendaEvent } from "./types";

// Helper functions for event positioning and calculations
export const getEventHeight = (event: AgendaEvent): number => {
	const [startHour = 0, startMinute = 0] = event.startTime
		.split(":")
		.map(Number);
	const [endHour = 0, endMinute = 0] = event.endTime.split(":").map(Number);

	const startInMinutes = startHour * 60 + startMinute;
	const endInMinutes = endHour * 60 + endMinute;

	return ((endInMinutes - startInMinutes) / 60) * 80; // 80px per hour
};

export const getEventTopPosition = (event: AgendaEvent): number => {
	const [startHour = 0, startMinute = 0] = event.startTime
		.split(":")
		.map(Number);
	return (((startHour - 7) * 60 + startMinute) / 60) * 80; // 7h is grid start
};

// Time utilities
export const getCurrentTimePosition = (currentDate: Date): number | null => {
	const now = new Date();

	// Check if current time is in the same week as the displayed week
	const currentWeekStart = new Date(currentDate);
	currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay());
	const currentWeekEnd = new Date(currentWeekStart);
	currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

	if (now < currentWeekStart || now > currentWeekEnd) return null;

	const currentHour = now.getHours();
	const currentMinute = now.getMinutes();

	if (currentHour < 7 || currentHour >= 24) return null;

	return (currentHour - 7) * 80 + (currentMinute * 80) / 60;
};

// Event filtering and sorting
export const filterEventsByType = (
	events: Array<AgendaEvent>,
	filterType: string
): Array<AgendaEvent> => {
	if (filterType === "all") return events;
	return events.filter((event) => event.type === filterType);
};

export const getEventsForDay = (
	events: Array<AgendaEvent>,
	day: Date,
	filterType: string = "all"
): Array<AgendaEvent> => {
	const filteredEvents = filterEventsByType(events, filterType);
	return filteredEvents.filter((event) => {
		const eventDate = new Date(event.date);
		return eventDate.toDateString() === day.toDateString();
	});
};

// Time validation
export const validateTimeRange = (
	startTime: string,
	endTime: string
): boolean => {
	const [startHour = 0, startMinute = 0] = startTime.split(":").map(Number);
	const [endHour = 0, endMinute = 0] = endTime.split(":").map(Number);

	const startInMinutes = startHour * 60 + startMinute;
	const endInMinutes = endHour * 60 + endMinute;

	return endInMinutes > startInMinutes;
};

// Event creation helpers
export const calculateEndTime = (
	startTime: string,
	durationMinutes: number
): string => {
	const [startHour = 0, startMinute = 0] = startTime.split(":").map(Number);
	const startInMinutes = startHour * 60 + startMinute;
	const endInMinutes = startInMinutes + durationMinutes;

	const endHour = Math.floor(endInMinutes / 60);
	const endMinute = endInMinutes % 60;

	return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
};

// Date utilities
export const formatEventDate = (date: Date): string => {
	return date.toLocaleDateString("pt-BR", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
};

export const formatEventTime = (startTime: string, endTime: string): string => {
	return `${startTime} - ${endTime}`;
};

export const formatTimeToHHMM = (time: string): string => {
	// Extract hours and minutes only, ignoring seconds if present
	const [hours, minutes] = time.split(":");
	const formattedHours = (hours || "00").padStart(2, "0");
	const formattedMinutes = (minutes || "00").padStart(2, "0");
	return `${formattedHours}:${formattedMinutes}`;
};

// Drag and drop utilities
export const calculateNewEventPosition = (
	event: AgendaEvent,
	targetDay: Date,
	targetHour: number
): Partial<AgendaEvent> => {
	// Calculate duration
	const [startHour = 0, startMinute = 0] = event.startTime
		.split(":")
		.map(Number);
	const [endHour = 0, endMinute = 0] = event.endTime.split(":").map(Number);
	const durationMinutes =
		endHour * 60 + endMinute - (startHour * 60 + startMinute);

	const newStartTime = `${String(targetHour).padStart(2, "0")}:00`;
	const newEndTime = calculateEndTime(newStartTime, durationMinutes);

	return {
		date: targetDay,
		startTime: newStartTime,
		endTime: newEndTime,
	};
};
