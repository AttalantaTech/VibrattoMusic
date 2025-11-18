import type { ApiClient } from "../core/client";
import type { PaginationParameters, PaginatedResponse } from "../types";
import type { AgendaEvent } from "../../components/BandProfile/Agenda/types";

export interface Event {
	id: number;
	productId: number;
	title: string;
	description?: string;
	date: string;
	startTime: string;
	endTime: string;
	location?: string;
	type: "show" | "rehearsal" | "meeting" | "personal";
	status: "confirmed" | "pending" | "cancelled";
	bookingId?: number;
	isRecurring?: boolean;
	recurringPattern?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateEventRequest {
	productId: number;
	title: string;
	description?: string;
	date: string;
	startTime: string;
	endTime: string;
	location?: string;
	type: "show" | "rehearsal" | "meeting" | "personal";
	status?: "confirmed" | "pending" | "cancelled";
	bookingId?: number;
}

export type UpdateEventRequest = Partial<CreateEventRequest>;

export interface EventConflict {
	id: number;
	title: string;
	startTime: string;
	endTime: string;
}

export interface AvailabilityCheck {
	available: boolean;
	conflicts?: Array<EventConflict>;
}

export class EventService {
	public constructor(private readonly apiClient: ApiClient) {}

	/**
	 * Create a new event
	 */
	public async createEvent(eventData: CreateEventRequest): Promise<Event> {
		return this.apiClient.post<Event>("events", eventData);
	}

	/**
	 * Get event by ID
	 */
	public async getEvent(eventId: number): Promise<Event> {
		return this.apiClient.get<Event>(`events/${eventId}`);
	}

	/**
	 * Update event
	 */
	public async updateEvent(
		eventId: number,
		updates: UpdateEventRequest
	): Promise<Event> {
		return this.apiClient.put<Event>(`events/${eventId}`, updates);
	}

	/**
	 * Delete event
	 */
	public async deleteEvent(eventId: number): Promise<void> {
		return this.apiClient.delete<void>(`events/${eventId}`);
	}

	/**
	 * Get events for a product within a date range
	 */
	public async getProductEvents(
		productId: number,
		startDate: string,
		endDate: string,
		parameters?: PaginationParameters & { type?: string; status?: string }
	): Promise<PaginatedResponse<Event>> {
		const queryParameters = new URLSearchParams();
		queryParameters.append("startDate", startDate);
		queryParameters.append("endDate", endDate);

		if (parameters?.page)
			queryParameters.append("page", parameters.page.toString());
		if (parameters?.limit)
			queryParameters.append("limit", parameters.limit.toString());
		if (parameters?.type) queryParameters.append("type", parameters.type);
		if (parameters?.status) queryParameters.append("status", parameters.status);
		if (parameters?.orderBy)
			queryParameters.append("orderBy", parameters.orderBy);
		if (parameters?.orderDirection)
			queryParameters.append("orderDirection", parameters.orderDirection);

		return this.apiClient.get<PaginatedResponse<Event>>(
			`events/product/${productId}?${queryParameters.toString()}`
		);
	}

	/**
	 * Get calendar view of events
	 */
	public async getCalendarEvents(
		productId: number,
		month: string,
		year: string
	): Promise<
		Array<{
			date: string;
			events: Array<{
				id: number;
				title: string;
				startTime: string;
				endTime: string;
				type: string;
				status: string;
				bookingId?: number;
			}>;
		}>
	> {
		return this.apiClient.get(
			`events/product/${productId}/calendar?month=${month}&year=${year}`
		);
	}

	/**
	 * Check availability for new event
	 */
	public async checkAvailability(
		productId: number,
		date: string,
		startTime: string,
		endTime: string,
		excludeEventId?: number
	): Promise<AvailabilityCheck> {
		const body: any = {
			productId,
			date,
			startTime,
			endTime,
		};

		if (excludeEventId) {
			body.excludeEventId = excludeEventId;
		}

		return this.apiClient.post<AvailabilityCheck>(
			"events/check-availability",
			body
		);
	}


	/**
	 * Convert AgendaEvent to Event format for API
	 */
	public static agendaEventToApiEvent(
		agendaEvent: AgendaEvent,
		productId: number
	): CreateEventRequest {
		return {
			productId,
			title: agendaEvent.title,
			description: agendaEvent.description,
			date:
				agendaEvent.date instanceof Date
					? agendaEvent.date.toISOString().split("T")[0]!
					: agendaEvent.date,
			startTime: agendaEvent.startTime,
			endTime: agendaEvent.endTime,
			location: agendaEvent.location,
			type: agendaEvent.type,
			status: agendaEvent.status,
		};
	}

	/**
	 * Convert API Event to AgendaEvent format
	 */
	public static apiEventToAgendaEvent(event: Event): AgendaEvent {
		return {
			id: event.id,
			title: event.title,
			description: event.description || "",
			date: new Date(event.date),
			startTime: event.startTime,
			endTime: event.endTime,
			location: event.location || "",
			type: event.type,
			status: event.status,
		};
	}
}
