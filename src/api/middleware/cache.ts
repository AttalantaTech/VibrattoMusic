export interface CacheConfig {
	enabled: boolean;
	defaultTtl: number; // Time to live in milliseconds
	maxSize: number; // Maximum number of entries
	compressionEnabled: boolean;
	persistToStorage: boolean;
	storagePrefix: string;
}

export interface CacheEntry<T = unknown> {
	data: T;
	timestamp: number;
	ttl: number;
	hits: number;
	size: number;
	compressed: boolean;
	etag?: string;
	lastModified?: string;
}

export interface CacheStats {
	totalEntries: number;
	totalSize: number;
	hitRate: number;
	expiredEntries: number;
	averageAge: number;
}

export class ApiCache {
	private static instance: ApiCache;
	private readonly cache: Map<string, CacheEntry> = new Map();
	private config: CacheConfig;
	private cleanupInterval: NodeJS.Timeout | null = null;
	private readonly stats = {
		hits: 0,
		misses: 0,
		sets: 0,
		deletes: 0,
	};

	constructor(config: Partial<CacheConfig> = {}) {
		this.config = {
			enabled: true,
			defaultTtl: 5 * 60 * 1000, // 5 minutes
			maxSize: 1000,
			compressionEnabled: false,
			persistToStorage: false,
			storagePrefix: "vibratto_api_cache_",
			...config,
		};

		this.loadFromStorage();
		this.startCleanupInterval();
	}

	public static getInstance(config?: Partial<CacheConfig>): ApiCache {
		if (!ApiCache.instance) {
			ApiCache.instance = new ApiCache(config);
		}
		return ApiCache.instance;
	}

	public get<T>(key: string): T | null {
		if (!this.config.enabled) {
			return null;
		}

		const entry = this.cache.get(key);
		if (!entry) {
			this.stats.misses++;
			return null;
		}

		// Check if expired
		if (this.isExpired(entry)) {
			this.delete(key);
			this.stats.misses++;
			return null;
		}

		// Update hit count
		entry.hits++;
		this.stats.hits++;

		return this.decompressData(entry.data, entry.compressed);
	}

	public set<T>(key: string, data: T, ttl?: number): void {
		if (!this.config.enabled) {
			return;
		}

		const actualTtl = ttl || this.config.defaultTtl;
		const compressedData = this.compressData(data);
		const entry: CacheEntry<T> = {
			data: compressedData.data,
			timestamp: Date.now(),
			ttl: actualTtl,
			hits: 0,
			size: this.calculateSize(compressedData.data),
			compressed: compressedData.compressed,
		};

		// Check if we need to make space
		if (this.cache.size >= this.config.maxSize) {
			this.evictLeastRecentlyUsed();
		}

		this.cache.set(key, entry);
		this.stats.sets++;

		if (this.config.persistToStorage) {
			this.saveToStorage(key, entry);
		}
	}

	public delete(key: string): boolean {
		const deleted = this.cache.delete(key);
		if (deleted) {
			this.stats.deletes++;
			if (this.config.persistToStorage) {
				this.removeFromStorage(key);
			}
		}
		return deleted;
	}

	public has(key: string): boolean {
		const entry = this.cache.get(key);
		return entry ? !this.isExpired(entry) : false;
	}

	public clear(): void {
		this.cache.clear();
		if (this.config.persistToStorage) {
			this.clearStorage();
		}
	}

	public invalidatePattern(pattern: string | RegExp): number {
		let invalidated = 0;
		const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;

		for (const key of this.cache.keys()) {
			if (regex.test(key)) {
				this.delete(key);
				invalidated++;
			}
		}

		return invalidated;
	}

	public getWithEtag<T>(
		key: string,
		etag?: string
	): { data: T | null; fresh: boolean } {
		const entry = this.cache.get(key);

		if (!entry || this.isExpired(entry)) {
			return { data: null, fresh: false };
		}

		if (etag && entry.etag === etag) {
			entry.hits++;
			this.stats.hits++;
			return { data: null, fresh: true }; // Data hasn't changed
		}

		entry.hits++;
		this.stats.hits++;
		return {
			data: this.decompressData(entry.data, entry.compressed),
			fresh: false,
		};
	}

	public setWithEtag<T>(
		key: string,
		data: T,
		etag?: string,
		lastModified?: string,
		ttl?: number
	): void {
		if (!this.config.enabled) {
			return;
		}

		const actualTtl = ttl || this.config.defaultTtl;
		const compressedData = this.compressData(data);
		const entry: CacheEntry<T> = {
			data: compressedData.data,
			timestamp: Date.now(),
			ttl: actualTtl,
			hits: 0,
			size: this.calculateSize(compressedData.data),
			compressed: compressedData.compressed,
			etag,
			lastModified,
		};

		if (this.cache.size >= this.config.maxSize) {
			this.evictLeastRecentlyUsed();
		}

		this.cache.set(key, entry);
		this.stats.sets++;

		if (this.config.persistToStorage) {
			this.saveToStorage(key, entry);
		}
	}

	public generateKey(url: string, parameters?: Record<string, any>): string {
		const normalizedUrl = url.toLowerCase();
		if (!parameters) {
			return normalizedUrl;
		}

		// Sort parameters for consistent key generation
		const sortedParameters = Object.keys(parameters)
			.sort()
			.map((key) => `${key}=${JSON.stringify(parameters[key])}`)
			.join("&");

		return `${normalizedUrl}?${sortedParameters}`;
	}

	public getTtlConfig(endpoint: string): number {
		// Different TTL for different types of endpoints
		if (endpoint.includes("/search")) return 2 * 60 * 1000; // 2 minutes
		if (endpoint.includes("/products")) return 10 * 60 * 1000; // 10 minutes
		if (endpoint.includes("/users/profile")) return 30 * 60 * 1000; // 30 minutes
		if (endpoint.includes("/categories")) return 60 * 60 * 1000; // 1 hour
		if (endpoint.includes("/locations")) return 24 * 60 * 60 * 1000; // 24 hours
		if (endpoint.includes("/messages")) return 30 * 1000; // 30 seconds
		if (endpoint.includes("/notifications")) return 60 * 1000; // 1 minute

		return this.config.defaultTtl;
	}

	private isExpired(entry: CacheEntry): boolean {
		return Date.now() - entry.timestamp > entry.ttl;
	}

	private compressData(data: any): { data: any; compressed: boolean } {
		if (!this.config.compressionEnabled || typeof data !== "object") {
			return { data, compressed: false };
		}

		try {
			// Simple compression by removing whitespace from JSON
			const jsonString = JSON.stringify(data);
			const compressed = jsonString.replace(/\s+/g, "");

			// Only compress if we save significant space
			if (compressed.length < jsonString.length * 0.8) {
				return { data: compressed, compressed: true };
			}
		} catch (error) {
			// Compression failed, return original data
		}

		return { data, compressed: false };
	}

	private decompressData(data: any, compressed: boolean): any {
		if (!compressed) {
			return data;
		}

		try {
			return JSON.parse(data);
		} catch (error) {
			console.warn("Failed to decompress cached data:", error);
			return data;
		}
	}

	private calculateSize(data: any): number {
		try {
			return JSON.stringify(data).length;
		} catch (error) {
			return 0;
		}
	}

	private evictLeastRecentlyUsed(): void {
		let lruKey: string | null = null;
		let oldestTime = Date.now();
		let lowestHits = Infinity;

		for (const [key, entry] of this.cache.entries()) {
			// Priority: expired entries first, then by hits, then by age
			if (this.isExpired(entry)) {
				this.delete(key);
				return;
			}

			if (
				entry.hits < lowestHits ||
				(entry.hits === lowestHits && entry.timestamp < oldestTime)
			) {
				lruKey = key;
				oldestTime = entry.timestamp;
				lowestHits = entry.hits;
			}
		}

		if (lruKey) {
			this.delete(lruKey);
		}
	}

	private startCleanupInterval(): void {
		// Clean up expired entries every minute
		this.cleanupInterval = setInterval(() => {
			this.cleanup();
		}, 60 * 1000);
	}

	private cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > entry.ttl) {
				this.delete(key);
			}
		}
	}

	private loadFromStorage(): void {
		if (!this.config.persistToStorage || typeof localStorage === "undefined") {
			return;
		}

		try {
			for (let index = 0; index < localStorage.length; index++) {
				const key = localStorage.key(index);
				if (key?.startsWith(this.config.storagePrefix)) {
					const cacheKey = key.substring(this.config.storagePrefix.length);
					const data = localStorage.getItem(key);
					if (data) {
						const entry = JSON.parse(data) as CacheEntry;
						if (!this.isExpired(entry)) {
							this.cache.set(cacheKey, entry);
						} else {
							localStorage.removeItem(key);
						}
					}
				}
			}
		} catch (error) {
			console.warn("Failed to load cache from storage:", error);
		}
	}

	private saveToStorage(key: string, entry: CacheEntry): void {
		if (typeof localStorage === "undefined") {
			return;
		}

		try {
			const storageKey = this.config.storagePrefix + key;
			localStorage.setItem(storageKey, JSON.stringify(entry));
		} catch (error) {
			console.warn("Failed to save cache to storage:", error);
		}
	}

	private removeFromStorage(key: string): void {
		if (typeof localStorage === "undefined") {
			return;
		}

		try {
			const storageKey = this.config.storagePrefix + key;
			localStorage.removeItem(storageKey);
		} catch (error) {
			console.warn("Failed to remove cache from storage:", error);
		}
	}

	private clearStorage(): void {
		if (typeof localStorage === "undefined") {
			return;
		}

		try {
			const keysToRemove: Array<string> = [];
			for (let index = 0; index < localStorage.length; index++) {
				const key = localStorage.key(index);
				if (key?.startsWith(this.config.storagePrefix)) {
					keysToRemove.push(key);
				}
			}
			keysToRemove.forEach((key) => {
				localStorage.removeItem(key);
			});
		} catch (error) {
			console.warn("Failed to clear cache from storage:", error);
		}
	}

	public getStats(): CacheStats & typeof this.stats {
		const now = Date.now();
		let expiredEntries = 0;
		let totalAge = 0;
		let totalSize = 0;

		for (const entry of this.cache.values()) {
			totalSize += entry.size;
			totalAge += now - entry.timestamp;

			if (this.isExpired(entry)) {
				expiredEntries++;
			}
		}

		const totalRequests = this.stats.hits + this.stats.misses;
		const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
		const averageAge = this.cache.size > 0 ? totalAge / this.cache.size : 0;

		return {
			...this.stats,
			totalEntries: this.cache.size,
			totalSize,
			hitRate,
			expiredEntries,
			averageAge,
		};
	}

	public updateConfig(config: Partial<CacheConfig>): void {
		this.config = { ...this.config, ...config };
	}

	public destroy(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}
		this.clear();
	}
}

export default ApiCache;
