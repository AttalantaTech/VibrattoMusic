import { useQuery } from "@tanstack/react-query";
import { filterService } from "../api";
import type { FilterType, PaginationFilter } from "../api/types";

// Query Keys
export const filterKeys = {
	all: ["filters"] as const,
	byType: (type: FilterType, search?: string, page?: number) =>
		[...filterKeys.all, type, search, page] as const,
};

/**
 * Hook to get filter options by type
 */
export const useFilterOptions = (
	filterType: FilterType,
	enabled: boolean = true,
	paginationFilter?: PaginationFilter
) => {
	return useQuery({
		queryKey: filterKeys.byType(
			filterType,
			paginationFilter?.nome,
			paginationFilter?.pagina
		),
		queryFn: () => {
			const params = paginationFilter
				? { filterType, paginationFilter }
				: { filterType };

			return filterService.getFilterOptions(params);
		},
		enabled,
		staleTime: 0,
	});
};

/**
 * Hook to get filter options by type
 */
export const useFilterOptionsInstruments = (
	filterType: FilterType,
	enabled: boolean = true
) => {
	return useQuery({
		queryKey: filterKeys.byType(filterType),
		queryFn: () => filterService.getFilterOptionsInstruments(filterType),
		enabled,
		staleTime: 10 * 60 * 1000, // 10 minutes - filters don't change often
	});
};

/**
 * Hook to get filter options by type
 */
export const useFilterHomeImages = (
	filterType: FilterType,
	enabled: boolean = true
) => {
	return useQuery({
		queryKey: filterKeys.byType(filterType),
		queryFn: () => filterService.getFilterHomeImages(filterType),
		enabled,
		staleTime: 10 * 60 * 1000, // 10 minutes - filters don't change often
	});
};

/**
 * Hook to get categories
 */
export const useCategorias = (enabled: boolean = true) => {
	return useFilterOptions("Categoria", enabled);
};

/**
 * Hook to get cities
 */
export const useCidades = ({
	enabled = true,
	paginationFilter,
}: {
	enabled?: boolean;
	paginationFilter?: PaginationFilter;
}) => {
	return useFilterOptions("Cidade", enabled, paginationFilter);
};

/**
 * Hook to get event types
 */
export const useTiposEvento = (enabled: boolean = true) => {
	return useFilterOptions("TipoEvento", enabled);
};

/**
 * Hook to get musical genres
 */
export const useGenerosMusicais = (enabled: boolean = true) => {
	return useFilterOptions("GeneroMusical", enabled);
};

/**
 * Hook to get instrument types
 */
export const useInstrumentos = (enabled: boolean = true) => {
	return useFilterOptionsInstruments("TipoInstrumento", enabled);
};

/**
 * Hook to get proposal rejection reasons
 */
export const useMotivosRejeicaoProposta = (enabled: boolean = true) => {
	return useFilterOptions("MotivoRejeicaoProposta", enabled);
};

/**
 * Hook to get proposal rejection reasons
 */
export const useSocialNetworks = (enabled: boolean = true) => {
	return useFilterOptions("RedeSocial", enabled);
};

/**
 * Hook to get images to home
 */
export const useHomePageImages = (enabled: boolean = true) => {
	return useFilterHomeImages("HomePageImagens", enabled);
};
