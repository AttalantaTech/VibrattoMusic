import type { AxiosRequestConfig, AxiosResponse } from "axios";

export interface LogEntry {
	id: string;
	timestamp: string;
	type: "request" | "response" | "error";
	method?: string;
	url?: string;
	status?: number;
	duration?: number;
	size?: number;
	headers?: Record<string, string>;
	data?: any;
	error?: any;
	userAgent?: string;
	sessionId?: string;
	userId?: string;
	traceId?: string;
}

export interface LoggerConfig {
	enabled: boolean;
	logLevel: "debug" | "info" | "warn" | "error";
	logRequests: boolean;
	logResponses: boolean;
	logHeaders: boolean;
	logData: boolean;
	sensitiveHeaders: Array<string>;
	sensitiveFields: Array<string>;
	maxDataSize: number;
	enablePerformanceTracking: boolean;
	enableNetworkMetrics: boolean;
}

export class ApiLogger {
	private static instance: ApiLogger;
	private config: LoggerConfig;
	private logs: Array<LogEntry> = [];
	private readonly maxLogs = 1000;
	private performanceObserver?: PerformanceObserver;
	constructor(config: Partial<LoggerConfig> = {}) {
		this.config = {
			enabled: process.env["NODE_ENV"] === "development",
			logLevel: "info",
			logRequests: true,
			logResponses: true,
			logHeaders: false,
			logData: true,
			sensitiveHeaders: [
				"authorization",
				"cookie",
				"set-cookie",
				"x-api-key",
				"x-auth-token",
			],
			sensitiveFields: [
				"password",
				"token",
				"secret",
				"key",
				"authorization",
				"credit_card",
				"cvv",
				"ssn",
			],
			maxDataSize: 10000, // 10KB max for logged data
			enablePerformanceTracking: true,
			enableNetworkMetrics: true,
			...config,
		};

		this.initializePerformanceTracking();
	}

	public static getInstance(config?: Partial<LoggerConfig>): ApiLogger {
		if (!ApiLogger.instance) {
			ApiLogger.instance = new ApiLogger(config);
		}
		return ApiLogger.instance;
	}

	private initializePerformanceTracking(): void {
		if (
			!this.config.enablePerformanceTracking ||
			typeof window === "undefined"
		) {
			return;
		}

		try {
			this.performanceObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry) => {
					if (
						entry.entryType === "navigation" ||
						entry.entryType === "resource"
					) {
						this.logPerformanceEntry(entry);
					}
				});
			});

			this.performanceObserver.observe({
				entryTypes: ["navigation", "resource", "measure"],
			});
		} catch (error) {
			console.warn("Performance tracking not supported:", error);
		}
	}

	private logPerformanceEntry(entry: PerformanceEntry): void {
		if (!this.config.enabled) return;

		const logEntry: LogEntry = {
			id: this.generateId(),
			timestamp: new Date().toISOString(),
			type: "request",
			url: (entry as any).name,
			duration: entry.duration,
			size: (entry as any).transferSize || 0,
		};

		this.addLog(logEntry);
	}

	public logRequest(config: AxiosRequestConfig): string {
		if (!this.config.enabled || !this.config.logRequests) {
			return this.generateId();
		}

		const traceId = this.generateId();
		const sanitizedHeaders = this.sanitizeHeaders(config.headers || {});
		const sanitizedData = this.sanitizeData(config.data);

		const logEntry: LogEntry = {
			id: traceId,
			timestamp: new Date().toISOString(),
			type: "request",
			method: config.method?.toUpperCase(),
			url: this.sanitizeUrl(config.url || ""),
			headers: this.config.logHeaders ? sanitizedHeaders : undefined,
			data: this.config.logData ? sanitizedData : undefined,
			userAgent:
				typeof window !== "undefined" ? window.navigator.userAgent : undefined,
			sessionId: this.getSessionId(),
			userId: this.getUserId(),
			traceId,
		};

		this.addLog(logEntry);
		this.logToConsole("request", logEntry);

		return traceId;
	}

	public logResponse(
		response: AxiosResponse,
		traceId: string,
		startTime: number
	): void {
		if (!this.config.enabled || !this.config.logResponses) {
			return;
		}

		const duration = Date.now() - startTime;
		const sanitizedHeaders = this.sanitizeHeaders(response.headers || {});
		const sanitizedData = this.sanitizeData(response.data);
		const responseSize = this.calculateResponseSize(response);

		const logEntry: LogEntry = {
			id: this.generateId(),
			timestamp: new Date().toISOString(),
			type: "response",
			method: response.config.method?.toUpperCase(),
			url: this.sanitizeUrl(response.config.url || ""),
			status: response.status,
			duration,
			size: responseSize,
			headers: this.config.logHeaders ? sanitizedHeaders : undefined,
			data: this.config.logData ? sanitizedData : undefined,
			traceId,
		};

		this.addLog(logEntry);
		this.logToConsole("response", logEntry);

		// Track performance metrics
		if (this.config.enablePerformanceTracking) {
			this.trackPerformanceMetrics(logEntry);
		}
	}

	public logError(error: any, traceId: string, startTime: number): void {
		if (!this.config.enabled) {
			return;
		}

		const duration = Date.now() - startTime;
		const sanitizedError = this.sanitizeData(error);

		const logEntry: LogEntry = {
			id: this.generateId(),
			timestamp: new Date().toISOString(),
			type: "error",
			method: error.config?.method?.toUpperCase(),
			url: this.sanitizeUrl(error.config?.url || ""),
			status: error.response?.status,
			duration,
			error: sanitizedError,
			traceId,
		};

		this.addLog(logEntry);
		this.logToConsole("error", logEntry);
	}

	private sanitizeHeaders(
		headers: Record<string, any>
	): Record<string, string> {
		const sanitized: Record<string, string> = {};

		Object.entries(headers).forEach(([key, value]) => {
			const lowerKey = key.toLowerCase();
			if (this.config.sensitiveHeaders.includes(lowerKey)) {
				sanitized[key] = "[REDACTED]";
			} else {
				sanitized[key] = String(value);
			}
		});

		return sanitized;
	}

	private sanitizeData(data: any): any {
		if (!data) return data;

		try {
			const serialized = JSON.stringify(data);
			if (serialized.length > this.config.maxDataSize) {
				return `[DATA TOO LARGE: ${serialized.length} bytes]`;
			}

			return this.sanitizeObject(JSON.parse(serialized));
		} catch (error) {
			return "[UNSERIALIZABLE DATA]";
		}
	}

	private sanitizeObject(object: any): any {
		if (typeof object !== "object" || object === null) {
			return object;
		}

		if (Array.isArray(object)) {
			return object.map((item) => this.sanitizeObject(item));
		}

		const sanitized: any = {};
		Object.entries(object).forEach(([key, value]) => {
			const lowerKey = key.toLowerCase();
			if (
				this.config.sensitiveFields.some((field) => lowerKey.includes(field))
			) {
				sanitized[key] = "[REDACTED]";
			} else if (typeof value === "object") {
				sanitized[key] = this.sanitizeObject(value);
			} else {
				sanitized[key] = value;
			}
		});

		return sanitized;
	}

	private sanitizeUrl(url: string): string {
		try {
			const urlObject = new URL(url, "http://localhost");

			// Remove sensitive query parameters
			const sensitiveParameters = [
				"token",
				"key",
				"secret",
				"password",
				"auth",
			];
			sensitiveParameters.forEach((parameter) => {
				if (urlObject.searchParams.has(parameter)) {
					urlObject.searchParams.set(parameter, "[REDACTED]");
				}
			});

			return urlObject.pathname + urlObject.search;
		} catch (error) {
			return url;
		}
	}

	private calculateResponseSize(response: AxiosResponse): number {
		try {
			const contentLength = response.headers["content-length"];
			if (contentLength) {
				return parseInt(contentLength, 10);
			}

			// Estimate size from data
			if (response.data) {
				return JSON.stringify(response.data).length;
			}

			return 0;
		} catch (error) {
			return 0;
		}
	}

	private trackPerformanceMetrics(logEntry: LogEntry): void {
		if (!logEntry.duration || !logEntry.url) return;

		// Track slow requests (>1s)
		if (logEntry.duration > 1000) {
			console.warn(
				`Slow API request detected: ${logEntry.url} took ${logEntry.duration}ms`
			);
		}

		// Track large responses (>1MB)
		if (logEntry.size && logEntry.size > 1024 * 1024) {
			console.warn(
				`Large API response detected: ${logEntry.url} returned ${logEntry.size} bytes`
			);
		}

		// Log performance metrics in development
		if (process.env["NODE_ENV"] === "development") {
			// Performance metrics logging disabled
		}
	}

	private addLog(logEntry: LogEntry): void {
		this.logs.push(logEntry);

		// Keep only the last N logs to prevent memory leaks
		if (this.logs.length > this.maxLogs) {
			this.logs = this.logs.slice(-this.maxLogs);
		}
	}

	private logToConsole(type: string, logEntry: LogEntry): void {
		if (!this.config.enabled) return;

		const style = this.getConsoleStyle(type, logEntry.status);
		const message = this.formatConsoleMessage(logEntry);

		switch (this.config.logLevel) {
			case "debug":
				// Debug logging disabled
				break;
			case "info":
				if (type !== "request") {
					// Info logging disabled
				}
				break;
			case "warn":
				if (logEntry.status && logEntry.status >= 400) {
					console.warn(message, style);
				}
				break;
			case "error":
				if (type === "error") {
					console.error(message, style, logEntry.error);
				}
				break;
		}
	}

	private getConsoleStyle(type: string, status?: number): string {
		if (type === "error") return "color: #ff4444; font-weight: bold;";
		if (status && status >= 400) return "color: #ff8800; font-weight: bold;";
		if (status && status >= 300) return "color: #ffaa00;";
		if (status && status >= 200) return "color: #44aa44;";
		return "color: #4488cc;";
	}

	private formatConsoleMessage(logEntry: LogEntry): string {
		const parts = [
			`[${logEntry.type.toUpperCase()}]`,
			logEntry.method,
			logEntry.url,
		];

		if (logEntry.status) {
			parts.push(`${logEntry.status}`);
		}

		if (logEntry.duration) {
			parts.push(`${logEntry.duration}ms`);
		}

		if (logEntry.size) {
			parts.push(`${this.formatBytes(logEntry.size)}`);
		}

		return parts.filter(Boolean).join(" ");
	}

	private formatBytes(bytes: number): string {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const index = Math.floor(Math.log(bytes) / Math.log(k));
		return (
			parseFloat((bytes / Math.pow(k, index)).toFixed(1)) + " " + sizes[index]
		);
	}

	private generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private getSessionId(): string | undefined {
		if (typeof window === "undefined") return undefined;
		return sessionStorage.getItem("sessionId") || undefined;
	}

	private getUserId(): string | undefined {
		if (typeof window === "undefined") return undefined;
		try {
			const user = localStorage.getItem("user");
			return user ? (JSON.parse(user) as { id?: string }).id : undefined;
		} catch {
			return undefined;
		}
	}

	// Public methods for accessing logs
	public getLogs(type?: LogEntry["type"]): Array<LogEntry> {
		if (type) {
			return this.logs.filter((log) => log.type === type);
		}
		return [...this.logs];
	}

	public getLogsByUrl(url: string): Array<LogEntry> {
		return this.logs.filter((log) => log.url?.includes(url));
	}

	public getLogsByTimeRange(start: Date, end: Date): Array<LogEntry> {
		return this.logs.filter((log) => {
			const logTime = new Date(log.timestamp);
			return logTime >= start && logTime <= end;
		});
	}

	public clearLogs(): void {
		this.logs = [];
	}

	public exportLogs(): string {
		return JSON.stringify(this.logs, null, 2);
	}

	public getPerformanceStats(): {
		averageResponseTime: number;
		slowestRequest: LogEntry | null;
		fastestRequest: LogEntry | null;
		errorRate: number;
		totalRequests: number;
	} {
		const responseLogs = this.logs.filter(
			(log) => log.type === "response" && log.duration !== undefined
		);

		if (responseLogs.length === 0) {
			return {
				averageResponseTime: 0,
				slowestRequest: null,
				fastestRequest: null,
				errorRate: 0,
				totalRequests: 0,
			};
		}

		const durations = responseLogs.map((log) => log.duration!);
		const averageResponseTime =
			durations.reduce((a, b) => a + b, 0) / durations.length;

		const slowestRequest = responseLogs.reduce((slowest, current) =>
			current.duration! > slowest.duration! ? current : slowest
		);

		const fastestRequest = responseLogs.reduce((fastest, current) =>
			current.duration! < fastest.duration! ? current : fastest
		);

		const errorLogs = this.logs.filter(
			(log) => log.type === "error" || (log.status && log.status >= 400)
		);

		const errorRate = errorLogs.length / responseLogs.length;

		return {
			averageResponseTime,
			slowestRequest,
			fastestRequest,
			errorRate,
			totalRequests: responseLogs.length,
		};
	}

	public updateConfig(config: Partial<LoggerConfig>): void {
		this.config = { ...this.config, ...config };
	}

	public destroy(): void {
		if (this.performanceObserver) {
			this.performanceObserver.disconnect();
		}
		this.clearLogs();
	}
}

export default ApiLogger;
