// API Client and Services
export { ApiClient } from "./core/client";

// Services
export { UserService } from "./services/userService";
export { FilterService } from "./services/filterService";
export { MusicalProductService } from "./services/musicalProductService";
export { DocumentService } from "./services/documentService";
export { BookingService } from "./services/bookingService";
export { HiringService } from "./services/hiringService";
export { MessagingService } from "./services/messagingService";
export { UtilityService } from "./services/utilityService";
export { OnboardingService } from "./services/onboardingService";
export { EventService } from "./services/eventService";
export { proposalService } from "./services/proposalService";
export { ImageUploadService } from "./services/imageUploadService";

// WebSocket Integration
export {
	WebSocketClient,
	getWebSocketService,
	WEBSOCKET_EVENTS,
} from "./websocket/client";
export type {
	WebSocketMessage,
	WebSocketConfig,
	WebSocketEventType,
} from "./websocket/client";

// Validation Schemas
export {
	validateSchema,
	validateSchemaAsync,
	createValidationMiddleware,
	getSchema,
	validateByKey,
	SCHEMA_REGISTRY,
} from "./validation/schemas";
export type { SchemaKey } from "./validation/schemas";

// API Versioning
export {
	ApiVersionManager,
	getApiVersionManager,
	createVersionInterceptor,
	API_VERSIONS,
	FEATURES,
} from "./versioning/apiVersion";
export type {
	ApiVersion,
	SupportedApiVersion,
	Feature,
} from "./versioning/apiVersion";

// Integration Verification
export {
	verifyApiIntegration,
	ApiIntegrationVerifier,
} from "./verification/integrationVerifier";

// Performance Monitoring
export {
	PerformanceMonitor,
	ErrorReporter,
	AnalyticsTracker,
	getPerformanceMonitor,
	getErrorReporter,
	getAnalyticsTracker,
	generateRequestId,
	usePerformanceMonitoring,
} from "./monitoring/performance";
export type {
	PerformanceMetrics,
	AnalyticsEvent,
	ErrorReport,
} from "./monitoring/performance";

// Environment Configuration
export {
	getEnvironmentConfig,
	validateConfig,
	mergeConfig,
	getFeatureFlags,
	developmentConfig,
	stagingConfig,
	productionConfig,
	testConfig,
	API_ENDPOINTS,
	PERFORMANCE_CONFIG,
} from "./config/environment";
export type { EnvironmentConfig } from "./config/environment";

// Middleware
export {
	ErrorHandler,
	VibrattoApiError,
	ApiErrorBoundary,
} from "./middleware/errorHandler";
export type { ApiError } from "./middleware/errorHandler";
export { default as logger } from "./middleware/logger";
export { default as rateLimiter } from "./middleware/rateLimiter";
export { default as cache } from "./middleware/cache";

// Types
// Note: Individual type exports are handled by each service module

// API Instance
import { ApiClient } from "./core/client";
import { UserService } from "./services/userService";
import { FilterService } from "./services/filterService";
import { MusicalProductService } from "./services/musicalProductService";
import { DocumentService } from "./services/documentService";
import { BookingService } from "./services/bookingService";
import { HiringService } from "./services/hiringService";
import { MessagingService } from "./services/messagingService";
import { UtilityService } from "./services/utilityService";
import { OnboardingService } from "./services/onboardingService";
import { EventService } from "./services/eventService";
import { ImageUploadService } from "./services/imageUploadService";
import { getWebSocketService } from "./websocket/client";
import {
	getPerformanceMonitor,
	getErrorReporter,
	getAnalyticsTracker,
} from "./monitoring/performance";
import { getApiVersionManager } from "./versioning/apiVersion";

// Create API client instance
const apiClient = new ApiClient();

// Create service instances
export const userService = new UserService(apiClient);
export const filterService = new FilterService(apiClient);
export const musicalProductService = new MusicalProductService(apiClient);
export const documentService = new DocumentService(apiClient);
export const bookingService = new BookingService(apiClient);
export const hiringService = new HiringService(apiClient);
export const messagingService = new MessagingService(apiClient);
export const utilityService = new UtilityService(apiClient);
export const onboardingService = new OnboardingService(apiClient);
export const eventService = new EventService(apiClient);
export const imageUploadService = new ImageUploadService(apiClient);

// WebSocket service instance
export const webSocketService = getWebSocketService({ url: "chatHub" });

// Monitoring service instances
export const performanceMonitor = getPerformanceMonitor();
export const errorReporter = getErrorReporter();
export const analyticsTracker = getAnalyticsTracker();

// API versioning manager instance
export const apiVersionManager = getApiVersionManager();

// Export API client for direct access if needed
export const api = apiClient;
