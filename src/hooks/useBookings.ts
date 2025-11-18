// Booking management hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingService } from "../api";
import type {
	Booking,
	CreateBookingRequest,
	PaginationParameters,
	PaginatedResponse,
} from "../api/types";

// Query Keys
export const bookingKeys = {
	all: ["bookings"] as const,
	lists: () => [...bookingKeys.all, "list"] as const,
	list: (filters: PaginationParameters & { status?: string }) =>
		[...bookingKeys.lists(), filters] as const,
	details: () => [...bookingKeys.all, "detail"] as const,
	detail: (id: number) => [...bookingKeys.details(), id] as const,
	calendar: () => [...bookingKeys.all, "calendar"] as const,
	calendarRange: (startDate: string, endDate: string) =>
		[...bookingKeys.calendar(), startDate, endDate] as const,
	stats: () => [...bookingKeys.all, "stats"] as const,
	availability: () => [...bookingKeys.all, "availability"] as const,
	productBookings: (productId?: number) =>
		[...bookingKeys.all, "product", productId] as const,
};

/**
 * Hook to get user's bookings (as client)
 */
export const useMyBookings = (
	parameters?: PaginationParameters & { status?: string },
	enabled: boolean = true
) => {
	return useQuery<PaginatedResponse<Booking>, Error>({
		queryKey: bookingKeys.list(parameters || {}),
		queryFn: () => bookingService.getMyBookings(parameters),
		enabled,
		staleTime: 1 * 60 * 1000, // 1 minute
	});
};

/**
 * Hook to get bookings for owned products (as provider)
 */
export const useProductBookings = (
	productId?: number,
	parameters?: PaginationParameters & { status?: string },
	enabled: boolean = true
) => {
	return useQuery<PaginatedResponse<Booking>, Error>({
		queryKey: bookingKeys.productBookings(productId),
		queryFn: () => bookingService.getProductBookings(productId, parameters),
		enabled,
		staleTime: 1 * 60 * 1000, // 1 minute
	});
};

/**
 * Hook to get booking by ID
 */
export const useBooking = (bookingId: number, enabled: boolean = true) => {
	return useQuery<Booking, Error>({
		queryKey: bookingKeys.detail(bookingId),
		queryFn: () => bookingService.getBooking(bookingId),
		enabled: enabled && bookingId > 0,
		staleTime: 30 * 1000, // 30 seconds
	});
};

/**
 * Hook to create a new booking
 */
export const useCreateBooking = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (bookingData: CreateBookingRequest) =>
			bookingService.createBooking(bookingData),
		onSuccess: () => {
			// Invalidate booking lists
			void queryClient.invalidateQueries({
				queryKey: bookingKeys.lists(),
			});
		},
	});
};

/**
 * Hook to update booking status
 */
export const useUpdateBookingStatus = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			bookingId,
			status,
		}: {
			bookingId: number;
			status: "confirmado" | "cancelado" | "concluido";
		}) => bookingService.updateBookingStatus(bookingId, status),
		onSuccess: (_, variables) => {
			// Invalidate related queries
			void queryClient.invalidateQueries({
				queryKey: bookingKeys.detail(variables.bookingId),
			});
			void queryClient.invalidateQueries({
				queryKey: bookingKeys.lists(),
			});
		},
	});
};

/**
 * Hook to cancel booking
 */
export const useCancelBooking = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			bookingId,
			motivo,
		}: {
			bookingId: number;
			motivo?: string;
		}) => bookingService.cancelBooking(bookingId, motivo),
		onSuccess: (_, variables) => {
			// Invalidate related queries
			void queryClient.invalidateQueries({
				queryKey: bookingKeys.detail(variables.bookingId),
			});
			void queryClient.invalidateQueries({
				queryKey: bookingKeys.lists(),
			});
		},
	});
};

/**
 * Hook to confirm booking
 */
export const useConfirmBooking = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (bookingId: number) => bookingService.confirmBooking(bookingId),
		onSuccess: (_, bookingId) => {
			// Invalidate related queries
			void queryClient.invalidateQueries({
				queryKey: bookingKeys.detail(bookingId),
			});
			void queryClient.invalidateQueries({
				queryKey: bookingKeys.lists(),
			});
		},
	});
};

/**
 * Hook to complete booking
 */
export const useCompleteBooking = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (bookingId: number) =>
			bookingService.completeBooking(bookingId),
		onSuccess: (_, bookingId) => {
			// Invalidate related queries
			void queryClient.invalidateQueries({
				queryKey: bookingKeys.detail(bookingId),
			});
			void queryClient.invalidateQueries({
				queryKey: bookingKeys.lists(),
			});
		},
	});
};

/**
 * Hook to check availability
 */
export const useCheckAvailability = () => {
	return useMutation({
		mutationFn: ({
			productId,
			dataEvento,
			horaInicio,
			horaFim,
		}: {
			productId: number;
			dataEvento: string;
			horaInicio: string;
			horaFim: string;
		}) =>
			bookingService.checkAvailability(
				productId,
				dataEvento,
				horaInicio,
				horaFim
			),
	});
};

/**
 * Hook to get booking calendar
 */
export const useBookingCalendar = (
	productId: number,
	month: string,
	enabled: boolean = true
) => {
	return useQuery({
		queryKey: [...bookingKeys.calendar(), productId, month],
		queryFn: () => bookingService.getBookingCalendar(productId, month),
		enabled: enabled && productId > 0,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};

/**
 * Hook to get calendar events for date range
 */
export const useCalendarEvents = (
	startDate: string,
	endDate: string,
	enabled: boolean = true
) => {
	return useQuery({
		queryKey: bookingKeys.calendarRange(startDate, endDate),
		queryFn: () => bookingService.getCalendarEvents(startDate, endDate),
		enabled,
		staleTime: 2 * 60 * 1000, // 2 minutes
	});
};

/**
 * Hook to get booking statistics
 */
export const useBookingStats = (enabled: boolean = true) => {
	return useQuery({
		queryKey: bookingKeys.stats(),
		queryFn: () => bookingService.getBookingStats(),
		enabled,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};

/**
 * Hook to send booking message
 */
export const useSendBookingMessage = () => {
	return useMutation({
		mutationFn: ({
			bookingId,
			conteudo,
		}: {
			bookingId: number;
			conteudo: string;
		}) => bookingService.sendBookingMessage(bookingId, conteudo),
	});
};
