import { useMutation } from "@tanstack/react-query";
import { webhookService } from "../api/services/webhookService";
import type {
	D4SignWebhookPayload,
	D4SignContingencyPayload,
} from "../api/types";
import { toast } from "sonner";

/**
 * Hook to handle D4Sign contract signature webhook
 */
export const useContractSignatureWebhook = () => {
	return useMutation({
		mutationFn: (payload: D4SignWebhookPayload) =>
			webhookService.handleContractSignatureWebhook(payload),
		onSuccess: (response) => {
			if (response.success) {
				toast.success("Contrato assinado com sucesso!");
				
				// TODO: Invalidate contract queries to refresh data
				// queryClient.invalidateQueries({ queryKey: ["contracts"] });
				// queryClient.invalidateQueries({ queryKey: ["proposals"] });
			} else {
				toast.error(`Erro na assinatura: ${response.message}`);
			}
		},
		onError: (error) => {
			console.error("❌ Contract signature webhook error:", error);
			toast.error("Erro ao processar assinatura do contrato");
		},
	});
};

/**
 * Hook to handle D4Sign contingency webhook
 */
export const useContingencyWebhook = () => {
	return useMutation({
		mutationFn: (payload: D4SignContingencyPayload) =>
			webhookService.handleContingencyWebhook(payload),
		onSuccess: (response) => {
			if (response.success) {
				toast.success("Webhook de contingência processado com sucesso!");
			} else {
				toast.error(`Erro no webhook de contingência: ${response.message}`);
			}
		},
		onError: (error) => {
			console.error("❌ Contingency webhook error:", error);
			toast.error("Erro ao processar webhook de contingência");
		},
	});
};

/**
 * Hook to validate webhook payload
 */
export const useWebhookValidation = () => {
	const validatePayload = (payload: D4SignWebhookPayload | D4SignContingencyPayload) => {
		return webhookService.validateWebhookPayload(payload);
	};

	const parseFormData = (formData: FormData): D4SignWebhookPayload => {
		return webhookService.parseWebhookFormData(formData);
	};

	return {
		validatePayload,
		parseFormData,
	};
};

