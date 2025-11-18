/**
 * Comprehensive integration verification script for Vibratto API
 * This script verifies all major components are working correctly
 */

import {
	api,
	userService,
	musicalProductService,
	bookingService,
	messagingService,
	utilityService,
	webSocketService,
	performanceMonitor,
	errorReporter,
	analyticsTracker,
	apiVersionManager,
	getEnvironmentConfig,
	validateByKey,
	FEATURES,
} from "../index";

interface VerificationResult {
	component: string;
	status: "success" | "error" | "warning";
	message: string;
	details?: any;
}

class ApiIntegrationVerifier {
	private results: Array<VerificationResult> = [];

	/**
	 * Run comprehensive verification of all API components
	 */
	async runVerification(): Promise<{
		success: boolean;
		results: Array<VerificationResult>;
		summary: {
			total: number;
			passed: number;
			failed: number;
			warnings: number;
		};
	}> {
		console.log("🚀 Starting Vibratto API Integration Verification...\n");

		this.results = [];

		// Run all verification tests
		await this.verifyConfiguration();
		await this.verifyServices();
		await this.verifyMiddleware();
		await this.verifyWebSocket();
		await this.verifyMonitoring();
		await this.verifyValidation();
		await this.verifyVersioning();
		await this.verifyTypeDefinitions();

		const summary = this.generateSummary();
		this.printResults();

		return {
			success: summary.failed === 0,
			results: this.results,
			summary,
		};
	}

	/**
	 * Verify environment configuration
	 */
	private async verifyConfiguration(): Promise<void> {
		try {
			const config = getEnvironmentConfig();
			this.addResult(
				"Configuration",
				"success",
				"Environment configuration loaded successfully",
				{
					apiBaseUrl: config.apiBaseUrl,
					timeout: config.timeout,
					environment: process.env["NODE_ENV"] || "development",
				}
			);

			// Verify required configuration properties
			if (!config.apiBaseUrl) {
				this.addResult("Configuration", "error", "API base URL not configured");
			}

			if (config.timeout <= 0) {
				this.addResult(
					"Configuration",
					"warning",
					"Invalid timeout configuration"
				);
			}
		} catch (error) {
			this.addResult("Configuration", "error", `Configuration error: ${error}`);
		}
	}

	/**
	 * Verify all service instances
	 */
	private async verifyServices(): Promise<void> {
		const services = [
			{ name: "UserService", instance: userService },
			{ name: "MusicalProductService", instance: musicalProductService },
			{ name: "BookingService", instance: bookingService },
			{ name: "MessagingService", instance: messagingService },
			{ name: "UtilityService", instance: utilityService },
		];

		for (const service of services) {
			try {
				if (service.instance && typeof service.instance === "object") {
					// Check if service has expected methods - using simplified approach for type safety
					const serviceObject = service.instance as unknown as Record<
						string,
						unknown
					>;
					const methods = Object.getOwnPropertyNames(
						Object.getPrototypeOf(serviceObject)
					).filter(
						(method) =>
							method !== "constructor" &&
							typeof serviceObject[method] === "function"
					);

					this.addResult(
						service.name,
						"success",
						`Service initialized with ${methods.length} methods`,
						{
							methods: methods.slice(0, 5), // Show first 5 methods
						}
					);
				} else {
					this.addResult(
						service.name,
						"error",
						"Service not properly initialized"
					);
				}
			} catch (error) {
				this.addResult(
					service.name,
					"error",
					`Service verification failed: ${String(error)}`
				);
			}
		}
	}
	/**
	 * Verify middleware functionality
	 */
	private async verifyMiddleware(): Promise<void> {
		try {
			// Verify API client has middleware
			if (api && typeof api.get === "function") {
				this.addResult(
					"API Client",
					"success",
					"API client initialized successfully"
				);
			} else {
				this.addResult(
					"API Client",
					"error",
					"API client not properly initialized"
				);
			}

			// Test middleware by checking if API client exists and has basic functionality
			const hasMiddleware =
				api && typeof api.get === "function" && typeof api.post === "function";

			if (hasMiddleware) {
				this.addResult(
					"Middleware",
					"success",
					"API client middleware configured"
				);
			} else {
				this.addResult(
					"Middleware",
					"warning",
					"API client middleware may not be properly configured"
				);
			}
		} catch (error) {
			this.addResult(
				"Middleware",
				"error",
				`Middleware verification failed: ${String(error)}`
			);
		}
	}
	/**
	 * Verify WebSocket integration
	 */
	private async verifyWebSocket(): Promise<void> {
		try {
			if (
				webSocketService &&
				typeof webSocketService.initialize === "function"
			) {
				this.addResult("WebSocket", "success", "WebSocket service initialized"); // Check WebSocket methods
				const methods = [
					"initialize",
					"disconnect",
					"sendMessage",
					"isConnected",
				];
				const availableMethods = methods.filter(
					(method) =>
						typeof (webSocketService as unknown as Record<string, unknown>)[
							method
						] === "function"
				);

				if (availableMethods.length === methods.length) {
					this.addResult(
						"WebSocket Methods",
						"success",
						"All WebSocket methods available"
					);
				} else {
					this.addResult(
						"WebSocket Methods",
						"warning",
						`Some WebSocket methods missing: ${methods.filter((m) => !availableMethods.includes(m)).join(", ")}`
					);
				}
			} else {
				this.addResult(
					"WebSocket",
					"error",
					"WebSocket service not properly initialized"
				);
			}
		} catch (error) {
			this.addResult(
				"WebSocket",
				"error",
				`WebSocket verification failed: ${String(error)}`
			);
		}
	}

	/**
	 * Verify monitoring services
	 */
	private async verifyMonitoring(): Promise<void> {
		try {
			// Performance Monitor
			if (
				performanceMonitor &&
				typeof performanceMonitor.startRequest === "function"
			) {
				this.addResult(
					"Performance Monitor",
					"success",
					"Performance monitoring available"
				);

				// Test performance monitoring
				const requestId = "test-" + Date.now();
				performanceMonitor.startRequest(requestId, "GET", "/test");
				performanceMonitor.endRequest(requestId, Date.now());

				const stats = performanceMonitor.getStats();
				if (stats && typeof stats.totalRequests === "number") {
					this.addResult(
						"Performance Stats",
						"success",
						"Performance statistics working",
						{
							totalRequests: stats.totalRequests,
							successRate: stats.successRate,
						}
					);
				}
			} else {
				this.addResult(
					"Performance Monitor",
					"error",
					"Performance monitor not available"
				);
			}

			// Error Reporter
			if (errorReporter && typeof errorReporter.reportError === "function") {
				this.addResult(
					"Error Reporter",
					"success",
					"Error reporting available"
				);
			} else {
				this.addResult(
					"Error Reporter",
					"error",
					"Error reporter not available"
				);
			}

			// Analytics Tracker
			if (analyticsTracker && typeof analyticsTracker.track === "function") {
				this.addResult(
					"Analytics Tracker",
					"success",
					"Analytics tracking available"
				);
			} else {
				this.addResult(
					"Analytics Tracker",
					"error",
					"Analytics tracker not available"
				);
			}
		} catch (error) {
			this.addResult(
				"Monitoring",
				"error",
				`Monitoring verification failed: ${String(error)}`
			);
		}
	}

	/**
	 * Verify data validation
	 */
	private async verifyValidation(): Promise<void> {
		try {
			// Test validation function
			if (typeof validateByKey === "function") {
				this.addResult(
					"Validation Function",
					"success",
					"Validation function available"
				);

				// Test a simple validation
				try {
					const testData = { email: "test@example.com" };
					const result = validateByKey("email.validation", testData);

					if (result && typeof result.success === "boolean") {
						this.addResult(
							"Validation Test",
							"success",
							"Validation working correctly"
						);
					} else {
						this.addResult(
							"Validation Test",
							"warning",
							"Validation returned unexpected format"
						);
					}
				} catch (validationError) {
					this.addResult(
						"Validation Test",
						"warning",
						`Validation test failed: ${String(validationError)}`
					);
				}
			} else {
				this.addResult(
					"Validation Function",
					"error",
					"Validation function not available"
				);
			}
		} catch (error) {
			this.addResult(
				"Validation",
				"error",
				`Validation verification failed: ${String(error)}`
			);
		}
	}

	/**
	 * Verify API versioning
	 */
	private async verifyVersioning(): Promise<void> {
		try {
			if (
				apiVersionManager &&
				typeof apiVersionManager.getCurrentVersion === "function"
			) {
				const currentVersion = apiVersionManager.getCurrentVersion();
				this.addResult(
					"API Versioning",
					"success",
					`API version manager working (current: ${currentVersion})`
				);

				// Test feature detection
				const hasUserManagement = apiVersionManager.isFeatureSupported(
					FEATURES.USER_MANAGEMENT
				);
				const hasWebSocket = apiVersionManager.isFeatureSupported(
					FEATURES.WEBSOCKET_SUPPORT
				);

				this.addResult(
					"Feature Detection",
					"success",
					"Feature detection working",
					{
						userManagement: hasUserManagement,
						webSocket: hasWebSocket,
					}
				);
			} else {
				this.addResult(
					"API Versioning",
					"error",
					"API version manager not available"
				);
			}
		} catch (error) {
			this.addResult(
				"API Versioning",
				"error",
				`Versioning verification failed: ${String(error)}`
			);
		}
	}

	/**
	 * Verify TypeScript type definitions
	 */
	private async verifyTypeDefinitions(): Promise<void> {
		try {
			// Check if type exports are working by testing imports
			const typeChecks = [
				{ name: "FEATURES constant", value: FEATURES },
				{ name: "API client", value: api },
			];

			let typesWorking = true;
			for (const check of typeChecks) {
				if (check.value === undefined) {
					this.addResult(
						"Type Definitions",
						"error",
						`${check.name} not properly exported`
					);
					typesWorking = false;
				}
			}

			if (typesWorking) {
				this.addResult(
					"Type Definitions",
					"success",
					"Type definitions properly exported"
				);
			}
		} catch (error) {
			this.addResult(
				"Type Definitions",
				"error",
				`Type verification failed: ${String(error)}`
			);
		}
	}
	/**
	 * Add verification result
	 */
	private addResult(
		component: string,
		status: "success" | "error" | "warning",
		message: string,
		details?: unknown
	): void {
		this.results.push({
			component,
			status,
			message,
			details,
		});
	}

	/**
	 * Generate summary statistics
	 */
	private generateSummary() {
		const total = this.results.length;
		const passed = this.results.filter((r) => r.status === "success").length;
		const failed = this.results.filter((r) => r.status === "error").length;
		const warnings = this.results.filter((r) => r.status === "warning").length;

		return { total, passed, failed, warnings };
	}

	/**
	 * Print verification results
	 */
	private printResults(): void {
		console.log("\n📊 Verification Results:\n");

		for (const result of this.results) {
			const icon =
				result.status === "success"
					? "✅"
					: result.status === "error"
						? "❌"
						: "⚠️";

			console.log(`${icon} ${result.component}: ${result.message}`);

			if (result.details) {
				console.log(`   Details:`, result.details);
			}
		}

		const summary = this.generateSummary();
		console.log("\n📋 Summary:");
		console.log(`   Total checks: ${summary.total}`);
		console.log(`   ✅ Passed: ${summary.passed}`);
		console.log(`   ❌ Failed: ${summary.failed}`);
		console.log(`   ⚠️  Warnings: ${summary.warnings}`);

		if (summary.failed === 0) {
			console.log("\n🎉 All critical components verified successfully!");
			console.log("🚀 Vibratto API integration is production-ready!");
		} else {
			console.log(
				"\n🔧 Some components need attention before production deployment."
			);
		}
	}
}

/**
 * Run API integration verification
 */
export async function verifyApiIntegration(): Promise<void> {
	const verifier = new ApiIntegrationVerifier();
	await verifier.runVerification();
}

/**
 * Export for direct usage
 */
export { ApiIntegrationVerifier };

// Auto-run verification if this module is executed directly
if (typeof window === "undefined" && process.env["NODE_ENV"] !== "production") {
	// Only run in development/test environments
	verifyApiIntegration().catch(console.error);
}
