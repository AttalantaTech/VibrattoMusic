/**
 * Token validation utilities
 * Handles JWT token validation and expiration checks
 */

export interface TokenValidationResult {
	isValid: boolean;
	isExpired: boolean;
	payload?: Record<string, unknown>;
	error?: string;
}

export class TokenValidator {
	/**
	 * Validates JWT token format and expiration
	 */
	public static validateToken(token: string | null): TokenValidationResult {
		if (!token) {
			return {
				isValid: false,
				isExpired: false,
				error: "No token provided",
			};
		}
		try {
			// Check JWT format (3 parts separated by dots)
			const tokenParts = token.split(".");
			if (tokenParts.length !== 3 || !tokenParts[1]) {
				return {
					isValid: false,
					isExpired: false,
					error: "Invalid JWT token format",
				};
			}

			// Decode payload
			const payload = JSON.parse(atob(tokenParts[1])) as Record<
				string,
				unknown
			>;

			// Check expiration
			const currentTime = Math.floor(Date.now() / 1000);
			const exp = payload["exp"] as number;

			if (exp && exp < currentTime) {
				return {
					isValid: false,
					isExpired: true,
					payload,
					error: "Token expired",
				};
			}

			return {
				isValid: true,
				isExpired: false,
				payload,
			};
		} catch (error) {
			return {
				isValid: false,
				isExpired: false,
				error:
					error instanceof Error ? error.message : "Token validation failed",
			};
		}
	}

	/**
	 * Extracts user information from token payload
	 */
	public static extractUserInfo(token: string): Record<string, unknown> | null {
		const validation = this.validateToken(token);
		return validation.payload || null;
	}
	/**
	 * Checks if token needs refresh (expires within specified minutes)
	 */
	public static needsRefresh(
		token: string,
		minutesBeforeExpiry: number = 15
	): boolean {
		const validation = this.validateToken(token);

		if (!validation.isValid || !validation.payload) {
			return false;
		}

		const exp = validation.payload["exp"] as number;
		if (!exp) return false;

		const currentTime = Math.floor(Date.now() / 1000);
		const refreshThreshold = exp - minutesBeforeExpiry * 60;

		return currentTime >= refreshThreshold;
	}
}
