import { useEffect, useState } from "react";
import type { Option } from "@/components/forms/Select/Select";
import type { FilterOption } from "@/api/types";
import { toBR } from "@/utils";
import { filterService } from "@/api";
import { toast } from "sonner";

export const useCheckAvailabilityState = () => {
	const [hasDefineEventTime, setHasDefineEventTime] = useState(false);
	const [loadingEventTypes, setLoadingEventTypes] = useState(true);
	const [eventTypes, setEventTypes] = useState<Array<FilterOption>>([]);
	const [selectedEventTypes, setSelectedEventTypes] = useState<Array<Option>>(
		[]
	);
	const [currentMonth, setCurrentMonth] = useState(toBR(new Date()));
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);

	useEffect(() => {
		const loadFilters = async () => {
			try {
				setLoadingEventTypes(true);

				const [eventTypesResponse] = await Promise.all([
					filterService.getTiposEvento(),
				]);

				setEventTypes(eventTypesResponse ?? []);
			} catch (loadError) {
				console.error("Failed to load filters:", loadError);
				// TODO: Replace with proper toast system
				toast.error("Erro ao tentar carregar os tipos de eventos disponíveis");
			} finally {
				setLoadingEventTypes(false);
			}
		};

		void loadFilters();
	}, []);

	return {
		loadingEventTypes,
		setLoadingEventTypes,
		eventTypes,
		setEventTypes,
		selectedEventTypes,
		setSelectedEventTypes,
		currentMonth,
		setCurrentMonth,
		selectedDate,
		setSelectedDate,
		hasDefineEventTime,
		setHasDefineEventTime,
	};
};
