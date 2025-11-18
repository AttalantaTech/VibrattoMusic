/**
 * Performance monitoring and analytics for Vibratto API
 */

import { PERFORMANCE_CONFIG } from "../config/environment";

export interface PerformanceMetrics {
	requestId: string;
	method: string;
	url: string;
	startTime: number;
	endTime: number;
	duration: number;
	statusCode: number;
	success: boolean;
	error?: string;
	retryCount?: number;
	cacheHit?: boolean;
	requestSize?: number;
	responseSize?: number;
	userAgent?: string;
	userId?: string;
}

export interface AnalyticsEvent {
	event: string;
	properties: Record<string, any>;
	timestamp: number;
	userId?: string;
	sessionId?: string;
}

export interface ErrorReport {
	error: Error;
	context: {
		url: string;
		method: string;
		userId?: string;
		userAgent?: string;
		timestamp: number;
	};
	severity: "low" | "medium" | "high" | "critical";
	fingerprint?: string;
}

export class PerformanceMonitor {
	private metrics: Array<PerformanceMetrics> = [];
	private readonly config =
		PERFORMANCE_CONFIG[
			process.env["NODE_ENV"] as keyof typeof PERFORMANCE_CONFIG
		] || PERFORMANCE_CONFIG.development;
	private readonly requestMap = new Map<string, Partial<PerformanceMetrics>>();

	/**
	 * Start tracking a request
	 */
	startRequest(
		requestId: string,
		method: string,
		url: string,
		options?: {
			userId?: string;
			requestSize?: number;
		}
	): void {
		if (!this.config.enableMetrics) return;

		const startTime = performance.now();
		this.requestMap.set(requestId, {
			requestId,
			method,
			url,
			startTime,
			userId: options?.userId,
			requestSize: options?.requestSize,
		});
	}

	/**
	 * End tracking a request
	 */
	endRequest(
		requestId: string,
		statusCode: number,
		options?: {
			error?: string;
			retryCount?: number;
			cacheHit?: boolean;
			responseSize?: number;
		}
	): void {
		if (!this.config.enableMetrics) return;

		const request = this.requestMap.get(requestId);
		if (!request) return;

		const endTime = performance.now();
		const duration = endTime - (request.startTime || 0);

		const metric: PerformanceMetrics = {
			...request,
			endTime,
			duration,
			statusCode,
			success: statusCode >= 200 && statusCode < 400,
			error: options?.error,
			retryCount: options?.retryCount,
			cacheHit: options?.cacheHit,
			responseSize: options?.responseSize,
			userAgent: navigator?.userAgent,
		} as PerformanceMetrics;

		this.metrics.push(metric);
		this.requestMap.delete(requestId);

		// Check for slow requests
		if (duration > this.config.slowRequestThreshold) {
			this.reportSlowRequest(metric);
		}

		// Send metrics if sampling allows
		if (Math.random() < this.config.sampleRate) {
			this.sendMetrics();
		}

		// Clean up old metrics to prevent memory leaks
		if (this.metrics.length > 1000) {
			this.metrics = this.metrics.slice(-500);
		}
	}

	/**
	 * Get performance statistics
	 */
	getStats(): {
		totalRequests: number;
		successRate: number;
		averageDuration: number;
		slowRequests: number;
		errorRate: number;
		cacheHitRate: number;
	} {
		const total = this.metrics.length;
		if (total === 0) {
			return {
				totalRequests: 0,
				successRate: 0,
				averageDuration: 0,
				slowRequests: 0,
				errorRate: 0,
				cacheHitRate: 0,
			};
		}

		const successful = this.metrics.filter((m) => m.success).length;
		const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
		const slowRequests = this.metrics.filter(
			(m) => m.duration > this.config.slowRequestThreshold
		).length;
		const errors = this.metrics.filter((m) => !m.success).length;
		const cacheHits = this.metrics.filter((m) => m.cacheHit).length;

		return {
			totalRequests: total,
			successRate: successful / total,
			averageDuration: totalDuration / total,
			slowRequests,
			errorRate: errors / total,
			cacheHitRate: cacheHits / total,
		};
	}

	/**
	 * Get metrics by endpoint
	 */
	getStatsByEndpoint(): Record<
		string,
		{
			count: number;
			averageDuration: number;
			successRate: number;
			errorRate: number;
		}
	> {
		const endpointStats: Record<
			string,
			{
				metrics: Array<PerformanceMetrics>;
				count: number;
				averageDuration: number;
				successRate: number;
				errorRate: number;
			}
		> = {};

		this.metrics.forEach((metric) => {
			const endpoint = this.normalizeEndpoint(metric.url);
			if (!endpointStats[endpoint]) {
				endpointStats[endpoint] = {
					metrics: [],
					count: 0,
					averageDuration: 0,
					successRate: 0,
					errorRate: 0,
				};
			}

			endpointStats[endpoint].metrics.push(metric);
		}); // Calculate stats for each endpoint
		Object.keys(endpointStats).forEach((endpoint) => {
			const stats = endpointStats[endpoint];
			if (!stats) return;

			const metrics = stats.metrics;
			const total = metrics.length;

			stats.count = total;
			stats.averageDuration =
				metrics.reduce((sum, m) => sum + m.duration, 0) / total;
			stats.successRate = metrics.filter((m) => m.success).length / total;
			stats.errorRate = metrics.filter((m) => !m.success).length / total;

			// Remove metrics array to clean up response
			delete (stats as any).metrics;
		});

		return endpointStats;
	}

	/**
	 * Clear all metrics
	 */
	public clearMetrics(): void {
		this.metrics = [];
		this.requestMap.clear();
	}

	private reportSlowRequest(metric: PerformanceMetrics): void {
		console.warn(
			`Slow request detected: ${metric.method} ${metric.url} took ${metric.duration.toFixed(2)}ms`
		);

		// Could send to monitoring service
		/* this.sendAnalyticsEvent("slow_request", {
			method: metric.method,
			url: metric.url,
			duration: metric.duration,
			statusCode: metric.statusCode,
		}); */
	}

	private normalizeEndpoint(url: string): string {
		// Remove query parameters and replace IDs with placeholders
		if (!url) return "";
		return (
			url
				.split("?")[0]
				?.replace(/\/\d+/g, "/:id")
				.replace(/\/[a-f0-9-]{36}/g, "/:uuid") || ""
		);
	}
	private sendMetrics(): void {
		try {
			// In a real implementation, this would send to your analytics service
			if (process.env["NODE_ENV"] === "development") {
				// Performance metrics logging disabled
			}

			// Example: Send to analytics service
			// await fetch('/api/v1/analytics/performance', {
			//   method: 'POST',
			//   headers: { 'Content-Type': 'application/json' },
			//   body: JSON.stringify({ metrics })
			// });
		} catch (error) {
			console.error("Failed to send performance metrics:", error);
		}
	}

	/* 	private sendAnalyticsEvent(
		event: string,
		properties: Record<string, any>
	): void {
		const analyticsEvent: AnalyticsEvent = {
			event,
			properties,
			timestamp: Date.now(),
			sessionId: this.getSessionId(),
		};

		// Send to analytics service
		// analytics.track(analyticsEvent);
	} */
}

export class ErrorReporter {
	private errors: Array<ErrorReport> = [];

	/**
	 * Report an error
	 */
	public reportError(
		error: Error,
		context: {
			url: string;
			method: string;
			userId?: string;
		},
		severity: "low" | "medium" | "high" | "critical" = "medium"
	): void {
		const errorReport: ErrorReport = {
			error,
			context: {
				...context,
				userAgent: navigator?.userAgent,
				timestamp: Date.now(),
			},
			severity,
			fingerprint: this.generateErrorFingerprint(error, context),
		};

		this.errors.push(errorReport);

		// Send critical errors immediately
		if (severity === "critical") {
			void this.sendErrorReport(errorReport);
		}

		// Clean up old errors
		if (this.errors.length > 100) {
			this.errors = this.errors.slice(-50);
		}
	}

	/**
	 * Get error statistics
	 */
	getErrorStats(): {
		totalErrors: number;
		errorsByType: Record<string, number>;
		errorsBySeverity: Record<string, number>;
		topErrors: Array<{
			fingerprint: string;
			count: number;
			lastOccurrence: number;
		}>;
	} {
		const total = this.errors.length;
		const errorsByType: Record<string, number> = {};
		const errorsBySeverity: Record<string, number> = {};
		const errorCounts: Record<
			string,
			{ count: number; lastOccurrence: number }
		> = {};

		this.errors.forEach((errorReport) => {
			// Count by error type
			const errorType = errorReport.error.constructor.name;
			errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;

			// Count by severity
			errorsBySeverity[errorReport.severity] =
				(errorsBySeverity[errorReport.severity] || 0) + 1; // Count by fingerprint
			if (errorReport.fingerprint) {
				if (!errorCounts[errorReport.fingerprint]) {
					errorCounts[errorReport.fingerprint] = {
						count: 0,
						lastOccurrence: 0,
					};
				}
				const errorData = errorCounts[errorReport.fingerprint]!;
				errorData.count++;
				errorData.lastOccurrence = Math.max(
					errorData.lastOccurrence,
					errorReport.context.timestamp
				);
			}
		});

		const topErrors = Object.entries(errorCounts)
			.map(([fingerprint, data]) => ({ fingerprint, ...data }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		return {
			totalErrors: total,
			errorsByType,
			errorsBySeverity,
			topErrors,
		};
	}

	private generateErrorFingerprint(
		error: Error,
		context: { url: string; method: string }
	): string {
		const key = `${error.name}_${error.message}_${context.method}_${context.url}`;
		return btoa(key)
			.replace(/[^a-zA-Z0-9]/g, "")
			.substr(0, 16);
	}
	private async sendErrorReport(errorReport: ErrorReport): Promise<void> {
		try {
			// In a real implementation, this would send to your error tracking service
			if (process.env["NODE_ENV"] === "development") {
				console.error("Error report:", errorReport);
			}

			// Example: Send to error tracking service
			// await fetch('/api/v1/analytics/errors', {
			//   method: 'POST',
			//   headers: { 'Content-Type': 'application/json' },
			//   body: JSON.stringify(errorReport)
			// });
		} catch (error) {
			console.error("Failed to send error report:", error);
		}
	}
}

export class AnalyticsTracker {
	private events: Array<AnalyticsEvent> = [];
	private userId: string | null = null;
	private readonly sessionId: string;

	constructor() {
		this.sessionId = this.generateSessionId();
	}

	/**
	 * Set current user ID
	 */
	setUserId(userId: string): void {
		this.userId = userId;
	}

	/**
	 * Track an event
	 */
	track(event: string, properties: Record<string, any> = {}): void {
		const analyticsEvent: AnalyticsEvent = {
			event,
			properties: {
				...properties,
				sessionId: this.sessionId,
				url: window.location.href,
				referrer: document.referrer,
				userAgent: navigator.userAgent,
			},
			timestamp: Date.now(),
			userId: this.userId || undefined,
			sessionId: this.sessionId,
		};

		this.events.push(analyticsEvent);

		// Send event
		this.sendEvent();

		// Clean up old events
		if (this.events.length > 100) {
			this.events = this.events.slice(-50);
		}
	}

	/**
	 * Track page view
	 */
	trackPageView(page: string, properties: Record<string, any> = {}): void {
		this.track("page_view", {
			page,
			title: document.title,
			...properties,
		});
	}

	/**
	 * Track user action
	 */
	trackUserAction(
		action: string,
		target: string,
		properties: Record<string, any> = {}
	): void {
		this.track("user_action", {
			action,
			target,
			...properties,
		});
	}

	/**
	 * Track API request
	 */
	trackApiRequest(
		method: string,
		endpoint: string,
		success: boolean,
		duration: number
	): void {
		this.track("api_request", {
			method,
			endpoint,
			success,
			duration,
		});
	}

	/**
	 * Track business event
	 */
	trackBusinessEvent(
		event: string,
		properties: Record<string, any> = {}
	): void {
		this.track(`business_${event}`, properties);
	}

	private generateSessionId(): string {
		let sessionId = sessionStorage.getItem("vibratto_session_id");
		if (!sessionId) {
			sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			sessionStorage.setItem("vibratto_session_id", sessionId);
		}
		return sessionId;
	}

	private async sendEvent(): Promise<void> {
		try {
			// In a real implementation, this would send to your analytics service
			if (process.env["NODE_ENV"] === "development") {
				// Analytics event logging disabled
			}

			// Example: Send to analytics service
			// await fetch('/api/v1/analytics/events', {
			//   method: 'POST',
			//   headers: { 'Content-Type': 'application/json' },
			//   body: JSON.stringify(event)
			// });
		} catch (error) {
			console.error("Failed to send analytics event:", error);
		}
	}
}

// Singleton instances
let performanceMonitor: PerformanceMonitor | null = null;
let errorReporter: ErrorReporter | null = null;
let analyticsTracker: AnalyticsTracker | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
	if (!performanceMonitor) {
		performanceMonitor = new PerformanceMonitor();
	}
	return performanceMonitor;
}

export function getErrorReporter(): ErrorReporter {
	if (!errorReporter) {
		errorReporter = new ErrorReporter();
	}
	return errorReporter;
}

export function getAnalyticsTracker(): AnalyticsTracker {
	if (!analyticsTracker) {
		analyticsTracker = new AnalyticsTracker();
	}
	return analyticsTracker;
}

// Utility function to generate request ID
export function generateRequestId(): string {
	return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// React hook for performance monitoring
export function usePerformanceMonitoring() {
	const monitor = getPerformanceMonitor();
	const reporter = getErrorReporter();
	const analytics = getAnalyticsTracker();

	return {
		startRequest: monitor.startRequest.bind(monitor),
		endRequest: monitor.endRequest.bind(monitor),
		getStats: monitor.getStats.bind(monitor),
		reportError: reporter.reportError.bind(reporter),
		track: analytics.track.bind(analytics),
		trackPageView: analytics.trackPageView.bind(analytics),
		trackUserAction: analytics.trackUserAction.bind(analytics),
	};
}
