import { useQuery } from "@tanstack/react-query";
import { filterService } from "../api";
import type { FilterType } from "../api/types";

// Query Keys
export const filterKeys = {
	all: ["filters"] as const,
	byType: (type: FilterType) => [...filterKeys.all, type] as const,
};

/**
 * Hook to get filter options by type
 */
export const useFilterOptions = (
	filterType: FilterType,
	enabled: boolean = true
) => {
	return useQuery({
		queryKey: filterKeys.byType(filterType),
		queryFn: () => filterService.getFilterOptions(filterType),
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
export const useCidades = (enabled: boolean = true) => {
	return useFilterOptions("Cidade", enabled);
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
	return useFilterOptions("TipoInstrumento", enabled);
};

/**
 * Hook to get proposal rejection reasons
 */
export const useMotivosRejeicaoProposta = (enabled: boolean = true) => {
	return useFilterOptions("MotivoRejeicaoProposta", enabled);
};
