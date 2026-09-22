import { useState, useCallback, useEffect } from "react";
import { useSearch } from "@tanstack/react-router";
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
			const categorias = getSearchParameter("categorias");
			if (isOptionType(categorias)) {
				return categorias;
			}

			return null;
		};

		const getEventType = () => {
			const tipos = getSearchParameter("tipos");
			if (isOptionType(tipos)) {
				return tipos;
			}

			return null;
		};

		const getGenre = () => {
			const generos = getSearchParameter("generos");
			if (isOptionType(generos)) {
				return generos;
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
	const updateURL = useCallback((newFilters: SearchFilters) => {
		const urlSearchParameters: Record<string, string | Array<string>> = {};

		if (newFilters.NomeOuDescricao?.trim()) {
			urlSearchParameters["q"] = newFilters.NomeOuDescricao.trim();
		}

		if (newFilters.codigoMunicipio) {
			urlSearchParameters["codigoMunicipio"] = newFilters.codigoMunicipio.value;
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
		// void navigate({
		// 	search: urlSearchParameters as any,
		// });
	}, []);

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

	// Helper functions to convert arrays to/from Option format
	const arrayToOptions = useCallback(
		(
			ids: Array<number>,
			allOptions: Array<{ Id: number; Nome: string }>
		): Array<Option> => {
			return ids
				.map((id) => {
					const option = allOptions.find((opt) => opt.Id === id);
					return option ? { value: id.toString(), label: option.Nome } : null;
				})
				.filter((option): option is Option => option !== null);
		},
		[]
	);

	const optionsToArray = useCallback(
		(options: Array<Option>): Array<number> => {
			return options
				.map((opt) => parseInt(opt.value))
				.filter((id) => !isNaN(id));
		},
		[]
	);

	return {
		filters,
		updateFilters,
		toSearchRequest,
		arrayToOptions,
		optionsToArray,
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
