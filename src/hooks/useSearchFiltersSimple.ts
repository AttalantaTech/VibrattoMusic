import { useState, useCallback } from "react";
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
	const [filters, setFilters] = useState<SearchFilters>({
		categorias: [],
		tiposEvento: [],
		generosMusicais: [],
		ordenarPorAvaliacao: false,
		pagina: 1,
		// Force initial search to show all products
		codigoMunicipio: undefined,
	});

	// Update filters
	const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
		setFilters((previousFilters) => ({ ...previousFilters, ...newFilters }));
	}, []);

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
				filters.categorias.length > 0 ||
				filters.tiposEvento.length > 0 ||
				filters.generosMusicais.length > 0
		),
		clearFilters: () => {
			setFilters({
				categorias: [],
				tiposEvento: [],
				generosMusicais: [],
				ordenarPorAvaliacao: false,
				pagina: 1,
			});
		},
	};
};
