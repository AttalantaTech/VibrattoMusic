import { toZonedTime } from "date-fns-tz";

export const TIME_ZONE = "America/Sao_Paulo";

export const toBR = (date: Date) => toZonedTime(date, TIME_ZONE);

export const handleCurrencyFormatting = (value: number) => {
	return new Intl.NumberFormat("pt-BR", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
};

// Helpers to format date/time to API format
export const ensureHHMMSS = (timeString: string): string => {
	if (!timeString) return "";
	const parts = timeString.split(":");
	const h = parts[0]?.padStart(2, "0") || "00";
	const m = parts[1]?.padStart(2, "0") || "00";
	const s = (parts[2] ?? "00").padStart(2, "0");
	return `${h}:${m}:${s}`;
};

export const combineDateTime = (
	dateString: string,
	timeString: string
): string => {
	if (!dateString) return "";
	const t = ensureHHMMSS(timeString || "00:00:00");
	return `${dateString}T${t}`;
};
