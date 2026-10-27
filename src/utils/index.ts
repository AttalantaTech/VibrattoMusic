import { addDays, format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

const toBR = (date: Date | string) => toZonedTime(date, TIME_ZONE);

const handleCurrencyFormatting = (value: number) => {
	return new Intl.NumberFormat("pt-BR", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
};

// Helpers to format date/time to API format
const ensureHHMMSS = (timeString: string): string => {
	if (!timeString) return "";
	const parts = timeString.split(":");
	const h = parts[0]?.padStart(2, "0") || "00";
	const m = parts[1]?.padStart(2, "0") || "00";
	const s = (parts[2] ?? "00").padStart(2, "0");
	return `${h}:${m}:${s}`;
};

const combineDateTime = (dateString: string, timeString: string): string => {
	if (!dateString) return "";
	const t = ensureHHMMSS(timeString || "00:00:00");
	return `${dateString}T${t}`;
};

const timeToMinutes = (time: string) => {
	const [hours = 0, minutes = 0] = time.split(":").map(Number);

	return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes: number) => {
	const minutesInDays = 24 * 60;

	const normalizedMinutes = totalMinutes % minutesInDays;

	const hours = Math.floor(normalizedMinutes / 60);
	const minutes = normalizedMinutes % 60;

	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const timeToSeconds = (time: string): number => {
	const [hours = 0, minutes = 0, seconds = 0] = time.split(":").map(Number);

	return hours * 3600 + minutes * 60 + seconds;
};

const secondsToTime = (totalSeconds: number): string => {
	const secondsInDay = 24 * 3600;

	// Garante que valores negativos ou maiores que 24h fiquem dentro do intervalo de um dia
	const normalizedSeconds =
		((totalSeconds % secondsInDay) + secondsInDay) % secondsInDay;

	const hours = Math.floor(normalizedSeconds / 3600);
	const minutes = Math.floor((normalizedSeconds % 3600) / 60);
	const seconds = normalizedSeconds % 60;

	const pad = (number_: number) => String(number_).padStart(2, "0");

	return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const calculateDuration = (startTime: string, endTime: string) => {
	const startSeconds = timeToSeconds(startTime);
	let endSeconds = timeToSeconds(endTime);

	const isNextDay = endSeconds < startSeconds;

	if (isNextDay) {
		endSeconds += 24 * 3600;
	}

	const durationSeconds = endSeconds - startSeconds;

	return {
		durationSeconds,
		durationFormatted: secondsToTime(durationSeconds),
		isNextDay,
	};
};

const setEndDate = (startDate: string, isNextDay: boolean): string => {
	if (!startDate) return "";

	const parsedStartDate = parseISO(startDate);

	const endDate = isNextDay ? addDays(parsedStartDate, 1) : parsedStartDate;

	return format(endDate, "yyyy-MM-dd");
};

const calculateEndTime = (startTime: string, durationMinutes: number) => {
	const startMinutes = timeToMinutes(startTime);
	const endMinutes = startMinutes + durationMinutes;

	return {
		endTime: minutesToTime(endMinutes),
		isNextDay: endMinutes >= 24 * 60,
	};
};

// Quick time options
const quickTimeOptions = [
	{ label: "30 min", duration: 1800 },
	{ label: "1h", duration: 3600 },
	{ label: "1h30", duration: 5400 },
	{ label: "2h", duration: 7200 },
	{ label: "2h30", duration: 9000 },
	{ label: "3h", duration: 10800 },
	{ label: "3h30", duration: 12600 },
	{ label: "4h", duration: 14400 },
	{ label: "4h30", duration: 16200 },
	{ label: "5h", duration: 18000 },
];

export {
	TIME_ZONE,
	toBR,
	handleCurrencyFormatting,
	timeToMinutes,
	ensureHHMMSS,
	combineDateTime,
	minutesToTime,
	timeToSeconds,
	secondsToTime,
	quickTimeOptions,
	calculateDuration,
	setEndDate,
	calculateEndTime,
};
