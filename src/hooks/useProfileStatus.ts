import { useAuthStore } from "../store/authStore";
import type {
	MusicalProductApiResponse,
	MusicalProductSearchRequest,
	User,
} from "../api/types";
import { useQuery } from "@tanstack/react-query";
import { musicalProductService } from "../api";

// Query keys for better organization
export const profileKeys = {
	all: ["profile"] as const,
	// Without searchRequest the key ends at userId, so invalidating
	// musicalProducts(userId) also refreshes the paginated queries (Header)
	musicalProducts: (
		userId?: number,
		searchRequest?: Partial<MusicalProductSearchRequest>
	) =>
		searchRequest
			? ([
					...profileKeys.all,
					"musicalProducts",
					userId,
					searchRequest,
				] as const)
			: ([...profileKeys.all, "musicalProducts", userId] as const),
};

export type ProfileStatus = "COMPLETE" | "INCOMPLETE";

/**
 * Determines if a musician's profile is complete based on essential fields
 */
export const isMusicianProfileComplete = (
	user: User | null,
	musicalProducts: Array<MusicalProductApiResponse> | null
): boolean => {
	// Non-musicians are considered complete
	if (user?.userType !== "produto_musical") {
		return true;
	}

	// User must have at least one musical product
	if (!musicalProducts || musicalProducts.length === 0) {
		return false;
	}

	const product = musicalProducts[0]; // Primary musical product

	// If no product exists, profile is incomplete
	if (!product) {
		return false;
	}

	// Essential fields that must be filled for a complete profile
	const essentialFields = [
		product.nome, // Product name
		product.descricao, // Description
		// product.fotoPerfil, // Profile picture
		// product.logomarca, // Logo
		product.cepContato, // Contact CEP
		product.logradouroContato, // Contact address
		product.numeroContato, // Contact number
		product.cidadeContato, // Contact city
		product.estadoContato, // Contact state
		product.email, // Contact email
	];

	// Check if all essential fields are filled
	const hasAllEssentialFields = essentialFields.every(
		(field) => field !== null && field !== undefined && field.trim() !== ""
	);

	// Additional checks for arrays
	const hasCategories = product.categoria?.id > 0;
	const hasCity = product.cidade?.id > 0;
	const hasEventTypes = product.tipoEvento && product.tipoEvento.length > 0;
	const hasGenres = product.generoMusical && product.generoMusical.length > 0;

	// Profile is complete if it has all essential fields AND required related data
	return (
		hasAllEssentialFields &&
		hasCategories &&
		hasCity &&
		hasEventTypes &&
		hasGenres
	);
};

export const useProfileStatus = (
	searchRequest?: Partial<MusicalProductSearchRequest>
) => {
	const { user, isAuthenticated } = useAuthStore();

	// Fetch user's musical products directly from the API
	const {
		data: musicalProductsData,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: profileKeys.musicalProducts(user?.id, searchRequest),
		queryFn: async () => {
			return musicalProductService.getMyProducts(searchRequest);
		},
		// "My products" requires login: without a user the API answers 401,
		// and the API client treats 401 as an expired session (clears auth)
		enabled: isAuthenticated,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 2,
	});

	const musicalProducts =
		(musicalProductsData !== undefined && musicalProductsData) || null;
	const isProfileComplete = isMusicianProfileComplete(
		user,
		musicalProducts?.dados ?? []
	);
	const profileStatus: ProfileStatus = isProfileComplete
		? "COMPLETE"
		: "INCOMPLETE";

	return {
		profileStatus,
		isProfileComplete,
		isProfileIncomplete: !isProfileComplete,
		user,
		musicalProducts,
		isLoading,
		refetch,
	};
};

/**
 * Hook específico para o onboarding que força refresh do perfil
 */
export const useOnboardingProfileStatus = () => {
	const baseHook = useProfileStatus();

	return {
		...baseHook,
		// Método adicional para forçar refresh durante onboarding
		forceRefresh: async () => {
			await baseHook.refetch();
		},
	};
};
