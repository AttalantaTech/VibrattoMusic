import type { ApiClient } from "../core/client";
import type {
	Booking,
	CreateBookingRequest,
	PaginationParameters,
	PaginatedResponse,
} from "../types";

export class BookingService {
	public constructor(private readonly apiClient: ApiClient) {}

	/**
	 * Create a new booking
	 */
	public async createBooking(
		bookingData: CreateBookingRequest
	): Promise<Booking> {
		return this.apiClient.post<Booking>("booking", bookingData);
	}

	/**
	 * Get booking by ID
	 */
	public async getBooking(bookingId: number): Promise<Booking> {
		return this.apiClient.get<Booking>(`booking/${bookingId}`);
	} /**
	 * Get user's bookings
	 */
	public async getMyBookings(
		parameters?: PaginationParameters & { status?: string }
	): Promise<PaginatedResponse<Booking>> {
		const queryParameters = new URLSearchParams();
		if (parameters?.page)
			queryParameters.append("page", parameters.page.toString());
		if (parameters?.limit)
			queryParameters.append("limit", parameters.limit.toString());
		if (parameters?.status) queryParameters.append("status", parameters.status);
		if (parameters?.orderBy)
			queryParameters.append("orderBy", parameters.orderBy);
		if (parameters?.orderDirection)
			queryParameters.append("orderDirection", parameters.orderDirection);

		const url = `booking/meus${queryParameters.toString() ? `?${queryParameters.toString()}` : ""}`;
		return this.apiClient.get<PaginatedResponse<Booking>>(url);
	}
	/**
	 * Get bookings for owned products
	 */ public async getProductBookings(
		productId?: number,
		parameters?: PaginationParameters & { status?: string }
	): Promise<PaginatedResponse<Booking>> {
		const queryParameters = new URLSearchParams();
		if (parameters?.page)
			queryParameters.append("page", parameters.page.toString());
		if (parameters?.limit)
			queryParameters.append("limit", parameters.limit.toString());
		if (parameters?.status) queryParameters.append("status", parameters.status);
		if (parameters?.orderBy)
			queryParameters.append("orderBy", parameters.orderBy);
		if (parameters?.orderDirection)
			queryParameters.append("orderDirection", parameters.orderDirection);

		const baseUrl = productId
			? `booking/produto/${productId}`
			: "booking/produtos";
		const urlSuffix = queryParameters.toString()
			? `?${queryParameters.toString()}`
			: "";
		const url = `${baseUrl}${urlSuffix}`;
		return this.apiClient.get<PaginatedResponse<Booking>>(url);
	}

	/**
	 * Update booking status
	 */
	public async updateBookingStatus(
		bookingId: number,
		status: "confirmado" | "cancelado" | "concluido"
	): Promise<Booking> {
		return this.apiClient.patch<Booking>(`booking/${bookingId}/status`, {
			status,
		});
	}

	/**
	 * Update booking details
	 */
	public async updateBooking(
		bookingId: number,
		updates: Partial<CreateBookingRequest>
	): Promise<Booking> {
		return this.apiClient.put<Booking>(`booking/${bookingId}`, updates);
	}

	/**
	 * Cancel booking
	 */
	public async cancelBooking(
		bookingId: number,
		motivo?: string
	): Promise<void> {
		return this.apiClient.post<void>(`booking/${bookingId}/cancel`, { motivo });
	}

	/**
	 * Check availability for booking
	 */
	public async checkAvailability(
		productId: number,
		dataEvento: string,
		horaInicio: string,
		horaFim: string
	): Promise<{
		disponivel: boolean;
		conflitos?: Array<{ inicio: string; fim: string }>;
	}> {
		return this.apiClient.post<{
			disponivel: boolean;
			conflitos?: Array<{ inicio: string; fim: string }>;
		}>("booking/check-availability", {
			productId,
			dataEvento,
			horaInicio,
			horaFim,
		});
	}

	/**
	 * Get booking calendar for product
	 */
	public async getBookingCalendar(
		productId: number,
		mes: string
	): Promise<
		Array<{
			data: string;
			bookings: Array<{
				id: number;
				horaInicio: string;
				horaFim: string;
				status: string;
			}>;
		}>
	> {
		return this.apiClient.get<
			Array<{
				data: string;
				bookings: Array<{
					id: number;
					horaInicio: string;
					horaFim: string;
					status: string;
				}>;
			}>
		>(`booking/produto/${productId}/calendar?mes=${mes}`);
	}

	/**
	 * Send message related to booking
	 */
	public async sendBookingMessage(
		bookingId: number,
		conteudo: string
	): Promise<void> {
		return this.apiClient.post<void>(`booking/${bookingId}/message`, {
			conteudo,
		});
	}

	/**
	 * Confirm booking
	 */
	public async confirmBooking(bookingId: number): Promise<Booking> {
		return this.apiClient.patch<Booking>(`booking/${bookingId}/confirm`, {});
	}

	/**
	 * Complete booking
	 */
	public async completeBooking(bookingId: number): Promise<Booking> {
		return this.apiClient.patch<Booking>(`booking/${bookingId}/complete`, {});
	}

	/**
	 * Get calendar events for a date range
	 */
	public async getCalendarEvents(
		startDate: string,
		endDate: string
	): Promise<
		Array<{
			id: number;
			title: string;
			start: string;
			end: string;
			status: string;
			productId: number;
		}>
	> {
		return this.apiClient.get<
			Array<{
				id: number;
				title: string;
				start: string;
				end: string;
				status: string;
				productId: number;
			}>
		>(`booking/calendar?start=${startDate}&end=${endDate}`);
	}

	/**
	 * Get booking statistics
	 */
	public async getBookingStats(): Promise<{
		totalBookings: number;
		pendentes: number;
		confirmados: number;
		cancelados: number;
		concluidos: number;
		receitaTotal: number;
		receitaMensal: number;
	}> {
		return this.apiClient.get("booking/stats");
	}
}
