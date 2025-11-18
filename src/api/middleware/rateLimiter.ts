export interface RateLimitConfig {
	maxRequests: number;
	timeWindow: number; // in milliseconds
	retryAfter: number; // in milliseconds
	enabled: boolean;
}

export interface RateLimitEntry {
	count: number;
	resetTime: number;
	blocked: boolean;
}

export class RateLimiter {
	private static instance: RateLimiter;
	private readonly limits: Map<string, RateLimitEntry> = new Map();
	private readonly configs: Map<string, RateLimitConfig> = new Map();
	private cleanupInterval: NodeJS.Timeout | null = null;

	constructor() {
		this.setupDefaultConfigs();
		this.startCleanupInterval();
	}

	public static getInstance(): RateLimiter {
		if (!RateLimiter.instance) {
			RateLimiter.instance = new RateLimiter();
		}
		return RateLimiter.instance;
	}

	private setupDefaultConfigs(): void {
		// Default rate limits for different endpoint types
		this.configs.set("default", {
			maxRequests: 100,
			timeWindow: 60 * 1000, // 1 minute
			retryAfter: 60 * 1000, // 1 minute
			enabled: true,
		});

		this.configs.set("auth", {
			maxRequests: 5,
			timeWindow: 15 * 60 * 1000, // 15 minutes
			retryAfter: 15 * 60 * 1000, // 15 minutes
			enabled: true,
		});

		this.configs.set("search", {
			maxRequests: 50,
			timeWindow: 60 * 1000, // 1 minute
			retryAfter: 10 * 1000, // 10 seconds
			enabled: true,
		});

		this.configs.set("upload", {
			maxRequests: 10,
			timeWindow: 60 * 1000, // 1 minute
			retryAfter: 60 * 1000, // 1 minute
			enabled: true,
		});

		this.configs.set("messaging", {
			maxRequests: 30,
			timeWindow: 60 * 1000, // 1 minute
			retryAfter: 10 * 1000, // 10 seconds
			enabled: true,
		});

		this.configs.set("booking", {
			maxRequests: 20,
			timeWindow: 60 * 1000, // 1 minute
			retryAfter: 30 * 1000, // 30 seconds
			enabled: true,
		});
	}

	public checkLimit(
		endpoint: string,
		clientId?: string
	): {
		allowed: boolean;
		remainingRequests: number;
		resetTime: number;
		retryAfter?: number;
	} {
		const key = this.generateKey(endpoint, clientId);
		const config = this.getConfig(endpoint);

		if (!config.enabled) {
			return {
				allowed: true,
				remainingRequests: config.maxRequests,
				resetTime: Date.now() + config.timeWindow,
			};
		}

		const now = Date.now();
		let entry = this.limits.get(key);

		// Initialize or reset if time window expired
		if (!entry || now >= entry.resetTime) {
			entry = {
				count: 0,
				resetTime: now + config.timeWindow,
				blocked: false,
			};
			this.limits.set(key, entry);
		}

		// Check if currently blocked
		if (entry.blocked && now < entry.resetTime) {
			return {
				allowed: false,
				remainingRequests: 0,
				resetTime: entry.resetTime,
				retryAfter: entry.resetTime - now,
			};
		}

		// Check if limit exceeded
		if (entry.count >= config.maxRequests) {
			entry.blocked = true;
			return {
				allowed: false,
				remainingRequests: 0,
				resetTime: entry.resetTime,
				retryAfter: config.retryAfter,
			};
		}

		// Increment counter and allow request
		entry.count++;
		this.limits.set(key, entry);

		return {
			allowed: true,
			remainingRequests: config.maxRequests - entry.count,
			resetTime: entry.resetTime,
		};
	}

	public recordRequest(endpoint: string, clientId?: string): void {
		const key = this.generateKey(endpoint, clientId);
		const entry = this.limits.get(key);

		if (entry) {
			entry.count = Math.max(0, entry.count - 1);
			this.limits.set(key, entry);
		}
	}

	private generateKey(endpoint: string, clientId?: string): string {
		const normalizedEndpoint = this.normalizeEndpoint(endpoint);
		return clientId ? `${clientId}:${normalizedEndpoint}` : normalizedEndpoint;
	}

	private normalizeEndpoint(endpoint: string): string {
		// Extract the base endpoint pattern
		if (endpoint.includes("/auth/")) return "auth";
		if (endpoint.includes("/search")) return "search";
		if (endpoint.includes("/upload")) return "upload";
		if (endpoint.includes("/messages")) return "messaging";
		if (endpoint.includes("/conversations")) return "messaging";
		if (endpoint.includes("/bookings")) return "booking";
		return "default";
	}

	private getConfig(endpoint: string): RateLimitConfig {
		const normalizedEndpoint = this.normalizeEndpoint(endpoint);
		return this.configs.get(normalizedEndpoint) || this.configs.get("default")!;
	}

	public setConfig(endpoint: string, config: Partial<RateLimitConfig>): void {
		const existing = this.configs.get(endpoint) || this.configs.get("default")!;
		this.configs.set(endpoint, { ...existing, ...config });
	}

	private startCleanupInterval(): void {
		// Clean up expired entries every 5 minutes
		this.cleanupInterval = setInterval(
			() => {
				this.cleanup();
			},
			5 * 60 * 1000
		);
	}

	private cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.limits.entries()) {
			if (now >= entry.resetTime) {
				this.limits.delete(key);
			}
		}
	}

	public reset(endpoint?: string, clientId?: string): void {
		if (endpoint && clientId) {
			const key = this.generateKey(endpoint, clientId);
			this.limits.delete(key);
		} else if (endpoint) {
			const pattern = this.normalizeEndpoint(endpoint);
			for (const key of this.limits.keys()) {
				if (key.includes(pattern)) {
					this.limits.delete(key);
				}
			}
		} else {
			this.limits.clear();
		}
	}

	public getStats(): {
		totalEntries: number;
		activeEntries: number;
		blockedEntries: number;
		configs: Record<string, RateLimitConfig>;
	} {
		const now = Date.now();
		let activeEntries = 0;
		let blockedEntries = 0;

		for (const entry of this.limits.values()) {
			if (now < entry.resetTime) {
				activeEntries++;
				if (entry.blocked) {
					blockedEntries++;
				}
			}
		}

		return {
			totalEntries: this.limits.size,
			activeEntries,
			blockedEntries,
			configs: Object.fromEntries(this.configs.entries()),
		};
	}

	public destroy(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}
		this.limits.clear();
	}
}

export default RateLimiter;
