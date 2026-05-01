import { toZonedTime } from "date-fns-tz";

export const TIME_ZONE = "America/Sao_Paulo";

export const toBR = (date: Date) => toZonedTime(date, TIME_ZONE);
