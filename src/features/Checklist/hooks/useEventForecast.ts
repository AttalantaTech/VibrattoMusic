import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { ChecklistEvent } from "../types";
import {
	cityFromPlace,
	fetchForecast,
	forecastOpensOn,
	forecastWindow,
	type Forecast,
} from "../utils/weather";

export interface EventForecast {
	/** "available": within 16 days; "later": too far ahead; "past" */
	window: "available" | "later" | "past";
	/** The day the forecast can be read, for "later" */
	opensOn: string | null;
	/** The event's place has a city to look up */
	hasCity: boolean;
	forecast: Forecast | null;
	isLoading: boolean;
	isError: boolean;
}

/** The forecast of the event's day, read once every few hours */
export const useEventForecast = (
	event: ChecklistEvent | null
): EventForecast => {
	const today = format(new Date(), "yyyy-MM-dd");
	const window = event ? forecastWindow(event.date, today) : "past";
	const hasCity = !!cityFromPlace(event?.place);
	const enabled = !!event && window === "available" && hasCity;

	const query = useQuery({
		queryKey: ["event-forecast", event?.place, event?.date],
		queryFn: () => fetchForecast(event?.place ?? "", event?.date ?? today),
		enabled,
		staleTime: 3 * 60 * 60 * 1000,
		retry: 1,
	});

	return {
		window,
		opensOn: event && window === "later" ? forecastOpensOn(event.date) : null,
		hasCity,
		forecast: enabled ? (query.data ?? null) : null,
		isLoading: enabled && query.isLoading,
		isError: enabled && query.isError,
	};
};
