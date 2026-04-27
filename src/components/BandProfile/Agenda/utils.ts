/* eslint-disable unicorn/prevent-abbreviations */
import type { AgendaEvent } from "./types";

// Helper functions for event positioning and calculations
export const getEventHeight = (event: AgendaEvent): number => {
	const [startHour = 0, startMinute = 0] = event.startTime
		? event.startTime.split(":").map(Number)
		: "".split(":").map(Number);
	const [endHour = 0, endMinute = 0] = event.endTime
		? event.endTime.split(":").map(Number)
		: "".split(":").map(Number);

	const startInMinutes = startHour * 60 + startMinute;
	const endInMinutes = endHour * 60 + endMinute;

	return ((endInMinutes - startInMinutes) / 60) * 80; // 80px per hour
};

export const getEventTopPosition = (event: AgendaEvent): number => {
	const [startHour = 0, startMinute = 0] = event.startTime
		? event.startTime.split(":").map(Number)
		: "".split(":").map(Number);

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
	return events.filter(() => "show" === filterType);
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

export const parseTimeToMinutes = (time: string) => {
	const [h = 0, m = 0, s = 0] = time.split(":").map(Number);
	return h * 60 + m + s / 60;
};

export const didPassMidnight = (
	startTime: string,
	endTime: string
): boolean => {
	const toMinutes = (time: string): number => {
		const [h = 0, m = 0] = time.split(":").map(Number);

		return h * 60 + m;
	};

	return toMinutes(endTime) < toMinutes(startTime);
};

// Event creation helpers
export const calculateEndTime = (
	startTime: string | null,
	duration: string | null
): string | null => {
	if (!startTime || !duration) return null;

	const [startHour = 0, startMinute = 0] = startTime.split(":").map(Number);
	const [durationHour = 0, durationMinute = 0] = duration
		.split(":")
		.map(Number);

	const startTotalMinutes = startHour * 60 + startMinute;
	const durationTotalMinutes = durationHour * 60 + durationMinute;

	const endTotalMinutes = startTotalMinutes + durationTotalMinutes;

	const normalizedMinutes = endTotalMinutes % (24 * 60);

	const hours = Math.floor(normalizedMinutes / 60)
		.toString()
		.padStart(2, "0");

	const minutes = Math.floor(normalizedMinutes % 60)
		.toString()
		.padStart(2, "0");

	return `${hours}:${minutes}:00`;
};

export const calculateDuration = (
	startTime: string | null,
	endTime: string | null
): string | null => {
	if (!startTime || !endTime) return null;

	const startTotalMinutes = parseTimeToMinutes(startTime);
	const endTotalMinutes = parseTimeToMinutes(endTime);

	let diff = endTotalMinutes - startTotalMinutes;

	if (diff < 0) {
		diff += 24 * 60;
	}

	const hours = Math.floor(diff / 60)
		.toString()
		.padStart(2, "0");
	const minutes = Math.floor(diff % 60)
		.toString()
		.padStart(2, "0");

	return `${hours}:${minutes}:00`;
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

	const newStartTime = `${String(targetHour).padStart(2, "0")}:00`;
	const newEndTime = calculateEndTime(newStartTime, event.endTime);

	return {
		date: targetDay,
		startTime: newStartTime,
		endTime: newEndTime,
	};
};
