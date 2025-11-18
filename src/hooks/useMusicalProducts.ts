import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { musicalProductService } from "../api";
import type {
	MusicalProductSearchRequest,
	MusicalProductListApiResponse,
	OnboardingContact,
	OnboardingDetails,
	OnboardingMedia,
	OnboardingImages,
	OnboardingTechnicalConfig,
	OnboardingSchedule,
} from "../api/types";

// Query Keys
export const musicalProductKeys = {
	all: ["musicalProducts"] as const,
	lists: () => [...musicalProductKeys.all, "list"] as const,
	list: (filters: MusicalProductSearchRequest) =>
		[...musicalProductKeys.lists(), filters] as const,
	detail: (id: number) => [...musicalProductKeys.all, "detail", id] as const,
	onboarding: (id: number) =>
		[...musicalProductKeys.all, "onboarding", id] as const,
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
 * Hook to get onboarding data
 */
export const useOnboardingData = (
	productId: number,
	enabled: boolean = true
) => {
	return useQuery({
		queryKey: musicalProductKeys.onboarding(productId),
		queryFn: () => musicalProductService.getOnboardingData(productId),
		enabled: enabled && productId > 0,
		staleTime: 5 * 60 * 1000,
	});
};

/**
 * Hook to save onboarding contact (Step 1)
 */
export const useSaveOnboardingContact = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (contactData: OnboardingContact) =>
			musicalProductService.saveOnboardingContact(contactData),
		onSuccess: (data) => {
			// Invalidate onboarding queries
			void queryClient.invalidateQueries({
				queryKey: musicalProductKeys.onboarding(data.id),
			});
		},
	});
};

/**
 * Hook to save onboarding details (Step 2)
 */
export const useSaveOnboardingDetails = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			productId,
			detailsData,
		}: {
			productId: number;
			detailsData: OnboardingDetails;
		}) => musicalProductService.saveOnboardingDetails(productId, detailsData),
		onSuccess: (_, variables) => {
			// Invalidate onboarding queries
			void queryClient.invalidateQueries({
				queryKey: musicalProductKeys.onboarding(variables.productId),
			});
		},
	});
};

/**
 * Hook to save onboarding media (Step 3)
 */
export const useSaveOnboardingMedia = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			productId,
			mediaData,
		}: {
			productId: number;
			mediaData: OnboardingMedia;
		}) => musicalProductService.saveOnboardingMedia(productId, mediaData),
		onSuccess: (_, variables) => {
			// Invalidate onboarding queries
			void queryClient.invalidateQueries({
				queryKey: musicalProductKeys.onboarding(variables.productId),
			});
		},
	});
};

/**
 * Hook to save onboarding images (Step 3)
 */
export const useSaveOnboardingImages = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			productId,
			imagesData,
		}: {
			productId: number;
			imagesData: OnboardingImages;
		}) => musicalProductService.saveOnboardingImages(productId, imagesData),
		onSuccess: (_, variables) => {
			// Invalidate onboarding queries
			void queryClient.invalidateQueries({
				queryKey: musicalProductKeys.onboarding(variables.productId),
			});
		},
	});
};

/**
 * Hook to save onboarding technical configuration (Step 4)
 */
export const useSaveOnboardingTechnicalConfig = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			productId,
			technicalData,
		}: {
			productId: number;
			technicalData: OnboardingTechnicalConfig;
		}) =>
			musicalProductService.saveOnboardingTechnicalConfig(
				productId,
				technicalData
			),
		onSuccess: (_, variables) => {
			// Invalidate onboarding queries
			void queryClient.invalidateQueries({
				queryKey: musicalProductKeys.onboarding(variables.productId),
			});
		},
	});
};

/**
 * Hook to save onboarding schedule (Step 5)
 */
export const useSaveOnboardingSchedule = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			productId,
			scheduleData,
		}: {
			productId: number;
			scheduleData: OnboardingSchedule;
		}) => musicalProductService.saveOnboardingSchedule(productId, scheduleData),
		onSuccess: (_, variables) => {
			// Invalidate onboarding queries
			void queryClient.invalidateQueries({
				queryKey: musicalProductKeys.onboarding(variables.productId),
			});
		},
	});
};

/**
 * Hook to publish musical product after completing onboarding
 */
export const usePublishMusicalProduct = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (productId: number) =>
			musicalProductService.publishMusicalProduct(productId),
		onSuccess: (_, productId) => {
			// Invalidate related queries
			void queryClient.invalidateQueries({
				queryKey: musicalProductKeys.onboarding(productId),
			});
			void queryClient.invalidateQueries({
				queryKey: musicalProductKeys.all,
			});
		},
	});
};
