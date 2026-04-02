import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { musicalProductService } from "../api";
import type {
	MusicalProductSearchRequest,
	MusicalProductListApiResponse,
} from "../api/types";
import { useAuthStore } from "@/store/authStore";

// Query Keys
export const musicalProductKeys = {
	all: ["musicalProducts"] as const,
	lists: () => [...musicalProductKeys.all, "list"] as const,
	list: (filters: MusicalProductSearchRequest) =>
		[...musicalProductKeys.lists(), filters] as const,
	detail: (id: number) => [...musicalProductKeys.all, "detail", id] as const,
	updateActiveProfile: (userId?: number) =>
		[...musicalProductKeys.all, "updateActiveProfile", userId] as const,
};

/**
 * Hook to search musical products
 */
export const useSearchMusicalProducts = (
	searchRequest: MusicalProductSearchRequest,
	enabled: boolean = true
) => {
	return useQuery<MusicalProductListApiResponse, Error>({
		queryKey: musicalProductKeys.list(searchRequest),
		queryFn: async () => {
			const result = await musicalProductService.searchProducts(searchRequest);
			return result;
		},
		enabled,
		staleTime: 2 * 60 * 1000, // 2 minutes
	});
};

/**
 * Hook to fetch musical products with default parameters
 * This is the main hook for general musical product fetching
 */
export const useMusicalProducts = (
	filters: Partial<MusicalProductSearchRequest> = {},
	enabled: boolean = true
) => {
	const defaultRequest: MusicalProductSearchRequest = {
		limite: filters.limite || 20,
		ordenarPorAvaliacao: filters.ordenarPorAvaliacao || false,
		tamanhoPagina: filters.tamanhoPagina || 20,
		pagina: filters.pagina || 1,
		...filters,
	};

	return useSearchMusicalProducts(defaultRequest, enabled);
};

/**
 * Hook to fetch a single musical product by ID (public data)
 */
export const useMusicalProduct = (
	productId: number,
	enabled: boolean = true
) => {
	return useQuery({
		queryKey: musicalProductKeys.detail(productId),
		queryFn: () => musicalProductService.getProductById(productId),
		enabled: enabled && productId > 0,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};

/**
 * Hook to update musical product
 */
export const useUpdateMusicalProduct = () => {
	const { user } = useAuthStore();

	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (musicalProduct: { [key: string]: unknown }) =>
			musicalProductService.updateMusicalProduct(musicalProduct),
		onSuccess: () => {
			// Invalidate related queries
			void queryClient.invalidateQueries({
				queryKey: musicalProductKeys.updateActiveProfile(user?.id),
			});
		},
	});
};
