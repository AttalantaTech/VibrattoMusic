import { apiClient } from "@/api/core/client";
import type { ApiMessageResponse } from "@/api/types";
import type { ContractModel, ContractModelSummary } from "../types";

/**
 * Cunha's routes (prints of 17/11/2026). Not called yet: production doesn't
 * have the base model, and some routes are still to be confirmed (marked
 * "A CONFIRMAR"). The screens use the demo source until then
 */
export const contractModelsApi = {
	list: (productId: number) =>
		apiClient.get<Array<ContractModelSummary>>(
			`produtomusical/${productId}/modelosContrato`
		),

	get: (modelId: number) =>
		apiClient.get<ContractModel>(`produtomusical/modeloContrato/${modelId}`),

	/** A CONFIRMAR: whether {id} is the base model or the musical product */
	create: (baseOrProductId: number, nome: string) =>
		apiClient.post<{ modeloContrato: number }>(
			`produtomusical/${baseOrProductId}/modeloContrato`,
			{ nome }
		),

	update: (model: ContractModel) =>
		apiClient.put<ApiMessageResponse>(
			`produtomusical/modeloContrato/${model.id}`,
			model
		),

	/** A CONFIRMAR: route of "Inativa Modelo" */
	remove: (modelId: number) =>
		apiClient.delete<ApiMessageResponse>(
			`produtomusical/modeloContrato/${modelId}`
		),
};
