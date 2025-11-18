export interface JWTPayload {
	exp?: number;
	iat?: number;
	sub?: string;
	[key: string]: unknown;
}

export function parseJWT(token: string): JWTPayload | null {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) {
			return null;
		}

		const payload = parts[1];
		if (!payload) {
			return null;
		}
		const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
		return JSON.parse(decoded) as JWTPayload;
	} catch (error) {
		console.error("Failed to parse JWT:", error);
		return null;
	}
}

export function isTokenExpired(token: string): boolean {
	const payload = parseJWT(token);
	if (!payload || !payload.exp) {
		return true;
	}

	const currentTime = Math.floor(Date.now() / 1000);
	return payload.exp < currentTime;
}

export function getTokenExpirationTime(token: string): number | null {
	const payload = parseJWT(token);
	if (!payload || !payload.exp) {
		return null;
	}

	return payload.exp * 1000; // Convert to milliseconds
}

export function isTokenExpiringSoon(token: string, bufferMinutes = 5): boolean {
	const payload = parseJWT(token);
	if (!payload || !payload.exp) {
		return true;
	}

	const currentTime = Math.floor(Date.now() / 1000);
	const bufferSeconds = bufferMinutes * 60;
	return payload.exp - bufferSeconds <= currentTime;
}

export function extractUserIdFromToken(token: string): number | null {
	try {
		const payload = parseJWT(token);
		if (!payload) return null;

		// Try different common JWT fields for user ID
		const possibleIds = [
			payload.sub,
			payload['userId'],
			payload['nameid'],
			payload['unique_name']
		];

		for (const id of possibleIds) {
			if (id) {
				const numericId = Number(id);
				if (!isNaN(numericId) && numericId > 0) {
					return numericId;
				}
			}
		}

		return null;
	} catch (error) {
		console.error("Failed to extract user ID from token:", error);
		return null;
	}
}