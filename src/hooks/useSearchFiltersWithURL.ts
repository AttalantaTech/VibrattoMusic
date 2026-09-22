import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { MusicalProductSearchRequest } from "../api/types";
import type { Option } from "../components/forms/Select/Select";

interface SearchFilters {
	NomeOuDescricao?: string;
	codigoMunicipio: Option | null;
	categorias: Option | null;
	tiposEvento: Option | null;
	generosMusicais: Option | null;
	ordenarPorAvaliacao: boolean;
	pagina: number;
}

const isOptionType = (object: any): object is Option => {
	return (
		typeof object === "object" &&
		object !== null &&
		typeof object.label === "string" &&
		typeof object.value === "string"
	);
};

export const useSearchFiltersWithURL = () => {
	const navigate = useNavigate();
	const [selectedCities, setSelectedCities] = useState<Array<Option>>([]);
	const [selectedCategories, setSelectedCategories] = useState<Array<Option>>(
		[]
	);
	const [selectedGenres, setSelectedGenres] = useState<Array<Option>>([]);
	const [selectedEventTypes, setSelectedEventTypes] = useState<Array<Option>>(
		[]
	);

	const searchParameters = useSearch({ strict: false });
	// Helper function to safely get search parameter
	const getSearchParameter = useCallback(
		(key: string): unknown => {
			return (searchParameters as Record<string, unknown>)[key];
		},
		[searchParameters]
	);

	// Parse URL parameters to initial state
	const getInitialFilters = useCallback((): SearchFilters => {
		const getCity = () => {
			const city = getSearchParameter("codigoMunicipio");
			if (isOptionType(city)) {
				return city;
			}

			return null;
		};

		const getCategory = () => {
			const category = getSearchParameter("categorias");
			if (isOptionType(category)) {
				return category;
			}

			return null;
		};

		const getEventType = () => {
			const eventType = getSearchParameter("tipos");
			if (isOptionType(eventType)) {
				return eventType;
			}

			return null;
		};

		const getGenre = () => {
			const genre = getSearchParameter("generos");
			if (isOptionType(genre)) {
				return genre;
			}

			return null;
		};

		const q = getSearchParameter("q");
		const ordenar = getSearchParameter("ordenar");
		const pagina = getSearchParameter("pagina");

		return {
			NomeOuDescricao: typeof q === "string" ? q : undefined,
			codigoMunicipio: getCity(),
			categorias: getCategory(),
			tiposEvento: getEventType(),
			generosMusicais: getGenre(),
			ordenarPorAvaliacao: ordenar === "avaliacao",
			pagina: typeof pagina === "string" ? parseInt(pagina) || 1 : 1,
		};
	}, [getSearchParameter]);
	const [filters, setFilters] = useState<SearchFilters>(getInitialFilters);

	// Sync filters with URL parameters when they change
	useEffect(() => {
		const newFilters = getInitialFilters();
		setFilters(newFilters);
	}, [getInitialFilters]);

	useEffect(() => {
		setSelectedCities(filters.codigoMunicipio ? [filters.codigoMunicipio] : []);
		setSelectedCategories(filters.categorias ? [filters.categorias] : []);
		setSelectedGenres(filters.generosMusicais ? [filters.generosMusicais] : []);
		setSelectedEventTypes(filters.tiposEvento ? [filters.tiposEvento] : []);
	}, [filters]);

	// Update URL when filters change
	const updateURL = useCallback(
		(newFilters: SearchFilters) => {
			const urlSearchParameters: Record<string, string | Array<string>> = {};

			if (newFilters.NomeOuDescricao?.trim()) {
				urlSearchParameters["q"] = newFilters.NomeOuDescricao.trim();
			}

			if (newFilters.codigoMunicipio) {
				urlSearchParameters["codigoMunicipio"] =
					newFilters.codigoMunicipio.value;
			}

			if (newFilters.categorias) {
				urlSearchParameters["categorias"] = newFilters.categorias
					? [...newFilters.categorias.value]
					: [];
			}

			if (newFilters.tiposEvento) {
				urlSearchParameters["tipos"] = newFilters.tiposEvento
					? [...newFilters.tiposEvento.value]
					: [];
			}

			if (newFilters.generosMusicais) {
				urlSearchParameters["generos"] = newFilters.generosMusicais
					? [...newFilters.generosMusicais.value]
					: [];
			}

			if (newFilters.ordenarPorAvaliacao) {
				urlSearchParameters["ordenar"] = "avaliacao";
			}

			if (newFilters.pagina > 1) {
				urlSearchParameters["pagina"] = newFilters.pagina.toString();
			}
			void navigate({
				search: {
					...(newFilters.codigoMunicipio && {
						codigoMunicipio: newFilters.codigoMunicipio,
					}),
					...(newFilters.categorias && { categorias: newFilters.categorias }),
					...(newFilters.tiposEvento && { tipos: newFilters.tiposEvento }),
					...(newFilters.generosMusicais && {
						generos: newFilters.generosMusicais,
					}),
					...(newFilters.NomeOuDescricao && { q: newFilters.NomeOuDescricao }),
				} as any,
			});
		},
		[navigate]
	);

	// Update filters and URL
	const updateFilters = useCallback(
		(newFilters: Partial<SearchFilters>) => {
			setFilters((previous) => {
				const updatedFilters = { ...previous, ...newFilters };
				updateURL(updatedFilters);
				return updatedFilters;
			});
		},
		[updateURL]
	);

	// Convert to API request format
	const toSearchRequest = useCallback((): MusicalProductSearchRequest => {
		return {
			limite: 12,
			tamanhoPagina: 12,
			pagina: filters.pagina,
			ordenarPorAvaliacao: filters.ordenarPorAvaliacao,
			NomeOuDescricao: filters.NomeOuDescricao,
			codigoMunicipio: filters.codigoMunicipio
				? parseInt(filters.codigoMunicipio?.value)
				: undefined,
			categorias: filters.categorias
				? [parseInt(filters.categorias.value)]
				: undefined,
			tiposEvento: filters.tiposEvento
				? [parseInt(filters.tiposEvento.value)]
				: undefined,
			generosMusicais: filters.generosMusicais
				? [parseInt(filters.generosMusicais.value)]
				: undefined,
		};
	}, [filters]);

	return {
		filters,
		updateFilters,
		toSearchRequest,
		hasActiveFilters: Boolean(
			filters.NomeOuDescricao ||
			filters.codigoMunicipio ||
			filters.categorias ||
			filters.tiposEvento ||
			filters.generosMusicais
		),

		selectedCities,
		selectedCategories,
		selectedGenres,
		selectedEventTypes,
		setSelectedCities,
		setSelectedCategories,
		setSelectedGenres,
		setSelectedEventTypes,

		clearFilters: () => {
			const clearedFilters: SearchFilters = {
				codigoMunicipio: null,
				categorias: null,
				tiposEvento: null,
				generosMusicais: null,
				ordenarPorAvaliacao: false,
				pagina: 1,
			};
			setFilters(clearedFilters);
			updateURL(clearedFilters);

			setSelectedCities([]);
			setSelectedCategories([]);
			setSelectedGenres([]);
			setSelectedEventTypes([]);
		},
	};
};
