/**
 * Data validation schemas using Zod for Vibratto API
 */

import { z } from "zod";

// Base schemas
export const IdSchema = z.string().min(1, "ID is required");
export const EmailSchema = z.string().email("Invalid email format");
export const PasswordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters");
export const PhoneSchema = z
	.string()
	.regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format");
export const UrlSchema = z.string().url("Invalid URL format");
export const DateSchema = z.string().datetime("Invalid date format");
export const CurrencySchema = z.enum(["BRL", "USD", "EUR", "GBP"]);
export const LanguageSchema = z.enum(["pt", "en", "es"]);

// Common validation patterns
export const BrazilianCPFSchema = z
	.string()
	.regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "Invalid CPF format");
export const BrazilianCNPJSchema = z
	.string()
	.regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "Invalid CNPJ format");
export const CoordinatesSchema = z.object({
	latitude: z.number().min(-90).max(90),
	longitude: z.number().min(-180).max(180),
});

// User-related schemas
export const UserRegistrationSchema = z.object({
	email: EmailSchema,
	password: PasswordSchema,
	firstName: z.string().min(1, "First name is required").max(50),
	lastName: z.string().min(1, "Last name is required").max(50),
	phone: PhoneSchema.optional(),
	dateOfBirth: z.string().optional(),
	acceptTerms: z
		.boolean()
		.refine((value) => value === true, "Must accept terms"),
	acceptMarketing: z.boolean().optional(),
});

export const UserLoginSchema = z.object({
	email: EmailSchema,
	password: z.string().min(1, "Password is required"),
	rememberMe: z.boolean().optional(),
});

export const UserProfileUpdateSchema = z.object({
	firstName: z.string().min(1).max(50).optional(),
	lastName: z.string().min(1).max(50).optional(),
	bio: z.string().max(500).optional(),
	phone: PhoneSchema.optional(),
	website: UrlSchema.optional(),
	location: z
		.object({
			city: z.string().optional(),
			state: z.string().optional(),
			country: z.string().optional(),
		})
		.optional(),
	preferences: z
		.object({
			language: LanguageSchema.optional(),
			currency: CurrencySchema.optional(),
			timezone: z.string().optional(),
			emailNotifications: z.boolean().optional(),
			pushNotifications: z.boolean().optional(),
		})
		.optional(),
});

export const PasswordResetSchema = z.object({
	email: EmailSchema,
});

export const NewPasswordResetSchema = z.object({
	token: z.string().min(1, "Token is required"),
	password: PasswordSchema,
});

export const PasswordChangeSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: PasswordSchema,
		confirmPassword: z.string(),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

// Musical Product schemas
export const MusicalProductCreateSchema = z.object({
	title: z.string().min(1, "Title is required").max(100),
	description: z
		.string()
		.min(10, "Description must be at least 10 characters")
		.max(2000),
	category: z.enum(["band", "solo-artist", "dj", "speaker", "workshop"]),
	subcategory: z.string().optional(),
	musicalGenres: z.array(z.string()).min(1, "At least one genre is required"),
	priceRange: z
		.object({
			min: z.number().min(0, "Minimum price cannot be negative"),
			max: z.number().min(0, "Maximum price cannot be negative"),
			currency: CurrencySchema,
		})
		.refine((data) => data.max >= data.min, {
			message: "Maximum price must be greater than or equal to minimum price",
		}),
	location: z.object({
		city: z.string().min(1, "City is required"),
		state: z.string().min(1, "State is required"),
		country: z.string().min(1, "Country is required"),
		coordinates: CoordinatesSchema.optional(),
	}),
	availability: z.object({
		daysOfWeek: z
			.array(z.number().min(0).max(6))
			.min(1, "At least one day must be selected"),
		timeSlots: z
			.array(
				z.object({
					start: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
					end: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
				})
			)
			.min(1, "At least one time slot is required"),
	}),
	equipment: z.array(z.string()).optional(),
	setupRequirements: z.string().max(1000).optional(),
	travelRadius: z.number().min(0).max(500).optional(),
	isActive: z.boolean().optional(),
});

export const MusicalProductUpdateSchema = MusicalProductCreateSchema.partial();

export const MusicalProductSearchSchema = z.object({
	query: z.string().optional(),
	category: z.string().optional(),
	genres: z.array(z.string()).optional(),
	location: z
		.object({
			city: z.string().optional(),
			state: z.string().optional(),
			country: z.string().optional(),
			radius: z.number().min(0).max(500).optional(),
		})
		.optional(),
	priceRange: z
		.object({
			min: z.number().min(0).optional(),
			max: z.number().min(0).optional(),
			currency: CurrencySchema.optional(),
		})
		.optional(),
	availability: z
		.object({
			date: DateSchema.optional(),
			timeSlot: z
				.object({
					start: z.string().optional(),
					end: z.string().optional(),
				})
				.optional(),
		})
		.optional(),
	rating: z.number().min(0).max(5).optional(),
	page: z.number().min(1).optional(),
	limit: z.number().min(1).max(100).optional(),
	sortBy: z
		.enum(["relevance", "price", "rating", "distance", "newest"])
		.optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Booking schemas
export const BookingCreateSchema = z.object({
	productId: IdSchema,
	eventDate: DateSchema,
	eventDuration: z.number().min(1, "Duration must be at least 1 hour"),
	eventType: z.enum([
		"wedding",
		"birthday",
		"corporate",
		"festival",
		"private",
		"other",
	]),
	eventDetails: z.object({
		title: z.string().min(1, "Event title is required").max(100),
		description: z.string().max(1000).optional(),
		expectedGuests: z.number().min(1).optional(),
		venue: z.object({
			name: z.string().min(1, "Venue name is required"),
			address: z.string().min(1, "Venue address is required"),
			city: z.string().min(1, "City is required"),
			state: z.string().min(1, "State is required"),
			coordinates: CoordinatesSchema.optional(),
		}),
		setupTime: z
			.string()
			.regex(/^\d{2}:\d{2}$/)
			.optional(),
		soundCheckTime: z
			.string()
			.regex(/^\d{2}:\d{2}$/)
			.optional(),
	}),
	pricing: z.object({
		amount: z.number().min(0, "Amount cannot be negative"),
		currency: CurrencySchema,
		includesTravel: z.boolean().optional(),
		includesEquipment: z.boolean().optional(),
		additionalFees: z
			.array(
				z.object({
					name: z.string(),
					amount: z.number(),
					description: z.string().optional(),
				})
			)
			.optional(),
	}),
	requirements: z
		.object({
			equipment: z.array(z.string()).optional(),
			specialRequests: z.string().max(500).optional(),
			dietaryRestrictions: z.string().max(200).optional(),
		})
		.optional(),
	contactInfo: z.object({
		primaryContact: z.string().min(1, "Primary contact is required"),
		phone: PhoneSchema,
		email: EmailSchema,
		alternativeContact: z.string().optional(),
	}),
});

export const BookingUpdateSchema = z.object({
	status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
	eventDate: DateSchema.optional(),
	eventDuration: z.number().min(1).optional(),
	eventDetails: BookingCreateSchema.shape.eventDetails.partial().optional(),
	pricing: BookingCreateSchema.shape.pricing.partial().optional(),
	requirements: BookingCreateSchema.shape.requirements.optional(),
	notes: z.string().max(1000).optional(),
});

// Message schemas
export const MessageCreateSchema = z.object({
	conversationId: IdSchema,
	content: z.string().min(1, "Message content is required").max(2000),
	type: z.enum(["text", "image", "audio", "file"]).default("text"),
	metadata: z
		.object({
			fileName: z.string().optional(),
			fileSize: z.number().optional(),
			mimeType: z.string().optional(),
			duration: z.number().optional(),
		})
		.optional(),
});

export const ConversationCreateSchema = z.object({
	participants: z.array(IdSchema).min(2, "At least 2 participants required"),
	type: z.enum(["direct", "group", "booking"]).default("direct"),
	title: z.string().max(100).optional(),
	bookingId: IdSchema.optional(),
});

// File upload schemas
export const FileUploadSchema = z
	.object({
		file: z.instanceof(File).refine((value) => value instanceof File, {
			message: "File is required",
		}),
		folder: z.string().optional(),
		resize: z
			.object({
				width: z.number().min(1).max(4096).optional(),
				height: z.number().min(1).max(4096).optional(),
			})
			.optional(),
		quality: z.number().min(1).max(100).optional(),
	})
	.refine(
		(data) => {
			const allowedTypes = [
				"image/jpeg",
				"image/png",
				"image/webp",
				"audio/mpeg",
				"audio/wav",
				"audio/mp4",
				"application/pdf",
				"text/plain",
			];
			return allowedTypes.includes(data.file.type);
		},
		{
			message: "File type not allowed",
		}
	)
	.refine(
		(data) => {
			const maxSize = 50 * 1024 * 1024; // 50MB
			return data.file.size <= maxSize;
		},
		{
			message: "File size exceeds maximum limit (50MB)",
		}
	);

// Rating and review schemas
export const RatingCreateSchema = z.object({
	productId: IdSchema,
	bookingId: IdSchema.optional(),
	rating: z.number().min(1).max(5),
	title: z.string().min(1, "Review title is required").max(100),
	comment: z
		.string()
		.min(10, "Comment must be at least 10 characters")
		.max(1000),
	categories: z
		.object({
			punctuality: z.number().min(1).max(5).optional(),
			professionalism: z.number().min(1).max(5).optional(),
			quality: z.number().min(1).max(5).optional(),
			communication: z.number().min(1).max(5).optional(),
			value: z.number().min(1).max(5).optional(),
		})
		.optional(),
});

// Utility schemas
export const LocationSearchSchema = z.object({
	query: z.string().min(1, "Search query is required"),
	country: z.string().optional(),
	state: z.string().optional(),
	limit: z.number().min(1).max(50).optional(),
});

export const CoordinateSearchSchema = z.object({
	latitude: z.number().min(-90).max(90),
	longitude: z.number().min(-180).max(180),
});

export const EmailValidationSchema = z.object({
	email: EmailSchema,
});

export const PhoneValidationSchema = z.object({
	phone: z.string().min(1, "Phone number is required"),
	countryCode: z.string().length(2, "Country code must be 2 characters"),
});

export const BusinessDocumentValidationSchema = z.object({
	document: z.string().min(1, "Document is required"),
	countryCode: z.string().length(2, "Country code must be 2 characters"),
});

// Export request schema
export const ExportRequestSchema = z.object({
	type: z.enum(["bookings", "products", "messages", "users", "analytics"]),
	format: z.enum(["csv", "json", "xlsx"]),
	dateRange: z
		.object({
			start: DateSchema,
			end: DateSchema,
		})
		.refine((data) => new Date(data.end) >= new Date(data.start), {
			message: "End date must be after start date",
		}),
	filters: z.record(z.any()).optional(),
	includeDeleted: z.boolean().optional(),
});

// WebSocket message schemas
export const WebSocketMessageSchema = z.object({
	type: z.string().min(1, "Message type is required"),
	data: z.any(),
	timestamp: DateSchema.optional(),
	id: z.string().optional(),
});

// Validation helper functions
export function validateSchema<T>(
	schema: z.ZodSchema<T>,
	data: unknown
): { success: true; data: T } | { success: false; errors: Array<string> } {
	try {
		const result = schema.parse(data);
		return { success: true, data: result };
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errors = error.errors.map(
				(error_) => `${error_.path.join(".")}: ${error_.message}`
			);
			return { success: false, errors };
		}
		return { success: false, errors: ["Unknown validation error"] };
	}
}

export function validateSchemaAsync<T>(
	schema: z.ZodSchema<T>,
	data: unknown
): Promise<
	{ success: true; data: T } | { success: false; errors: Array<string> }
> {
	return Promise.resolve(validateSchema(schema, data));
}

// Custom validation decorators
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
	return (data: unknown): T => {
		const result = validateSchema(schema, data);
		if (!result.success) {
			throw new Error(`Validation failed: ${result.errors.join(", ")}`);
		}
		return result.data;
	};
}

// Type inference helpers
export type UserRegistration = z.infer<typeof UserRegistrationSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type UserProfileUpdate = z.infer<typeof UserProfileUpdateSchema>;
export type MusicalProductCreate = z.infer<typeof MusicalProductCreateSchema>;
export type MusicalProductUpdate = z.infer<typeof MusicalProductUpdateSchema>;
export type MusicalProductSearch = z.infer<typeof MusicalProductSearchSchema>;
export type BookingCreate = z.infer<typeof BookingCreateSchema>;
export type BookingUpdate = z.infer<typeof BookingUpdateSchema>;
export type MessageCreate = z.infer<typeof MessageCreateSchema>;
export type ConversationCreate = z.infer<typeof ConversationCreateSchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;
export type RatingCreate = z.infer<typeof RatingCreateSchema>;
export type LocationSearch = z.infer<typeof LocationSearchSchema>;
export type ExportRequest = z.infer<typeof ExportRequestSchema>;
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

// Schema registry for dynamic validation
export const SCHEMA_REGISTRY = {
	"user.registration": UserRegistrationSchema,
	"user.login": UserLoginSchema,
	"user.profile.update": UserProfileUpdateSchema,
	"user.password.reset": PasswordResetSchema,
	"user.password.reset.new": NewPasswordResetSchema,
	"user.password.change": PasswordChangeSchema,
	"product.create": MusicalProductCreateSchema,
	"product.update": MusicalProductUpdateSchema,
	"product.search": MusicalProductSearchSchema,
	"booking.create": BookingCreateSchema,
	"booking.update": BookingUpdateSchema,
	"message.create": MessageCreateSchema,
	"conversation.create": ConversationCreateSchema,
	"file.upload": FileUploadSchema,
	"rating.create": RatingCreateSchema,
	"location.search": LocationSearchSchema,
	"coordinate.search": CoordinateSearchSchema,
	"email.validation": EmailValidationSchema,
	"phone.validation": PhoneValidationSchema,
	"document.validation": BusinessDocumentValidationSchema,
	"export.request": ExportRequestSchema,
	"websocket.message": WebSocketMessageSchema,
} as const;

export type SchemaKey = keyof typeof SCHEMA_REGISTRY;

export function getSchema(key: SchemaKey) {
	return SCHEMA_REGISTRY[key];
}

export function validateByKey<K extends SchemaKey>(
	key: K,
	data: unknown
):
	| { success: true; data: unknown }
	| { success: false; errors: Array<string> } {
	const schema = SCHEMA_REGISTRY[key];
	return validateSchema(schema as z.ZodSchema<unknown>, data);
}
