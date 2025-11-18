import Cookies from "js-cookie";
import { apiClient } from "../api/core/client";

/**
 * Authentication synchronization utilities
 * Handles token management between cookies, localStorage, and API client
 */
export const authSync = {
	/**
	 * Synchronizes authentication token across different storage mechanisms
	 * @param token - The authentication token to sync
	 */ syncToken: (token: string | null) => {
		try {
			if (!token) {
				authSync.clearToken();
				return;
			} // Set token in cookies with secure settings
			Cookies.set("authToken", token, {
				expires: 7, // 7 days
				secure: process.env["NODE_ENV"] === "production",
				sameSite: "strict",
			});

			// Set token in API client for immediate use
			apiClient.setAuthToken(token);
		} catch (error) {
			console.error("❌ Error syncing token:", error);
		}
	},
	/**
	 * Clears authentication token from all storage mechanisms
	 */ clearToken: () => {
		try {
			// Remove from cookies
			Cookies.remove("authToken");

			// Remove from API client
			apiClient.setAuthToken(null);
		} catch (error) {
			console.error("❌ Error clearing token:", error);
		}
	},

	/**
	 * Synchronizes refresh token to cookies
	 * @param refreshToken - The refresh token to sync
	 */
	syncRefreshToken: (refreshToken: string | null) => {
		try {
			if (!refreshToken) {
				authSync.clearRefreshToken();
				return;
			}

			// Set refresh token in cookies with secure settings
			Cookies.set("refreshToken", refreshToken, {
				expires: 30, // 30 days
				secure: process.env["NODE_ENV"] === "production",
				sameSite: "strict",
				httpOnly: false, // Can't set httpOnly from client-side
			});
		} catch (error) {
			console.error("❌ Error syncing refresh token:", error);
		}
	},

	/**
	 * Clears refresh token from cookies
	 */
	clearRefreshToken: () => {
		try {
			Cookies.remove("refreshToken");
		} catch (error) {
			console.error("❌ Error clearing refresh token:", error);
		}
	},

	/**
	 * Gets the current refresh token from cookies
	 * @returns The current refresh token or null
	 */
	getRefreshToken: (): string | null => {
		return Cookies.get("refreshToken") ?? null;
	},
	/**
	 * Gets the current token from cookies
	 * @returns The current authentication token or null
	 */
	getToken: (): string | null => {
		return Cookies.get("authToken") ?? null;
	},
	/**
	 * Validates if the current token is still valid
	 * @returns Promise resolving to true if token is valid
	 */
	validateToken: async (): Promise<boolean> => {
		try {
			const token = authSync.getToken();
			if (!token) return false;

			// Make a simple API call to validate token
			const response = await apiClient.get<{ valid: boolean }>(
				"/auth/validate"
			);
			return response.valid ?? true;
		} catch (error) {
			console.warn("⚠️ Token validation failed:", error);
			return false;
		}
	},
};
