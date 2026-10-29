import {
	addDays,
	differenceInCalendarDays,
	format,
	startOfDay,
} from "date-fns";
import { toBR } from "@/utils";

// The acceptance and down payment deadlines are typed in days counted from
// today, the day the proposal is sent
const today = () => startOfDay(toBR(new Date()));

const deadline = (days: number) => addDays(today(), days);

/** "yyyy-MM-dd", the format the API expects */
export const deadlineDate = (days: number) =>
	format(deadline(days), "yyyy-MM-dd");

/** "dd/MM/yyyy", shown under the field */
export const deadlineLabel = (days: number) =>
	format(deadline(days), "dd/MM/yyyy");

/** The deadline can't fall after the event; dataEvento is "yyyy-MM-dd" */
export const isDeadlineAfterEvent = (days: number, dataEvento: string) =>
	Boolean(dataEvento) && deadlineDate(days) > dataEvento.slice(0, 10);

/** Turns a saved deadline back into days from today, to fill the form */
export const deadlineDays = (
	date: string | null | undefined,
	fallback: number
) =>
	date
		? Math.max(1, differenceInCalendarDays(startOfDay(toBR(date)), today()))
		: fallback;
