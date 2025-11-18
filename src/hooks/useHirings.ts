// Hiring management hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hiringService } from "../api";
import type { MyHiring } from "../common/types";
import type {
	PaginationParameters,
	PaginatedResponse,
} from "../api/types";

// Query Keys
export const hiringKeys = {
	all: ["hirings"] as const,
	lists: () => [...hiringKeys.all, "list"] as const,
	list: (filters: PaginationParameters & { status?: string }) =>
		[...hiringKeys.lists(), filters] as const,
	details: () => [...hiringKeys.all, "detail"] as const,
	detail: (id: string) => [...hiringKeys.details(), id] as const,
	contract: (id: string) => [...hiringKeys.all, "contract", id] as const,
	proposal: (id: string) => [...hiringKeys.all, "proposal", id] as const,
	stats: () => [...hiringKeys.all, "stats"] as const,
};

/**
 * Hook to get user's hirings (as hirer)
 */
export const useMyHirings = (
	parameters?: PaginationParameters & { status?: string },
	enabled: boolean = true
) => {
	return useQuery<PaginatedResponse<MyHiring>, Error>({
		queryKey: hiringKeys.list(parameters || {}),
		queryFn: () => hiringService.getMyHirings(parameters),
		enabled,
		staleTime: 1 * 60 * 1000, // 1 minute
	});
};

/**
 * Hook to get hiring by ID
 */
export const useHiring = (hiringId: string, enabled: boolean = true) => {
	return useQuery<MyHiring, Error>({
		queryKey: hiringKeys.detail(hiringId),
		queryFn: () => hiringService.getHiring(hiringId),
		enabled: enabled && hiringId.length > 0,
		staleTime: 30 * 1000, // 30 seconds
	});
};

/**
 * Hook to cancel a hiring
 */
export const useCancelHiring = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			hiringId,
			reason,
		}: {
			hiringId: string;
			reason?: string;
		}) => hiringService.cancelHiring(hiringId, reason),
		onSuccess: (_, variables) => {
			// Invalidate related queries
			void queryClient.invalidateQueries({
				queryKey: hiringKeys.detail(variables.hiringId),
			});
			void queryClient.invalidateQueries({
				queryKey: hiringKeys.lists(),
			});
			void queryClient.invalidateQueries({
				queryKey: hiringKeys.stats(),
			});
		},
	});
};

/**
 * Hook to get hiring contract details
 */
export const useHiringContract = (hiringId: string, enabled: boolean = true) => {
	return useQuery({
		queryKey: hiringKeys.contract(hiringId),
		queryFn: () => hiringService.getHiringContract(hiringId),
		enabled: enabled && hiringId.length > 0,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};

/**
 * Hook to get hiring proposal details
 */
export const useHiringProposal = (hiringId: string, enabled: boolean = true) => {
	return useQuery({
		queryKey: hiringKeys.proposal(hiringId),
		queryFn: () => hiringService.getHiringProposal(hiringId),
		enabled: enabled && hiringId.length > 0,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};

/**
 * Hook to get hiring statistics
 */
export const useHiringStats = (enabled: boolean = true) => {
	return useQuery({
		queryKey: hiringKeys.stats(),
		queryFn: () => hiringService.getHiringStats(),
		enabled,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};
