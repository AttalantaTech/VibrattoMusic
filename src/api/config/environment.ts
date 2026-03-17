/**
 * Environment-specific configurations for Vibratto API
 */

export interface EnvironmentConfig {
	apiBaseUrl: string;
	timeout: number;
	retryConfig: {
		maxRetries: number;
		retryDelay: number;
		retryCondition: (error: any) => boolean;
	};
	rateLimit: {
		maxRequests: number;
		windowMs: number;
		retryAfterMs: number;
	};
	cache: {
		ttl: number;
		maxSize: number;
		enabled: boolean;
	};
	logging: {
		enabled: boolean;
		level: "error" | "warn" | "info" | "debug";
		sensitiveFields: Array<string>;
	};
	security: {
		enableCsrf: boolean;
		corsOrigins: Array<string>;
		trustProxy: boolean;
	};
	features: {
		enableRealtime: boolean;
		enableAnalytics: boolean;
		enableFileUpload: boolean;
		maxFileSize: number;
	};
}

// Development Environment
export const developmentConfig: EnvironmentConfig = {
	apiBaseUrl:
		import.meta.env["VITE_VIBRATTO_API_BASE_URL"] || "http://localhost:3001",
	timeout: 10000,
	retryConfig: {
		maxRetries: 2,
		retryDelay: 1000,
		retryCondition: (error: any) => {
			return (
				error.code === "NETWORK_ERROR" ||
				error.code === "TIMEOUT_ERROR" ||
				(error.status >= 500 && error.status < 600)
			);
		},
	},
	rateLimit: {
		maxRequests: 100,
		windowMs: 60000, // 1 minute
		retryAfterMs: 5000,
	},
	cache: {
		ttl: 300000, // 5 minutes
		maxSize: 100,
		enabled: true,
	},
	logging: {
		enabled: true,
		level: "debug",
		sensitiveFields: [
			"password",
			"token",
			"authorization",
			"cookie",
			"x-api-key",
		],
	},
	security: {
		enableCsrf: false,
		corsOrigins: ["http://localhost:3000", "http://localhost:3001"],
		trustProxy: false,
	},
	features: {
		enableRealtime: true,
		enableAnalytics: false,
		enableFileUpload: true,
		maxFileSize: 10 * 1024 * 1024, // 10MB
	},
};

// Staging Environment
export const stagingConfig: EnvironmentConfig = {
	apiBaseUrl: process.env["VITE_VIBRATTO_API_BASE_URL"] ?? "",
	timeout: 15000,
	retryConfig: {
		maxRetries: 3,
		retryDelay: 2000,
		retryCondition: (error: any) => {
			return (
				error.code === "NETWORK_ERROR" ||
				error.code === "TIMEOUT_ERROR" ||
				(error.status >= 500 && error.status < 600)
			);
		},
	},
	rateLimit: {
		maxRequests: 200,
		windowMs: 60000, // 1 minute
		retryAfterMs: 10000,
	},
	cache: {
		ttl: 600000, // 10 minutes
		maxSize: 200,
		enabled: true,
	},
	logging: {
		enabled: true,
		level: "info",
		sensitiveFields: [
			"password",
			"token",
			"authorization",
			"cookie",
			"x-api-key",
			"refresh_token",
			"client_secret",
		],
	},
	security: {
		enableCsrf: true,
		corsOrigins: ["https://staging.vibratto.com"],
		trustProxy: true,
	},
	features: {
		enableRealtime: true,
		enableAnalytics: true,
		enableFileUpload: true,
		maxFileSize: 20 * 1024 * 1024, // 20MB
	},
};

// Production Environment
export const productionConfig: EnvironmentConfig = {
	apiBaseUrl: process.env["VITE_VIBRATTO_API_BASE_URL"] ?? "",
	timeout: 20000,
	retryConfig: {
		maxRetries: 5,
		retryDelay: 3000,
		retryCondition: (error: any) => {
			// More conservative retry policy in production
			return (
				error.code === "NETWORK_ERROR" ||
				error.code === "TIMEOUT_ERROR" ||
				error.status === 502 ||
				error.status === 503 ||
				error.status === 504
			);
		},
	},
	rateLimit: {
		maxRequests: 500,
		windowMs: 60000, // 1 minute
		retryAfterMs: 30000,
	},
	cache: {
		ttl: 900000, // 15 minutes
		maxSize: 500,
		enabled: true,
	},
	logging: {
		enabled: true,
		level: "warn",
		sensitiveFields: [
			"password",
			"token",
			"authorization",
			"cookie",
			"x-api-key",
			"refresh_token",
			"client_secret",
			"access_token",
			"session_id",
		],
	},
	security: {
		enableCsrf: true,
		corsOrigins: ["https://vibratto.com", "https://www.vibratto.com"],
		trustProxy: true,
	},
	features: {
		enableRealtime: true,
		enableAnalytics: true,
		enableFileUpload: true,
		maxFileSize: 50 * 1024 * 1024, // 50MB
	},
};

// Test Environment
export const testConfig: EnvironmentConfig = {
	apiBaseUrl: "http://localhost:3001",
	timeout: 5000,
	retryConfig: {
		maxRetries: 0, // No retries in tests for faster execution
		retryDelay: 100,
		retryCondition: () => false,
	},
	rateLimit: {
		maxRequests: 1000, // High limit for tests
		windowMs: 60000,
		retryAfterMs: 100,
	},
	cache: {
		ttl: 60000, // 1 minute
		maxSize: 50,
		enabled: false, // Disable cache in tests
	},
	logging: {
		enabled: false, // Reduce noise in test output
		level: "error",
		sensitiveFields: ["password", "token", "authorization"],
	},
	security: {
		enableCsrf: false,
		corsOrigins: ["*"],
		trustProxy: false,
	},
	features: {
		enableRealtime: false,
		enableAnalytics: false,
		enableFileUpload: true,
		maxFileSize: 5 * 1024 * 1024, // 5MB
	},
};

/**
 * Get configuration based on environment
 */
export function getEnvironmentConfig(): EnvironmentConfig {
	const env = process.env["NODE_ENV"] || "development";

	switch (env) {
		case "production":
			return productionConfig;
		case "staging":
			return stagingConfig;
		case "test":
			return testConfig;
		case "development":
		default:
			return developmentConfig;
	}
}

/**
 * Validate environment configuration
 */
export function validateConfig(config: EnvironmentConfig): void {
	const requiredFields = [
		"apiBaseUrl",
		"timeout",
		"retryConfig",
		"rateLimit",
		"cache",
		"logging",
		"security",
		"features",
	];

	for (const field of requiredFields) {
		if (!(field in config)) {
			throw new Error(`Missing required configuration field: ${field}`);
		}
	}

	if (!config.apiBaseUrl || !config.apiBaseUrl.startsWith("http")) {
		throw new Error("Invalid API base URL");
	}

	if (config.timeout <= 0) {
		throw new Error("Timeout must be greater than 0");
	}

	if (config.retryConfig.maxRetries < 0) {
		throw new Error("Max retries cannot be negative");
	}

	if (config.rateLimit.maxRequests <= 0) {
		throw new Error("Max requests must be greater than 0");
	}

	if (config.cache.ttl <= 0) {
		throw new Error("Cache TTL must be greater than 0");
	}

	if (config.features.maxFileSize <= 0) {
		throw new Error("Max file size must be greater than 0");
	}
}

/**
 * Merge user configuration with environment defaults
 */
export function mergeConfig(
	userConfig: Partial<EnvironmentConfig> = {}
): EnvironmentConfig {
	const envConfig = getEnvironmentConfig();

	const merged = {
		...envConfig,
		...userConfig,
		retryConfig: {
			...envConfig.retryConfig,
			...(userConfig.retryConfig || {}),
		},
		rateLimit: {
			...envConfig.rateLimit,
			...(userConfig.rateLimit || {}),
		},
		cache: {
			...envConfig.cache,
			...(userConfig.cache || {}),
		},
		logging: {
			...envConfig.logging,
			...(userConfig.logging || {}),
		},
		security: {
			...envConfig.security,
			...(userConfig.security || {}),
		},
		features: {
			...envConfig.features,
			...(userConfig.features || {}),
		},
	};

	validateConfig(merged);
	return merged;
}

/**
 * Environment-specific API endpoints
 */
export const API_ENDPOINTS = {
	// Authentication
	LOGIN: "/api/v1/auth/login",
	LOGOUT: "/api/v1/auth/logout",
	REGISTER: "/api/v1/auth/register",
	REFRESH_TOKEN: "/api/v1/auth/refresh",
	FORGOT_PASSWORD: "/api/v1/auth/forgot-password",
	RESET_PASSWORD: "/api/v1/auth/reset-password",
	VERIFY_EMAIL: "/api/v1/auth/verify-email",

	// Users
	USER_PROFILE: "/api/v1/users/profile",
	UPDATE_PROFILE: "/api/v1/users/profile",
	USER_PREFERENCES: "/api/v1/users/preferences",
	USER_FAVORITES: "/api/v1/users/favorites",
	DELETE_ACCOUNT: "/api/v1/users/account",

	// Musical Products
	MUSICAL_PRODUCTS: "/api/v1/musical-products",
	PRODUCT_SEARCH: "/api/v1/musical-products/search",
	PRODUCT_CATEGORIES: "/api/v1/musical-products/categories",
	PRODUCT_RATINGS: "/api/v1/musical-products/:id/ratings",
	PRODUCT_MEDIA: "/api/v1/musical-products/:id/media",

	// Bookings
	BOOKINGS: "/api/v1/bookings",
	BOOKING_CALENDAR: "/api/v1/bookings/calendar",
	BOOKING_AVAILABILITY: "/api/v1/bookings/availability",
	BOOKING_HISTORY: "/api/v1/bookings/history",

	// Messaging
	CONVERSATIONS: "/api/conversa",
	MESSAGES: "/api/mensagem",
	NOTIFICATIONS: "/api/v1/notifications",

	// Utilities
	LOCATIONS: "/api/v1/utilities/locations",
	FILE_UPLOAD: "/api/v1/utilities/files/upload",
	SYSTEM_STATUS: "/api/v1/utilities/status",
	APP_CONFIG: "/api/v1/utilities/config",

	// WebSocket
	WEBSOCKET: "/ws",
} as const;

/**
 * Feature flags based on environment
 */
export function getFeatureFlags(): Record<string, boolean> {
	const config = getEnvironmentConfig();

	return {
		ENABLE_REALTIME: config.features.enableRealtime,
		ENABLE_ANALYTICS: config.features.enableAnalytics,
		ENABLE_FILE_UPLOAD: config.features.enableFileUpload,
		ENABLE_CACHE: config.cache.enabled,
		ENABLE_LOGGING: config.logging.enabled,
		ENABLE_CSRF: config.security.enableCsrf,
		TRUST_PROXY: config.security.trustProxy,
	};
}

/**
 * Performance monitoring configuration
 */
export const PERFORMANCE_CONFIG = {
	development: {
		enableMetrics: true,
		sampleRate: 1.0,
		slowRequestThreshold: 1000,
		enableTracing: true,
	},
	staging: {
		enableMetrics: true,
		sampleRate: 0.5,
		slowRequestThreshold: 500,
		enableTracing: true,
	},
	production: {
		enableMetrics: true,
		sampleRate: 0.1,
		slowRequestThreshold: 300,
		enableTracing: false,
	},
	test: {
		enableMetrics: false,
		sampleRate: 0,
		slowRequestThreshold: 10000,
		enableTracing: false,
	},
} as const;
