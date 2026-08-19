import type { AxiosError, AxiosResponse } from "axios";

interface Data {
	erros: Array<string>;
}

export interface ApiError {
	code: string;
	message: string;
	statusCode: number;
	data?: Data | undefined;
	timestamp: string;
	traceId?: string;
}

export class VibrattoApiError extends Error {
	public readonly code: string;
	public readonly statusCode: number;
	public readonly data?: Data | undefined;
	public readonly timestamp: string;
	public readonly traceId?: string;

	constructor(error: ApiError) {
		super(error.message);
		this.name = "VibrattoApiError";
		this.code = error.code;
		this.statusCode = error.statusCode;
		this.data = error.data;
		this.timestamp = error.timestamp;
		this.traceId = error.traceId;
	}
}

export class ErrorHandler {
	public static readonly ERROR_CODES = {
		// Authentication Errors (401)
		INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
		TOKEN_EXPIRED: "TOKEN_EXPIRED",
		TOKEN_INVALID: "TOKEN_INVALID",
		UNAUTHORIZED: "UNAUTHORIZED",

		// Authorization Errors (403)
		FORBIDDEN: "FORBIDDEN",
		INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
		ACCOUNT_DISABLED: "ACCOUNT_DISABLED",

		// Validation Errors (400)
		VALIDATION_ERROR: "VALIDATION_ERROR",
		INVALID_REQUEST: "INVALID_REQUEST",
		MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
		INVALID_FORMAT: "INVALID_FORMAT",

		// Resource Errors (404, 409)
		RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
		RESOURCE_ALREADY_EXISTS: "RESOURCE_ALREADY_EXISTS",
		CONFLICT: "CONFLICT",

		// Rate Limiting (429)
		RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

		// Server Errors (500+)
		INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
		SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
		GATEWAY_TIMEOUT: "GATEWAY_TIMEOUT",

		// Network Errors
		NETWORK_ERROR: "NETWORK_ERROR",
		TIMEOUT: "TIMEOUT",
		CONNECTION_REFUSED: "CONNECTION_REFUSED",

		// Application Errors
		BOOKING_CONFLICT: "BOOKING_CONFLICT",
		INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
		PRODUCT_UNAVAILABLE: "PRODUCT_UNAVAILABLE",
		INVALID_BOOKING_STATUS: "INVALID_BOOKING_STATUS",
		CONVERSATION_NOT_FOUND: "CONVERSATION_NOT_FOUND",
		MESSAGE_SEND_FAILED: "MESSAGE_SEND_FAILED",
		FILE_UPLOAD_FAILED: "FILE_UPLOAD_FAILED",
		INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
		FILE_TOO_LARGE: "FILE_TOO_LARGE",
		LOCATION_NOT_FOUND: "LOCATION_NOT_FOUND",
		CEP_INVALID: "CEP_INVALID",
	} as const;

	public static readonly ERROR_MESSAGES = {
		[ErrorHandler.ERROR_CODES.INVALID_CREDENTIALS]: "Invalid email or password",
		[ErrorHandler.ERROR_CODES.TOKEN_EXPIRED]:
			"Your session has expired. Please log in again",
		[ErrorHandler.ERROR_CODES.TOKEN_INVALID]: "Invalid authentication token",
		[ErrorHandler.ERROR_CODES.UNAUTHORIZED]:
			"You are not authorized to access this resource",
		[ErrorHandler.ERROR_CODES.FORBIDDEN]: "Access denied",
		[ErrorHandler.ERROR_CODES.INSUFFICIENT_PERMISSIONS]:
			"You do not have permission to perform this action",
		[ErrorHandler.ERROR_CODES.ACCOUNT_DISABLED]:
			"Your account has been disabled",
		[ErrorHandler.ERROR_CODES.VALIDATION_ERROR]:
			"Please check your input and try again",
		[ErrorHandler.ERROR_CODES.INVALID_REQUEST]: "Invalid request format",
		[ErrorHandler.ERROR_CODES.MISSING_REQUIRED_FIELD]:
			"Required field is missing",
		[ErrorHandler.ERROR_CODES.INVALID_FORMAT]: "Invalid data format",
		[ErrorHandler.ERROR_CODES.RESOURCE_NOT_FOUND]:
			"The requested resource was not found",
		[ErrorHandler.ERROR_CODES.RESOURCE_ALREADY_EXISTS]:
			"Resource already exists",
		[ErrorHandler.ERROR_CODES.CONFLICT]: "Request conflicts with current state",
		[ErrorHandler.ERROR_CODES.RATE_LIMIT_EXCEEDED]:
			"Too many requests. Please try again later",
		[ErrorHandler.ERROR_CODES.INTERNAL_SERVER_ERROR]:
			"An unexpected error occurred. Please try again",
		[ErrorHandler.ERROR_CODES.SERVICE_UNAVAILABLE]:
			"Service is temporarily unavailable",
		[ErrorHandler.ERROR_CODES.GATEWAY_TIMEOUT]:
			"Request timeout. Please try again",
		[ErrorHandler.ERROR_CODES.NETWORK_ERROR]: "Network connection error",
		[ErrorHandler.ERROR_CODES.TIMEOUT]: "Request timeout",
		[ErrorHandler.ERROR_CODES.CONNECTION_REFUSED]: "Connection refused",
		[ErrorHandler.ERROR_CODES.BOOKING_CONFLICT]:
			"This time slot is no longer available",
		[ErrorHandler.ERROR_CODES.INSUFFICIENT_BALANCE]:
			"Insufficient account balance",
		[ErrorHandler.ERROR_CODES.PRODUCT_UNAVAILABLE]:
			"This product is currently unavailable",
		[ErrorHandler.ERROR_CODES.INVALID_BOOKING_STATUS]:
			"Invalid booking status for this operation",
		[ErrorHandler.ERROR_CODES.CONVERSATION_NOT_FOUND]: "Conversation not found",
		[ErrorHandler.ERROR_CODES.MESSAGE_SEND_FAILED]: "Failed to send message",
		[ErrorHandler.ERROR_CODES.FILE_UPLOAD_FAILED]: "File upload failed",
		[ErrorHandler.ERROR_CODES.INVALID_FILE_TYPE]: "Invalid file type",
		[ErrorHandler.ERROR_CODES.FILE_TOO_LARGE]:
			"File size exceeds maximum limit",
		[ErrorHandler.ERROR_CODES.LOCATION_NOT_FOUND]: "Location not found",
		[ErrorHandler.ERROR_CODES.CEP_INVALID]: "Invalid CEP format",
	};

	public static handleAxiosError(error: AxiosError): VibrattoApiError {
		const timestamp = new Date().toISOString();

		// Network errors (no response)
		if (!error.response) {
			if (error.code === "ECONNREFUSED") {
				return new VibrattoApiError({
					code: ErrorHandler.ERROR_CODES.CONNECTION_REFUSED,
					message:
						ErrorHandler.ERROR_MESSAGES[
							ErrorHandler.ERROR_CODES.CONNECTION_REFUSED
						],
					statusCode: 0,
					timestamp,
				});
			}

			if (
				error.code === "ENOTFOUND" ||
				error.message.includes("Network Error")
			) {
				return new VibrattoApiError({
					code: ErrorHandler.ERROR_CODES.NETWORK_ERROR,
					message:
						ErrorHandler.ERROR_MESSAGES[ErrorHandler.ERROR_CODES.NETWORK_ERROR],
					statusCode: 0,
					timestamp,
				});
			}

			if (error.code === "ETIMEDOUT" || error.message.includes("timeout")) {
				return new VibrattoApiError({
					code: ErrorHandler.ERROR_CODES.TIMEOUT,
					message:
						ErrorHandler.ERROR_MESSAGES[ErrorHandler.ERROR_CODES.TIMEOUT],
					statusCode: 0,
					timestamp,
				});
			}

			return new VibrattoApiError({
				code: ErrorHandler.ERROR_CODES.NETWORK_ERROR,
				message:
					error.message ||
					ErrorHandler.ERROR_MESSAGES[ErrorHandler.ERROR_CODES.NETWORK_ERROR],
				statusCode: 0,
				timestamp,
			});
		}
		const response = error.response;
		const statusCode = response.status;
		const responseData = response.data as Data;

		// Try to extract error information from response
		const errorData = responseData as
			| {
					code?: string;
					message?: string;
					mensagem?: string;
					error?: { code?: string; message?: string; mensagem?: string };
					traceId?: string;
			  }
			| undefined;

		const errorCode =
			errorData?.code ||
			errorData?.error?.code ||
			ErrorHandler.getDefaultErrorCode(statusCode);
		const errorMessage =
			errorData?.message ||
			errorData?.mensagem ||
			errorData?.error?.message ||
			errorData?.error?.mensagem ||
			ErrorHandler.getDefaultErrorMessage(statusCode);
		const traceId = errorData?.traceId || response.headers["x-trace-id"];

		return new VibrattoApiError({
			code: errorCode,
			message: errorMessage,
			statusCode,
			data: responseData,
			timestamp,
			traceId,
		});
	}

	public static handleGenericError(error: Error): VibrattoApiError {
		const timestamp = new Date().toISOString();

		if (error instanceof VibrattoApiError) {
			return error;
		}

		return new VibrattoApiError({
			code: ErrorHandler.ERROR_CODES.INTERNAL_SERVER_ERROR,
			message:
				error.message ||
				ErrorHandler.ERROR_MESSAGES[
					ErrorHandler.ERROR_CODES.INTERNAL_SERVER_ERROR
				],
			statusCode: 500,
			timestamp,
		});
	}

	private static getDefaultErrorCode(statusCode: number): string {
		switch (statusCode) {
			case 400:
				return ErrorHandler.ERROR_CODES.INVALID_REQUEST;
			case 401:
				return ErrorHandler.ERROR_CODES.UNAUTHORIZED;
			case 403:
				return ErrorHandler.ERROR_CODES.FORBIDDEN;
			case 404:
				return ErrorHandler.ERROR_CODES.RESOURCE_NOT_FOUND;
			case 409:
				return ErrorHandler.ERROR_CODES.CONFLICT;
			case 429:
				return ErrorHandler.ERROR_CODES.RATE_LIMIT_EXCEEDED;
			case 500:
				return ErrorHandler.ERROR_CODES.INTERNAL_SERVER_ERROR;
			case 502:
			case 503:
				return ErrorHandler.ERROR_CODES.SERVICE_UNAVAILABLE;
			case 504:
				return ErrorHandler.ERROR_CODES.GATEWAY_TIMEOUT;
			default:
				return ErrorHandler.ERROR_CODES.INTERNAL_SERVER_ERROR;
		}
	}
	private static getDefaultErrorMessage(statusCode: number): string {
		const errorCode = ErrorHandler.getDefaultErrorCode(statusCode);
		return (
			ErrorHandler.ERROR_MESSAGES[
				errorCode as keyof typeof ErrorHandler.ERROR_MESSAGES
			] || "An unexpected error occurred"
		);
	}

	public static isRetryableError(error: VibrattoApiError): boolean {
		const retryableCodes = [
			ErrorHandler.ERROR_CODES.NETWORK_ERROR,
			ErrorHandler.ERROR_CODES.TIMEOUT,
			ErrorHandler.ERROR_CODES.CONNECTION_REFUSED,
			ErrorHandler.ERROR_CODES.INTERNAL_SERVER_ERROR,
			ErrorHandler.ERROR_CODES.SERVICE_UNAVAILABLE,
			ErrorHandler.ERROR_CODES.GATEWAY_TIMEOUT,
		];

		const retryableStatusCodes = [500, 502, 503, 504];

		return (
			retryableCodes.includes(error.code) ||
			retryableStatusCodes.includes(error.statusCode)
		);
	}

	public static shouldRefreshToken(error: VibrattoApiError): boolean {
		return error.code === ErrorHandler.ERROR_CODES.TOKEN_EXPIRED;
	}
	public static getUserFriendlyMessage(error: VibrattoApiError): string {
		// Return user-friendly message if available in our mappings
		const message =
			ErrorHandler.ERROR_MESSAGES[
				error.code as keyof typeof ErrorHandler.ERROR_MESSAGES
			];
		if (message) {
			return message;
		}

		// Fallback to the original message
		return error.message;
	}

	public static logError(error: VibrattoApiError, context?: string): void {
		const logData = {
			error: {
				code: error.code,
				message: error.message,
				statusCode: error.statusCode,
				timestamp: error.timestamp,
				traceId: error.traceId,
				data: error.data,
			},
			context,
			userAgent:
				typeof window !== "undefined" ? window.navigator.userAgent : undefined,
			url: typeof window !== "undefined" ? window.location.href : undefined,
		}; // In development, log to console
		if (process.env["NODE_ENV"] === "development") {
			console.error("API Error:", logData);
			return;
		}

		// In production, send to monitoring service
		// This could be Sentry, LogRocket, or any other error tracking service
		try {
			// Example: Send to monitoring service
			// monitoringService.logError(logData);
			console.error("API Error:", logData);
		} catch (loggingError) {
			console.error("Failed to log error:", loggingError);
		}
	}
	public static createErrorResponse(error: VibrattoApiError): AxiosResponse {
		return {
			data: {
				error: {
					code: error.code,
					message: error.message,
					timestamp: error.timestamp,
					traceId: error.traceId,
				},
			},
			status: error.statusCode,
			statusText: "",
			headers: {},
			config: {} as NonNullable<AxiosResponse["config"]>,
		};
	}
}

// Error boundary for React components
export class ApiErrorBoundary {
	public static handleError(
		error: unknown,
		errorInfo?: { componentStack?: string }
	): void {
		let apiError: VibrattoApiError;

		if (error instanceof VibrattoApiError) {
			apiError = error;
		} else if (error instanceof Error) {
			apiError = ErrorHandler.handleGenericError(error);
		} else {
			apiError = new VibrattoApiError({
				code: ErrorHandler.ERROR_CODES.INTERNAL_SERVER_ERROR,
				message: "An unknown error occurred",
				statusCode: 500,
				timestamp: new Date().toISOString(),
			});
		}

		ErrorHandler.logError(apiError, errorInfo?.componentStack);

		// You can add additional error handling here, such as:
		// - Showing a toast notification
		// - Redirecting to an error page
		// - Sending error reports to analytics
	}
}

export { ErrorHandler as default };
