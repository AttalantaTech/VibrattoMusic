import type { ApiClient } from "../core/client";
import type {
	User,
	LoginRequest,
	LoginResponse,
	FavoriteRequest,
	MusicalProductApiResponse,
	RefreshTokenRequest,
	ForgotPasswordRequest,
	ResetPasswordRequest,
	ChangePasswordRequest,
	UserProfile,
	UserSettings,
	PaginationParameters,
	PaginatedResponse,
	UserApiResponse,
} from "../types";

export class UserService {
	public constructor(private readonly apiClient: ApiClient) {}

	// Authentication methods
	/**
	 * Register a new user
	 */
	public async register(userData: Omit<User, "id" | "ativo">): Promise<User> {
		return this.apiClient.post<User>("usuario", userData);
	} /**
	 * Login user
	 */
	public async login(credentials: LoginRequest): Promise<LoginResponse> {
		const response = await this.apiClient.post<any>(
			"usuario/login",
			credentials
		);

		// Handle if response is a string (token directly)
		let token: string | undefined;
		let normalizedResponse: LoginResponse;

		if (typeof response === "string") {
			// API might be returning just the token as a string
			token = response;
			normalizedResponse = {
				Token: token,
				token: token,
			};
		} else if (typeof response === "object" && response !== null) {
			// Check multiple possible token field names
			token =
				response.Token ||
				response.token ||
				response.accessToken ||
				response.access_token;

			// If still no token, check if the whole response might be wrapped
			if (!token && response.data) {
				const data = response.data;
				token =
					data.Token || data.token || data.accessToken || data.access_token;
			}

			normalizedResponse = {
				...response,
				Token: token || "",
				token: token || "",
			};
		} else {
			console.error("❌ Unexpected response type:", typeof response);
			throw new Error("Invalid response format from API");
		}

		// Validate token format
		if (!token || typeof token !== "string") {
			throw new Error("Invalid token received from API");
		}

		// Basic JWT format validation (3 parts separated by dots)
		// Temporarily disable strict JWT validation to see the actual response
		const tokenParts = token.split(".");
		if (tokenParts.length !== 3) {
			console.warn(
				"⚠️ Token may not be in standard JWT format. Token parts:",
				tokenParts.length,
				"Token preview:",
				token.substring(0, 50)
			);
			// Don't throw error for now, just log warning
			// throw new Error("Invalid JWT token format");
		}

		return normalizedResponse;
	}

	/**
	 * Refresh authentication token
	 */
	public async refreshToken(
		request: RefreshTokenRequest
	): Promise<LoginResponse> {
		const response = await this.apiClient.post<any>(
			"usuario/refresh-token",
			request
		);

		// Apply the same normalization logic as login
		let token: string | undefined;
		let normalizedResponse: LoginResponse;

		if (typeof response === "string") {
			token = response;
			normalizedResponse = {
				Token: token,
				token: token,
			};
		} else if (typeof response === "object" && response !== null) {
			token =
				response.Token ||
				response.token ||
				response.accessToken ||
				response.access_token;

			if (!token && response.data) {
				const data = response.data;
				token =
					data.Token || data.token || data.accessToken || data.access_token;
			}

			normalizedResponse = {
				...response,
				Token: token || "",
				token: token || "",
			};
		} else {
			throw new Error("Invalid refresh token response format from API");
		}

		if (!token || typeof token !== "string") {
			throw new Error("Invalid token received from refresh endpoint");
		}

		return normalizedResponse;
	}

	/**
	 * Logout user
	 */
	public async logout(): Promise<void> {
		return this.apiClient.post<void>("usuario/logout");
	}

	/**
	 * Request password reset
	 */
	public async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
		return this.apiClient.post<void>("usuario/esqueciSenha", request);
	}

	/**
	 * Reset password with token
	 */
	public async resetPassword(request: ResetPasswordRequest): Promise<void> {
		return this.apiClient.post<void>("usuario/redefinirSenha", request);
	}

	/**
	 * Change password (authenticated user)
	 */
	public async changePassword(request: ChangePasswordRequest): Promise<void> {
		return this.apiClient.post<void>("usuario/change-password", request);
	}

	// Profile management
	/**
	 * Get current user profile
	 */
	public async getProfile(): Promise<User> {
		return this.apiClient.get<User>("usuario/profile");
	}

	/**
	 * Update user profile
	 */
	public async updateProfile(userData: Partial<User>): Promise<User> {
		return this.apiClient.put<User>("usuario/profile", userData);
	}

	/**
	 * Update user profile details
	 */
	public async updateProfileDetails(
		profileData: Partial<UserProfile>
	): Promise<UserProfile> {
		return this.apiClient.put<UserProfile>(
			"usuario/profile/details",
			profileData
		);
	}

	/**
	 * Update user settings
	 */
	public async updateSettings(
		settings: Partial<UserSettings>
	): Promise<UserSettings> {
		return this.apiClient.put<UserSettings>("usuario/settings", settings);
	}

	/**
	 * Upload profile picture
	 */
	public async uploadProfilePicture(file: File): Promise<{ url: string }> {
		const formData = new FormData();
		formData.append("foto", file);
		return this.apiClient.post<{ url: string }>(
			"usuario/profile/foto",
			formData,
			{
				headers: { "Content-Type": "multipart/form-data" },
			}
		);
	}

	// Favorites management
	/**
	 * Add or remove a product from favorites
	 */
	public async toggleFavorite(request: FavoriteRequest): Promise<void> {
		return this.apiClient.post<void>("usuario/favorito", request);
	}

	/**
	 * Get user
	 */
	public async getUser(): Promise<UserApiResponse> {
		return this.apiClient.get<UserApiResponse>("usuario");
	}

	/**
	 * Get user's favorite products
	 */
	public async getFavorites(
		parameters?: PaginationParameters
	): Promise<PaginatedResponse<MusicalProductApiResponse>> {
		const queryParameters = new URLSearchParams();
		if (parameters?.page)
			queryParameters.append("page", parameters.page.toString());
		if (parameters?.limit)
			queryParameters.append("limit", parameters.limit.toString());

		const queryString = queryParameters.toString();
		const url = queryString
			? `usuario/favorito?${queryString}`
			: "usuario/favorito";

		// Try to get the response first
		const response = await this.apiClient.get<any>(url);

		// If the API returns an array directly, transform it to paginated format
		if (Array.isArray(response)) {
			const paginatedResponse: PaginatedResponse<MusicalProductApiResponse> = {
				data: response as Array<MusicalProductApiResponse>,
				pagination: {
					currentPage: 1,
					totalPages: 1,
					totalItems: response.length,
					itemsPerPage: response.length,
					hasNextPage: false,
					hasPreviousPage: false,
				},
			};
			return paginatedResponse;
		}

		// If it's already in paginated format, return as is
		return response as PaginatedResponse<MusicalProductApiResponse>;
	}

	/**
	 * Check if product is favorited by user
	 */
	public async isFavorite(productId: number): Promise<{ isFavorite: boolean }> {
		return this.apiClient.get<{ isFavorite: boolean }>(
			`usuario/favorito/${productId}`
		);
	}
}
