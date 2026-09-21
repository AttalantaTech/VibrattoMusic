import type { FilterOption } from "@/api/types";
import type { SetStateAction, Dispatch } from "react";
import { useState, useEffect } from "react";
import { mapFilterOptions } from "../utils/filterOptionMapper";
import {
	useCategorias,
	useCidades,
	useGenerosMusicais,
	useTiposEvento,
} from "@/hooks/useFilters";

interface UseDetailsFiltersProps {
	cityPage?: number;
	setCityPage?: Dispatch<SetStateAction<number>>;
	hasMoreCities?: boolean;
	setHasMoreCities?: (value: boolean) => void;
	cityPageSize?: number;
	searchCityByName?: string;
}

export function useFilterLookup({
	cityPage,
	setCityPage,
	setHasMoreCities,
	cityPageSize = 20,
	searchCityByName,
}: UseDetailsFiltersProps) {
	const [cities, setCities] = useState<Array<FilterOption>>([]);

	const {
		data: citiesData,
		isLoading: isLoadingCities,
		isFetching: isFetchingCities,
	} = useCidades({
		paginationFilter: {
			pagina: cityPage,
			tamanhoPagina: cityPageSize,
			nome: searchCityByName,
		},
	});

	const { data: categories = [], isLoading: isLoadingCategories } =
		useCategorias();
	const { data: eventTypes = [], isLoading: isLoadingEventTypes } =
		useTiposEvento();
	const { data: musicalGenres = [], isLoading: isLoadingGenresMusical } =
		useGenerosMusicais();

	useEffect(() => {
		if (!citiesData) return;

		if (cityPage === 1) {
			setCities(citiesData);
			return;
		}

		setCities((previous) => {
			const existingIds = new Set(previous.map((city) => city.Id));

			const uniqueCities = citiesData.filter(
				(city) => !existingIds.has(city.Id)
			);

			return [...previous, ...uniqueCities];
		});

		if (citiesData.length < cityPageSize) {
			setHasMoreCities?.(false);
		}
	}, [citiesData, cityPage, cityPageSize, setCityPage, setHasMoreCities]);

	useEffect(() => {
		setCityPage?.(1);
		setHasMoreCities?.(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchCityByName]);

	return {
		categories,
		cities,
		eventTypes,
		musicalGenres,
		cityOptions: mapFilterOptions(cities),
		categoryOptions: mapFilterOptions(categories),
		eventTypeOptions: mapFilterOptions(eventTypes),
		musicalGenreOptions: mapFilterOptions(musicalGenres),
		isLoadingCities,
		isLoadingCategories,
		isLoadingEventTypes,
		isLoadingGenresMusical,
		isFetchingCities,
	};
}
