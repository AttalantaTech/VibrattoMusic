import type { ApiClient } from "../core/client";
import type { MyHiring } from "../../common/types";
import type {
	PaginationParameters,
	PaginatedResponse,
} from "../types";

export class HiringService {
	public constructor(private readonly apiClient: ApiClient) {}

	/**
	 * Get hirings made by the current user (as hirer)
	 */
	public async getMyHirings(
		parameters?: PaginationParameters & { status?: string }
	): Promise<PaginatedResponse<MyHiring>> {
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

		const url = `hirings/me${queryParameters.toString() ? `?${queryParameters.toString()}` : ""}`;
		return this.apiClient.get<PaginatedResponse<MyHiring>>(url);
	}

	/**
	 * Get hiring by ID
	 */
	public async getHiring(hiringId: string): Promise<MyHiring> {
		return this.apiClient.get<MyHiring>(`hirings/${hiringId}`);
	}

	/**
	 * Cancel a hiring (only if canCancel is true)
	 */
	public async cancelHiring(
		hiringId: string,
		reason?: string
	): Promise<void> {
		return this.apiClient.post<void>(`hirings/${hiringId}/cancel`, { reason });
	}

	/**
	 * Get contract details for a hiring
	 */
	public async getHiringContract(hiringId: string): Promise<{
		id: string;
		content: string;
		status: string;
		createdAt: string;
		signedAt?: string;
	}> {
		return this.apiClient.get(`hirings/${hiringId}/contract`);
	}

	/**
	 * Get proposal details for a hiring
	 */
	public async getHiringProposal(hiringId: string): Promise<{
		id: string;
		content: string;
		status: string;
		createdAt: string;
		services: Array<{
			name: string;
			description: string;
			value: number;
		}>;
	}> {
		return this.apiClient.get(`hirings/${hiringId}/proposal`);
	}

	/**
	 * Get hiring statistics for the current user
	 */
	public async getHiringStats(): Promise<{
		totalHirings: number;
		pendingPayment: number;
		activeContracts: number;
		completedContracts: number;
		cancelledContracts: number;
		totalSpent: number;
		averageValue: number;
	}> {
		return this.apiClient.get("hirings/stats");
	}
}
