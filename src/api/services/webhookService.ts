/* eslint-disable camelcase */
import { apiClient } from "../core/client";
import type {
	D4SignWebhookPayload,
	D4SignWebhookResponse,
	D4SignContingencyPayload,
	D4SignContingencyResponse,
} from "../types";

/**
 * Service for handling D4Sign webhook operations
 */
class WebhookService {
	/**
	 * Handle D4Sign contract signature webhook
	 * @param payload - Webhook payload from D4Sign
	 * @returns Promise with webhook response
	 */
	async handleContractSignatureWebhook(
		payload: D4SignWebhookPayload
	): Promise<D4SignWebhookResponse> {
		try {
			const response = await apiClient.post<D4SignWebhookResponse>(
				"/produtomusical/d4sign/webhook",
				payload,
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
				}
			);

			return response;
		} catch (error) {
			console.error("❌ Error handling contract signature webhook:", error);
			throw new Error("Failed to process contract signature webhook");
		}
	}

	/**
	 * Handle D4Sign contingency webhook
	 * @param payload - Contingency webhook payload from D4Sign
	 * @returns Promise with webhook response
	 */
	async handleContingencyWebhook(
		payload: D4SignContingencyPayload
	): Promise<D4SignContingencyResponse> {
		try {
			const response = await apiClient.post<D4SignContingencyResponse>(
				"/produtomusical/d4sign/contingenciaWebhook",
				payload,
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
				}
			);

			return response;
		} catch (error) {
			console.error("❌ Error handling contingency webhook:", error);
			throw new Error("Failed to process contingency webhook");
		}
	}

	/**
	 * Validate webhook payload
	 * @param payload - Webhook payload to validate
	 * @returns boolean indicating if payload is valid
	 */
	validateWebhookPayload(
		payload: D4SignWebhookPayload | D4SignContingencyPayload
	): boolean {
		return !!(
			payload.uuid &&
			payload.type_post &&
			payload.message &&
			payload.email
		);
	}

	/**
	 * Parse webhook payload from form data
	 * @param formData - Form data from webhook request
	 * @returns Parsed webhook payload
	 */
	parseWebhookFormData(formData: FormData): D4SignWebhookPayload {
		return {
			uuid: formData.get("uuid") as string,
			type_post: formData.get("type_post") as string,
			message: formData.get("message") as string,
			email: formData.get("email") as string,
		};
	}

	/**
	 * Create webhook response
	 * @param success - Whether the operation was successful
	 * @param message - Response message
	 * @param contractId - Optional contract ID
	 * @param proposalId - Optional proposal ID
	 * @returns Webhook response object
	 */
	createWebhookResponse(
		success: boolean,
		message: string,
		contractId?: number,
		proposalId?: number
	): D4SignWebhookResponse {
		return {
			success,
			message,
			contractId,
			proposalId,
		};
	}
}

export const webhookService = new WebhookService();
