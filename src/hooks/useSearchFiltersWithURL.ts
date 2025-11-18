import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { MusicalProductSearchRequest } from "../api/types";
import type { Option } from "../components/forms/Select/Select";

interface SearchFilters {
	NomeOuDescricao?: string;
	codigoMunicipio?: number;
	categorias: Array<number>;
	tiposEvento: Array<number>;
	generosMusicais: Array<number>;
	ordenarPorAvaliacao: boolean;
	pagina: number;
}

export const useSearchFiltersWithURL = () => {
	const navigate = useNavigate();
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
		const getCategorias = () => {
			const categorias = getSearchParameter("categorias");
			if (Array.isArray(categorias)) {
				return categorias
					.map((c) => parseInt(c as string))
					.filter((c) => !isNaN(c));
			}
			if (typeof categorias === "string") {
				return [parseInt(categorias)].filter((c) => !isNaN(c));
			}
			return [];
		};

		const getTiposEvento = () => {
			const tipos = getSearchParameter("tipos");
			if (Array.isArray(tipos)) {
				return tipos.map((t) => parseInt(t as string)).filter((t) => !isNaN(t));
			}
			if (typeof tipos === "string") {
				return [parseInt(tipos)].filter((t) => !isNaN(t));
			}
			return [];
		};

		const getGeneros = () => {
			const generos = getSearchParameter("generos");
			if (Array.isArray(generos)) {
				return generos
					.map((g) => parseInt(g as string))
					.filter((g) => !isNaN(g));
			}
			if (typeof generos === "string") {
				return [parseInt(generos)].filter((g) => !isNaN(g));
			}
			return [];
		};

		const q = getSearchParameter("q");
		const cidade = getSearchParameter("cidade");
		const ordenar = getSearchParameter("ordenar");
		const pagina = getSearchParameter("pagina");

		return {
			NomeOuDescricao: typeof q === "string" ? q : undefined,
			codigoMunicipio:
				typeof cidade === "string" ? parseInt(cidade) : undefined,
			categorias: getCategorias(),
			tiposEvento: getTiposEvento(),
			generosMusicais: getGeneros(),
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

	// Update URL when filters change
	const updateURL = useCallback(
		(newFilters: SearchFilters) => {
			const urlSearchParameters: Record<string, string | Array<string>> = {};

			if (newFilters.NomeOuDescricao?.trim()) {
				urlSearchParameters["q"] = newFilters.NomeOuDescricao.trim();
			}

			if (newFilters.codigoMunicipio) {
				urlSearchParameters["cidade"] = newFilters.codigoMunicipio.toString();
			}

			if (newFilters.categorias.length > 0) {
				urlSearchParameters["categorias"] = newFilters.categorias.map((cat) =>
					cat.toString()
				);
			}

			if (newFilters.tiposEvento.length > 0) {
				urlSearchParameters["tipos"] = newFilters.tiposEvento.map((tipo) =>
					tipo.toString()
				);
			}

			if (newFilters.generosMusicais.length > 0) {
				urlSearchParameters["generos"] = newFilters.generosMusicais.map(
					(genero) => genero.toString()
				);
			}

			if (newFilters.ordenarPorAvaliacao) {
				urlSearchParameters["ordenar"] = "avaliacao";
			}

			if (newFilters.pagina > 1) {
				urlSearchParameters["pagina"] = newFilters.pagina.toString();
			}
			void navigate({
				search: urlSearchParameters as any,
			});
		},
		[navigate]
	);

	// Update filters and URL
	const updateFilters = useCallback(
		(newFilters: Partial<SearchFilters>) => {
			const updatedFilters = { ...filters, ...newFilters };
			setFilters(updatedFilters);
			updateURL(updatedFilters);
		},
		[filters, updateURL]
	);

	// Convert to API request format
	const toSearchRequest = useCallback((): MusicalProductSearchRequest => {
		return {
			limite: 12,
			tamanhoPagina: 12,
			pagina: filters.pagina,
			ordenarPorAvaliacao: filters.ordenarPorAvaliacao,
			NomeOuDescricao: filters.NomeOuDescricao,
			codigoMunicipio: filters.codigoMunicipio,
			categorias:
				filters.categorias.length > 0 ? filters.categorias : undefined,
			tiposEvento:
				filters.tiposEvento.length > 0 ? filters.tiposEvento : undefined,
			generosMusicais:
				filters.generosMusicais.length > 0
					? filters.generosMusicais
					: undefined,
		};
	}, [filters]);

	// Helper functions to convert arrays to/from Option format
	const arrayToOptions = useCallback(
		(
			ids: Array<number>,
			allOptions: Array<{ Id: string; Nome: string }>
		): Array<Option> => {
			return ids
				.map((id) => {
					const option = allOptions.find((opt) => parseInt(opt.Id) === id);
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
				filters.categorias.length > 0 ||
				filters.tiposEvento.length > 0 ||
				filters.generosMusicais.length > 0
		),
		clearFilters: () => {
			const clearedFilters: SearchFilters = {
				categorias: [],
				tiposEvento: [],
				generosMusicais: [],
				ordenarPorAvaliacao: false,
				pagina: 1,
			};
			setFilters(clearedFilters);
			updateURL(clearedFilters);
		},
	};
};
