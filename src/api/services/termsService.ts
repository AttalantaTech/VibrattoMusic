import { apiClient } from "../core/client";
import { VibrattoApiError } from "../middleware/errorHandler";
import type { TermCode, TermStatus } from "@/features/Terms/types";

/**
 * The person's acceptance of a term. null: the term isn't registered in the
 * API (404 "Termo de aceite não encontrado."), so there is nothing to accept
 */
export const getTermStatus = async (
	code: TermCode
): Promise<TermStatus | null> => {
	try {
		return await apiClient.get<TermStatus>(`termoAceite/${code}`);
	} catch (error) {
		if (error instanceof VibrattoApiError && error.statusCode === 404)
			return null;
		throw error;
	}
};

/** Accepts the version that GET termoAceite/{code} showed */
export const signTerm = async (code: TermCode, versao: number) => {
	await apiClient.post(`termoAceite/${code}/assinar`, { versao });
};
