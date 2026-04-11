import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { onboardingService } from "../api";
import type {
	MusicalProductSearchRequest,
	MusicalProductDetails,
	MusicalProductMedia,
	MusicalProductImages,
	MusicalProductTechnicalConfig,
	MusicalProductSchedule,
	OnboardingApiResponse,
} from "../api/types";
import type { OnboardingContactData } from "@/utils/validation";

// Query Keys
export const onboardingKeys = {
	all: ["onboarding"] as const,
	lists: () => [...onboardingKeys.all, "list"] as const,
	list: (filters: MusicalProductSearchRequest) =>
		[...onboardingKeys.lists(), filters] as const,
	detail: (id: number) => [...onboardingKeys.all, "detail", id] as const,
	onboarding: (id: number) =>
		[...onboardingKeys.all, "onboarding", id] as const,
	pending: () => [...onboardingKeys.all, "pending"] as const,
	schedule: () => [...onboardingKeys.all, "schedule"] as const,
};

/**
 * Hook to get onboarding data
 */
export const useOnboardingData = (enabled: boolean = true) => {
	return useQuery<Array<OnboardingApiResponse>>({
		queryKey: onboardingKeys.pending(),
		queryFn: async () => {
			const response = await onboardingService.getOnboardingPending();
			return response;
		},
		enabled,
	});
};

/**
 * Hook to GET schedule
 */
export const useOnboardingSchedule = (
	productId: number,
	enabled: boolean = true
) => {
	return useQuery({
		queryKey: onboardingKeys.schedule(),
		queryFn: () => {
			return onboardingService.getOnboardingSchedule(productId);
		},
		enabled: enabled && productId > 0,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};

/**
 * Hook to save onboarding contact (Step 1)
 */
export const useSaveOnboardingContact = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (contactData: OnboardingContactData) =>
			onboardingService.saveOnboardingContact(contactData),

		onSuccess: () => {
			// Invalidate onboarding queries
			void queryClient.invalidateQueries({
				queryKey: onboardingKeys.pending(),
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
		}) => onboardingService.saveOnboardingDetails(productId, detailsData),
		onSuccess: () => {
			// Invalidate onboarding queries
			void queryClient.invalidateQueries({
				queryKey: onboardingKeys.pending(),
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
		}) => onboardingService.saveOnboardingMedia(productId, mediaData),
		onSuccess: () => {
			// Invalidate onboarding queries
			void queryClient.invalidateQueries({
				queryKey: onboardingKeys.pending(),
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
		}) => onboardingService.saveOnboardingImages(productId, imagesData),
		onSuccess: () => {
			// Invalidate onboarding queries
			void queryClient.invalidateQueries({
				queryKey: onboardingKeys.pending(),
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
			onboardingService.saveOnboardingTechnicalConfig(productId, technicalData),
		onSuccess: () => {
			// Invalidate onboarding queries
			void queryClient.invalidateQueries({
				queryKey: onboardingKeys.pending(),
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
		}) => onboardingService.saveOnboardingSchedule(productId, scheduleData),
		onSuccess: () => {
			// Invalidate onboarding queries
			void queryClient.invalidateQueries({
				queryKey: onboardingKeys.pending(),
			});
		},
	});
};

/**
 * Hook to publish musical product after completing onboarding
 */
export const usePublishOnboarding = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (productId: number) =>
			onboardingService.publishOnboarding(productId),
		onSuccess: () => {
			// Invalidate related queries
			void queryClient.invalidateQueries({
				queryKey: onboardingKeys.pending(),
			});
			void queryClient.invalidateQueries({
				queryKey: onboardingKeys.all,
			});
		},
	});
};

/**
 * Hook to disable onboarding
 */
export const useDisableOnboarding = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ onboardingId }: { onboardingId: number }) =>
			onboardingService.disableOnboarding(onboardingId),
		onSuccess: () => {
			// Invalidate onboarding queries
			void queryClient.invalidateQueries({
				queryKey: onboardingKeys.pending(),
			});
		},
	});
};
