import axios from "axios";
import type {
	AxiosInstance,
	InternalAxiosRequestConfig,
	AxiosError,
	AxiosResponse,
	AxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";
import { ErrorHandler, VibrattoApiError } from "../middleware/errorHandler";
import ApiLogger from "../middleware/logger";
import RateLimiter from "../middleware/rateLimiter";
import ApiCache from "../middleware/cache";
import { tokenRefreshService } from "../../services/tokenRefreshService";

declare module "axios" {
	export interface InternalAxiosRequestConfig {
		_retryCount?: number;
		_startTime?: number;
		_traceId?: string;
		_cacheKey?: string;
		_skipCache?: boolean;
		_skipRateLimit?: boolean;
		_skipTokenRefresh?: boolean;
	}
}

interface CacheHitError extends Error {
	isCacheHit: true;
	response: AxiosResponse;
}

// Try production URL first, fallback to localhost if needed
const PRODUCTION_URL =
	"https://apivibratto-api-ctdqdacrascbhzcz.brazilsouth-01.azurewebsites.net/api/";
const LOCALHOST_URL = "http://localhost:3001/api/";
// Allow opting in to localhost fallback explicitly via env; default is disabled
const ENABLE_LOCALHOST_FALLBACK =
	(import.meta.env["VITE_ENABLE_LOCALHOST_FALLBACK"] as string | undefined) ===
	"true";
const IS_DEV = import.meta.env.MODE === "development";
const DEFAULT_BASE_URL =
	(import.meta.env["VITE_VIBRATTO_API_BASE_URL"] as string | undefined) ??
	(IS_DEV ? "/api/" : PRODUCTION_URL);
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;

export class ApiClient {
	private readonly api: AxiosInstance;
	private readonly maxRetries: number;
	private readonly retryDelayMs: number;
	private readonly logger: ApiLogger;
	private readonly rateLimiter: RateLimiter;
	private readonly cache: ApiCache;
	private fallbackAttempted: boolean = false;

	public constructor(
		baseURL: string = DEFAULT_BASE_URL,
		maxRetries: number = DEFAULT_MAX_RETRIES,
		retryDelayMs: number = DEFAULT_RETRY_DELAY_MS
	) {
		if (typeof window === "undefined") {
			throw new Error("ApiClient can only be instantiated in the browser");
		}

		// Initialize middleware
		this.logger = ApiLogger.getInstance();
		this.rateLimiter = RateLimiter.getInstance();
		this.cache = ApiCache.getInstance();

		this.api = axios.create({
			baseURL: baseURL,
			timeout: 5 * 60 * 1000,
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
		});

		this.maxRetries = maxRetries;
		this.retryDelayMs = retryDelayMs;

		this.setupInterceptors();
	}

	private setupInterceptors(): void {
		this.api.interceptors.request.use(this.requestInterceptor);
		this.api.interceptors.response.use(
			this.responseInterceptor,
			this.errorInterceptor
		);
	}
	private readonly requestInterceptor = async (
		config: InternalAxiosRequestConfig
	): Promise<InternalAxiosRequestConfig> => {
		// Add trace ID for request tracking
		config._traceId = this.generateTraceId();
		config._startTime = Date.now();

		// Check if token needs refresh before making request
		if (!config._skipTokenRefresh && !config.url?.includes("refresh-token")) {
			if (tokenRefreshService.shouldRefreshBeforeRequest()) {
				await tokenRefreshService.refreshToken();
			}
		}

		// Auth token
		const token = Cookies.get("authToken");
		if (token) {
			config.headers = config.headers ?? {};
			config.headers["Authorization"] = `Bearer ${token}`;
		}
		// Rate limiting check
		if (!config._skipRateLimit) {
			const rateLimitResult = this.rateLimiter.checkLimit(config.url ?? "");
			if (!rateLimitResult.allowed) {
				const error = new VibrattoApiError({
					code: "RATE_LIMIT_EXCEEDED",
					message: "Rate limit exceeded. Please try again later.",
					statusCode: 429,
					timestamp: new Date().toISOString(),
				});
				throw error;
			}
		}
		// Check cache for GET requests
		if (config.method?.toLowerCase() === "get" && !config._skipCache) {
			const cacheKey = this.cache.generateKey(
				config.url ?? "",
				(config.params as Record<string, unknown>) ?? {}
			);
			config._cacheKey = cacheKey;

			const cached = this.cache.get(cacheKey);
			if (cached) {
				// Return cached response by throwing a special error that we'll catch
				const cachedResponse: AxiosResponse = {
					data: cached,
					status: 200,
					statusText: "OK",
					headers: { "x-cache": "HIT" },
					config,
				};
				const cacheError = new Error("Cache hit") as CacheHitError;
				cacheError.isCacheHit = true;
				cacheError.response = cachedResponse;
				throw cacheError;
			}
		}

		// Log request
		this.logger.logRequest(config);

		return config;
	};
	private readonly responseInterceptor = (
		response: AxiosResponse
	): AxiosResponse => {
		const config = response.config;
		const startTime = config._startTime ?? Date.now();
		const traceId = config._traceId ?? "";

		// Log response
		this.logger.logResponse(response, traceId, startTime);

		// Cache GET responses
		if (
			config.method?.toLowerCase() === "get" &&
			!config._skipCache &&
			config._cacheKey
		) {
			const ttl = this.cache.getTtlConfig(config.url ?? "");
			const etag = response.headers["etag"];
			const lastModified = response.headers["last-modified"];
			// this.cache.setWithEtag(
			// 	config._cacheKey,
			// 	response.data,
			// 	typeof etag === "string" ? etag : undefined,
			// 	typeof lastModified === "string" ? lastModified : undefined,
			// 	ttl
			// );
		}

		return response;
	};
	private readonly errorInterceptor = async (
		error: AxiosError | Error
	): Promise<AxiosResponse> => {
		// Handle cache hits
		if ("isCacheHit" in error && (error as CacheHitError).isCacheHit) {
			return Promise.resolve((error as CacheHitError).response);
		}

		// Handle actual errors
		if (axios.isAxiosError(error)) {
			const config = error.config;
			const status = error.response?.status;
			const startTime = config?._startTime ?? Date.now();
			const traceId = config?._traceId ?? "";

			// Log error
			this.logger.logError(error, traceId, startTime);

			// Process error through error handler
			const apiError = ErrorHandler.handleAxiosError(error);
			ErrorHandler.logError(apiError, `URL: ${config?.url ?? "unknown"}`); // Handle specific error cases
			if (status === 401) {
				this.handleUnauthorized();
				return Promise.reject(apiError);
			}

			// Try localhost fallback for network errors (no response or connection issues)
			if (
				ENABLE_LOCALHOST_FALLBACK &&
				!error.response &&
				!this.fallbackAttempted &&
				this.api.defaults.baseURL === PRODUCTION_URL
			) {
				console.warn(
					"Network error with production API, trying localhost fallback..."
				);
				this.switchToLocalhost();

				// Retry the same request with localhost
				if (config) {
					console.warn(`Retrying request with localhost: ${config.url}`);
					return this.api.request(config);
				}
			}

			// Retry logic for retryable errors
			if (config && ErrorHandler.isRetryableError(apiError)) {
				const retryCount = config._retryCount ?? 0;
				if (retryCount < this.maxRetries) {
					config._retryCount = retryCount + 1;
					const delay = this.retryDelayMs * Math.pow(2, retryCount);
					await new Promise<void>((resolve) => {
						setTimeout(() => {
							resolve();
						}, delay);
					});

					console.warn(
						`Request failed [${status}]. Retrying (${config._retryCount}/${this.maxRetries})... URL: ${config.url}`
					);

					return this.api.request(config);
				}
			}

			return Promise.reject(apiError);
		}

		// Handle non-Axios errors
		const genericError = ErrorHandler.handleGenericError(error);
		ErrorHandler.logError(genericError, "Non-Axios error");
		return Promise.reject(genericError);
	};
	private generateTraceId(): string {
		return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
	}
	private handleUnauthorized(): void {
		console.warn("🚫 Token expirado ou inválido, redirecionando para login...");

		// Limpar dados de autenticação
		this.clearAuth();

		// Redirecionar para login com URL atual como redirect
		const currentPath = window.location.pathname + window.location.search;
		const redirectUrl =
			currentPath !== "/login"
				? `?redirect=${encodeURIComponent(currentPath)}`
				: "";

		window.location.href = `/login${redirectUrl}`;
	}
	private clearAuth(): void {
		// Limpar token dos cookies
		Cookies.remove("authToken");

		// Limpar localStorage
		localStorage.removeItem("vibratto-auth");

		// Tentar acessar o store Zustand de forma segura
		void import("../../store/authStore")
			.then(({ useAuthStore }) => {
				const { logout } = useAuthStore.getState();
				logout();
			})
			.catch(() => {
				console.warn("Não foi possível limpar o store de auth");
			});
	}

	public setAuthToken(token: string | null): void {
		if (!token) {
			Cookies.remove("authToken");
		} else {
			// Use secure: false for localhost development
			const isLocalhost =
				window.location.hostname === "localhost" ||
				window.location.hostname === "127.0.0.1";
			Cookies.set("authToken", token, {
				secure: !isLocalhost,
				sameSite: "strict",
				expires: 7, // Token expires in 7 days
			});
		}
	}

	// Enhanced request methods with middleware support
	public async get<T>(
		url: string,
		config?: AxiosRequestConfig & {
			skipCache?: boolean;
			skipRateLimit?: boolean;
		}
	): Promise<T> {
		const requestConfig = {
			...config,
			_skipCache: config?.skipCache,
			_skipRateLimit: config?.skipRateLimit,
		};
		const response: AxiosResponse<T> = await this.api.get(url, requestConfig);
		return response.data;
	}

	public async post<T>(
		url: string,
		data?: unknown,
		config?: AxiosRequestConfig & { skipRateLimit?: boolean }
	): Promise<T> {
		const requestConfig = {
			...config,
			_skipRateLimit: config?.skipRateLimit,
		};
		const response: AxiosResponse<T> = await this.api.post(
			url,
			data,
			requestConfig
		);
		return response.data;
	}

	public async put<T>(
		url: string,
		data?: unknown,
		config?: AxiosRequestConfig & { skipRateLimit?: boolean }
	): Promise<T> {
		const requestConfig = {
			...config,
			_skipRateLimit: config?.skipRateLimit,
		};
		const response: AxiosResponse<T> = await this.api.put(
			url,
			data,
			requestConfig
		);
		return response.data;
	}

	public async delete<T>(
		url: string,
		config?: AxiosRequestConfig & { skipRateLimit?: boolean }
	): Promise<T> {
		const requestConfig = {
			...config,
			_skipRateLimit: config?.skipRateLimit,
		};
		const response: AxiosResponse<T> = await this.api.delete(
			url,
			requestConfig
		);
		return response.data;
	}

	public async patch<T>(
		url: string,
		data?: unknown,
		config?: AxiosRequestConfig & { skipRateLimit?: boolean }
	): Promise<T> {
		const requestConfig = {
			...config,
			_skipRateLimit: config?.skipRateLimit,
		};
		const response: AxiosResponse<T> = await this.api.patch(
			url,
			data,
			requestConfig
		);
		return response.data;
	}

	// Middleware access methods
	public getLogger(): ApiLogger {
		return this.logger;
	}

	public getRateLimiter(): RateLimiter {
		return this.rateLimiter;
	}

	public getCache(): ApiCache {
		return this.cache;
	}

	// Utility methods
	public clearCache(): void {
		this.cache.clear();
	}

	public getCacheStats() {
		return this.cache.getStats();
	}

	public getPerformanceStats() {
		return this.logger.getPerformanceStats();
	}

	public getRateLimitStats() {
		return this.rateLimiter.getStats();
	}

	/**
	 * Static method to create an ApiClient with automatic fallback
	 * First tries production URL, then falls back to localhost
	 */
	public static async createWithFallback(): Promise<ApiClient> {
		// First try with production URL
		const productionClient = new ApiClient(PRODUCTION_URL);

		try {
			// Test the connection with a simple health check
			await productionClient.get("/health", { skipRateLimit: true });
			return productionClient;
		} catch (error) {
			console.warn("Production API not available, trying localhost...", error);

			// Try localhost as fallback
			try {
				const localhostClient = new ApiClient(LOCALHOST_URL);
				await localhostClient.get("/health", { skipRateLimit: true });
				console.log("Connected to localhost API");
				return localhostClient;
			} catch (localhostError) {
				console.warn(
					"Localhost API also not available, using production URL anyway"
				);
				// Return production client anyway - let individual requests handle the errors
				return productionClient;
			}
		}
	}

	/**
	 * Get the base URL being used by this client
	 */
	public getBaseURL(): string {
		return this.api.defaults.baseURL || "";
	}

	/**
	 * Switch to localhost URL as fallback
	 */
	private switchToLocalhost(): void {
		if (
			ENABLE_LOCALHOST_FALLBACK &&
			!this.fallbackAttempted &&
			this.api.defaults.baseURL === PRODUCTION_URL
		) {
			console.warn("Switching from production API to localhost fallback");
			this.api.defaults.baseURL = LOCALHOST_URL;
			this.fallbackAttempted = true;
		}
	}
}

// Create and export default instance
export const apiClient = new ApiClient();
