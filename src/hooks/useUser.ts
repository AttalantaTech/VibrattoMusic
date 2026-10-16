import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { userService } from "../api";
import type {
	User,
	LoginRequest,
	FavoriteRequest,
	ForgotPasswordRequest,
	ResetPasswordRequest,
	ChangePasswordRequest,
	UpdateUserProfileRequest,
	MusicalProductApiResponse,
	PaginatedResponse,
} from "../api/types";
import { authSync } from "../utils/authSync";
import { useAuthStore } from "../store/authStore";

// Query Keys
export const userKeys = {
	all: ["user"] as const,
	favorites: () => [...userKeys.all, "favorites"] as const,
	user: () => [...userKeys.all, "get-user"] as const,
};

/**
 * Hook for user registration
 */
export const useRegisterUser = () => {
	return useMutation({
		mutationFn: (userData: Omit<User, "id" | "ativo">) =>
			userService.register(userData),
		onError: (error) => {
			console.error("Registration failed:", error);
		},
	});
};

/**
 * Hook for user login
 */
export const useLogin = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (credentials: LoginRequest) => userService.login(credentials),
		onSuccess: () => {
			// Don't set token here - let the authStore handle it via setAuth()
			// Invalidate user-related queries
			void queryClient.invalidateQueries({ queryKey: userKeys.all });
		},
		onError: (error) => {
			console.error("❌ Login failed:", error);
		},
	});
};

/**
 * Hook for logout
 */
export const useLogout = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			// Use auth sync to clear token from all systems
			authSync.clearToken();
			// Clear all queries
			queryClient.clear();
			return Promise.resolve();
		},
	});
};

/**
 * Hook to get user favorites
 */
export const useFavorites = (enabled: boolean = true) => {
	return useQuery({
		queryKey: userKeys.favorites(),
		queryFn: async () => {
			const favorites = await userService.getFavorites();
			return favorites;
		},
		enabled,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: (failureCount, error) => {
			// Don't retry on 401 errors (authentication issues)
			const status = (error as { response?: { status?: number } })?.response
				?.status;
			if (status === 401) {
				return false;
			}
			return failureCount < 3;
		},
	});
};

/**
 * Hook to toggle favorite status
 */
export const useToggleFavorite = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (request: FavoriteRequest) => {
			return userService.toggleFavorite(request);
		},
		onMutate: async (request: FavoriteRequest) => {
			// Cancel any outgoing refetches (so they don't overwrite our optimistic update)
			await queryClient.cancelQueries({ queryKey: userKeys.favorites() });

			// Snapshot the previous value
			const previousFavorites = queryClient.getQueryData(userKeys.favorites());

			// Get current favorites to determine if we're adding or removing
			const currentFavorites = queryClient.getQueryData<
				PaginatedResponse<MusicalProductApiResponse>
			>(userKeys.favorites());
			const isCurrentlyFavorited =
				currentFavorites?.data?.some(
					(f) => f.id === request.produtoMusicalId
				) ?? false;

			// Optimistically update the favorites list immediately and persistently
			queryClient.setQueryData(
				userKeys.favorites(),
				(old: PaginatedResponse<MusicalProductApiResponse> | undefined) => {
					if (!old) {
						return old;
					}

					if (isCurrentlyFavorited) {
						// Remove from favorites
						return {
							...old,
							data: old.data.filter((f) => f.id !== request.produtoMusicalId),
							pagination: {
								...old.pagination,
								totalItems: Math.max(0, old.pagination.totalItems - 1),
							},
						};
					} else {
						// Adding to favorites - we can't construct the full object without more data
						// So we'll let the refetch handle this case
						return old;
					}
				}
			);

			// Return a context object with the snapshotted value and current state
			return {
				previousFavorites,
				wasCurrentlyFavorited: isCurrentlyFavorited,
				productId: request.produtoMusicalId,
			};
		},
		onError: (error, _request, context) => {
			// If the mutation fails, use the context returned from onMutate to roll back
			if (context?.previousFavorites) {
				queryClient.setQueryData(
					userKeys.favorites(),
					context.previousFavorites
				);
			}
			console.error("❌ Toggle favorite failed:", error);
			const status = (error as { response?: { status?: number } })?.response
				?.status;
			if (status === 401) {
				console.error("❌ User not authenticated for favorite toggle");
			}
		},
		onSuccess: () => {
			// Don't automatically invalidate cache - let the optimistic update persist
			// Only invalidate manually when we're confident the server has processed
			// This prevents the "flickering" effect where items reappear

			void queryClient.invalidateQueries({
				queryKey: userKeys.favorites(),
			});
		},
	});
};

/**
 * Hook to manually refresh favorites from server when needed
 */
export const useRefreshFavorites = () => {
	const queryClient = useQueryClient();

	return useCallback(async () => {
		// Force refetch from server, bypassing cache
		await queryClient.refetchQueries({
			queryKey: userKeys.favorites(),
			type: "active",
		});
	}, [queryClient]);
};

/**
 * Hook to check if a product is favorited and provide optimistic updates
 */
export const useFavoriteState = (productId: number) => {
	const { data: favorites } = useFavorites();
	const [optimisticState, setOptimisticState] = useState<boolean | null>(null);

	// Determine actual favorite state from server data
	const isActuallyFavorited =
		favorites?.data?.some((f) => f.id === productId) ?? false;

	// Use optimistic state if available, otherwise use actual state
	const isFavorite =
		optimisticState !== null ? optimisticState : isActuallyFavorited;

	// Function to set optimistic state
	const setOptimisticFavorite = useCallback((state: boolean) => {
		setOptimisticState(state);
		// Clear optimistic state after a delay to let the server sync
		setTimeout(() => {
			setOptimisticState(null);
		}, 2000);
	}, []);

	return {
		isFavorite,
		setOptimisticFavorite,
		isActuallyFavorited,
	};
};

// Removed useToggleFavoriteWithOptimism - functionality moved to ArtistCardWithFavorites

/**
 * Hook to validate current token
 */
export const useValidateToken = () => {
	const { token, logout } = useAuthStore();

	return useMutation({
		mutationFn: async () => {
			if (!token) {
				throw new Error("No token available");
			}
			// Check if token is expired locally first
			try {
				const tokenParts = token.split(".");
				if (tokenParts.length === 3 && tokenParts[1]) {
					const payload = JSON.parse(atob(tokenParts[1])) as { exp?: number };
					const currentTime = Math.floor(Date.now() / 1000);

					if (payload.exp && payload.exp < currentTime) {
						logout();
						throw new Error("Token expired");
					}
				}
			} catch (error) {
				console.warn("⚠️ Could not parse token for local validation:", error);
			}

			// Validate with server
			return authSync.validateToken();
		},
		onError: (error) => {
			console.error("❌ Token validation failed:", error);
			logout();
		},
	});
};

/**
 * Hook for forgot password request
 */
export const useForgotPassword = () => {
	return useMutation({
		mutationFn: (request: ForgotPasswordRequest) =>
			userService.forgotPassword(request),
		onError: (error) => {
			console.error("❌ Forgot password request failed:", error);
		},
	});
};

/**
 * Hook for password reset with token
 */
export const useResetPassword = () => {
	return useMutation({
		mutationFn: (request: ResetPasswordRequest) =>
			userService.resetPassword(request),
		onError: (error) => {
			console.error("❌ Password reset failed:", error);
		},
	});
};

export const useUser = (enabled: boolean = true) => {
	return useQuery({
		queryKey: userKeys.user(),
		queryFn: () => userService.getUser(),
		enabled,
	});
};

/**
 * Hook to update the logged user's profile (only the fields sent are changed)
 */
export const useUpdateUser = () => {
	const queryClient = useQueryClient();
	const updateAuthUser = useAuthStore((state) => state.updateUser);

	return useMutation({
		mutationFn: (request: UpdateUserProfileRequest) =>
			userService.updateProfile(request),
		onSuccess: (_data, request) => {
			// Keep the name shown across the app (header, menus) in sync
			if (request.nome) updateAuthUser({ nome: request.nome });
			void queryClient.invalidateQueries({ queryKey: userKeys.user() });
		},
	});
};

/**
 * Hook to change the logged user's password
 */
export const useChangePassword = () => {
	return useMutation({
		mutationFn: (request: ChangePasswordRequest) =>
			userService.changePassword(request),
	});
};
