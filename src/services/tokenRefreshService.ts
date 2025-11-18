import { useAuthStore } from "../store/authStore";
import { authSync } from "../utils/authSync";
import { isTokenExpiringSoon, isTokenExpired } from "../utils/jwt";

class TokenRefreshService {
	private refreshTimer: NodeJS.Timeout | null = null;
	private isRefreshing = false;
	private refreshPromise: Promise<boolean> | null = null;

	/**
	 * Starts the token refresh service
	 */
	public start(): void {
		this.scheduleRefresh();
	}

	/**
	 * Stops the token refresh service
	 */
	public stop(): void {
		if (this.refreshTimer) {
			clearTimeout(this.refreshTimer);
			this.refreshTimer = null;
		}
	}

	/**
	 * Schedules the next token refresh
	 */
	private scheduleRefresh(): void {
		this.stop();

		const token = authSync.getToken();
		if (!token) {
			return;
		}

		// Check if token is already expired
		if (isTokenExpired(token)) {
			this.refreshToken();
			return;
		}

		// Check if token is expiring soon (within 5 minutes)
		if (isTokenExpiringSoon(token, 5)) {
			this.refreshToken();
			return;
		}

		// Schedule refresh for 1 minute before token expires
		const expirationTime = this.getTokenExpirationTime(token);
		if (expirationTime) {
			const refreshTime = expirationTime - 60000; // 1 minute before expiration
			const delay = refreshTime - Date.now();

			if (delay > 0) {
				this.refreshTimer = setTimeout(() => {
					this.refreshToken();
				}, delay);
			}
		}
	}

	/**
	 * Refreshes the authentication token
	 */
	public async refreshToken(): Promise<boolean> {
		// If already refreshing, return the existing promise
		if (this.isRefreshing && this.refreshPromise) {
			return this.refreshPromise;
		}

		this.isRefreshing = true;
		this.refreshPromise = this.performRefresh();

		try {
			const result = await this.refreshPromise;
			return result;
		} finally {
			this.isRefreshing = false;
			this.refreshPromise = null;
		}
	}

	/**
	 * Performs the actual token refresh
	 */
	private async performRefresh(): Promise<boolean> {
		try {
			const refreshToken = authSync.getRefreshToken();
			if (!refreshToken) {
				console.error("No refresh token available");
				return false;
			}

			// Lazy import to avoid circular dependency
			const { userService } = await import("../api");
			const response = await userService.refreshToken({ refreshToken });

			if (response.token) {
				// Update only the access token
				useAuthStore.getState().setToken(response.token);

				// Schedule next refresh
				this.scheduleRefresh();

				return true;
			}

			return false;
		} catch (error) {
			console.error("Token refresh failed:", error);

			// If refresh fails, clear auth and redirect to login
			const authStore = useAuthStore.getState();
			authStore.logout();

			return false;
		}
	}

	/**
	 * Gets the token expiration time in milliseconds
	 */
	private getTokenExpirationTime(token: string): number | null {
		try {
			const parts = token.split(".");
			if (parts.length !== 3) {
				return null;
			}
			const payloadPart = parts[1];
			if (!payloadPart) {
				return null;
			}
			const payload = JSON.parse(atob(payloadPart)) as { exp?: number };
			if (payload.exp) {
				return payload.exp * 1000;
			}
		} catch (error) {
			console.error("Failed to parse token expiration:", error);
		}
		return null;
	}

	/**
	 * Checks if a request should trigger token refresh
	 */
	public shouldRefreshBeforeRequest(): boolean {
		const token = authSync.getToken();
		if (!token) {
			return false;
		}

		return isTokenExpiringSoon(token, 2); // Refresh if expiring in 2 minutes
	}
}

export const tokenRefreshService = new TokenRefreshService();
