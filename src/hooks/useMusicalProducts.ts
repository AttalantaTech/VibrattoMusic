import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { musicalProductService, onboardingService } from "../api";
import type {
	MusicalProductSearchRequest,
	MusicalProductListApiResponse,
	MusicalProductDetails,
	MusicalProductMedia,
	MusicalProductImages,
	MusicalProductTechnicalConfig,
	MusicalProductSchedule,
} from "../api/types";
import type { OnboardingContactData } from "@/utils/validation";

// Query Keys
export const musicalProductKeys = {
	all: ["musicalProducts"] as const,
	lists: () => [...musicalProductKeys.all, "list"] as const,
	list: (filters: MusicalProductSearchRequest) =>
		[...musicalProductKeys.lists(), filters] as const,
	detail: (id: number) => [...musicalProductKeys.all, "detail", id] as const,
	onboarding: (id: number) =>
		[...musicalProductKeys.all, "onboarding", id] as const,
	pending: () => [...musicalProductKeys.all, "pending"] as const,
	schedule: () => [...musicalProductKeys.all, "schedule"] as const,
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
 * Hook to GET schedule
 */
export const useMusicalProductSchedule = (
	productId: number,
	enabled: boolean = true
) => {
	return useQuery({
		queryKey: musicalProductKeys.schedule(),
		queryFn: () => {
			return onboardingService.getSchedule(productId);
		},
		enabled: enabled && productId > 0,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};

/**
 * Hook to get onboarding data
 */
export const useOnboardingData = (enabled: boolean = true) => {
	return useQuery({
		queryKey: musicalProductKeys.pending(),
		queryFn: async () => {
			const response = await onboardingService.getOnboardingPending();
			return response;
		},
		select: (data) => {
			const item = data.find((item) => item);
			return item ? { ...item } : undefined;
		},
		enabled,
	});
};

/**
 * Hook to save onboarding contact (Step 1)
 */
export const useSaveOnboardingContact = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (contactData: OnboardingContactData) =>
			musicalProductService.saveOnboardingContact(contactData),

		onSuccess: () => {
			// Invalidate onboarding queries
			void queryClient.invalidateQueries({
				queryKey: musicalProductKeys.pending(),
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
			detailsData: MusicalProductDetails;
		}) => musicalProductService.saveOnboardingDetails(productId, detailsData),
		onSuccess: () => {
			// Invalidate onboarding queries
			void queryClient.invalidateQueries({
				queryKey: musicalProductKeys.pending(),
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
			mediaData: MusicalProductMedia;
		}) => musicalProductService.saveOnboardingMedia(productId, mediaData),
		onSuccess: () => {
			// Invalidate onboarding queries
			void queryClient.invalidateQueries({
				queryKey: musicalProductKeys.pending(),
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
			imagesData: MusicalProductImages;
		}) => musicalProductService.saveOnboardingImages(productId, imagesData),
		onSuccess: () => {
			// Invalidate onboarding queries
			void queryClient.invalidateQueries({
				queryKey: musicalProductKeys.pending(),
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
			technicalData: MusicalProductTechnicalConfig;
		}) =>
			musicalProductService.saveOnboardingTechnicalConfig(
				productId,
				technicalData
			),
		onSuccess: () => {
			// Invalidate onboarding queries
			void queryClient.invalidateQueries({
				queryKey: musicalProductKeys.pending(),
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
			scheduleData: MusicalProductSchedule;
		}) => musicalProductService.saveOnboardingSchedule(productId, scheduleData),
		onSuccess: () => {
			// Invalidate onboarding queries
			void queryClient.invalidateQueries({
				queryKey: musicalProductKeys.pending(),
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
		onSuccess: () => {
			// Invalidate related queries
			void queryClient.invalidateQueries({
				queryKey: musicalProductKeys.pending(),
			});
			void queryClient.invalidateQueries({
				queryKey: musicalProductKeys.all,
			});
		},
	});
};
