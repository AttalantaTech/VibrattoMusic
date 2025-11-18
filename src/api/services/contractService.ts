import { apiClient } from "../core/client";
import type {
	ContractResponse,
	ContractSection,
	ContractSectionUpdateRequest,
} from "../types";

/**
 * Service for managing contracts
 */
export const contractService = {
	/**
	 * Load contract details by unique identifier
	 * @param identificadorUnico - The unique identifier of the contract
	 * @returns Promise with contract details
	 */
	async loadContract(identificadorUnico: string): Promise<ContractResponse> {
		const response = await apiClient.get<ContractResponse>(
			`produtomusical/${identificadorUnico}/carregaContrato`
		);
		return response;
	},

	/**
	 * Load contract PDF by unique identifier
	 * @param identificadorUnico - The unique identifier of the contract
	 * @returns Promise with PDF URL or blob
	 */
	async loadContractPDF(identificadorUnico: string): Promise<string> {
		const response = await fetch(`${process.env['REACT_APP_API_BASE_URL'] || 'https://api.vibratto.com.br/'}produtomusical/${identificadorUnico}/carregaContrato`, {
			method: 'GET',
			headers: {
				'Accept': 'application/pdf',
			},
		});
		
		if (!response.ok) {
			throw new Error('Failed to load contract PDF');
		}
		
		const blob = await response.blob();
		return URL.createObjectURL(blob);
	},

	/**
	 * List contract sections for editing
	 * @param contractId - The ID of the contract
	 * @returns Promise with array of contract sections
	 */
	async listContractSections(contractId: number): Promise<Array<ContractSection>> {
		const response = await apiClient.get<Array<ContractSection>>(
			`produtomusical/${contractId}/listarSecoesContrato`
		);
		return response;
	},

	/**
	 * List contract sections for editing by unique identifier
	 * @param identificadorUnico - The unique identifier of the contract
	 * @returns Promise with array of contract sections
	 */
	async listContractSectionsByIdentificador(identificadorUnico: string): Promise<Array<ContractSection>> {
		const response = await apiClient.get<Array<ContractSection>>(
			`produtomusical/${identificadorUnico}/listarSecoesContrato`
		);
		return response;
	},

	/**
	 * Save/update contract sections
	 * @param contractId - The ID of the contract
	 * @param sections - Array of contract sections to update
	 * @returns Promise with response
	 */
	async saveContractSections(
		contractId: number,
		sections: Array<ContractSectionUpdateRequest>
	): Promise<void> {
		await apiClient.post(`produtomusical/${contractId}/gravarSecoesContrato`, {
			SecoesContrato: sections,
		});
	},

	/**
	 * Save/update contract sections by unique identifier
	 * @param identificadorUnico - The unique identifier of the contract
	 * @param sections - Array of contract sections to update
	 * @returns Promise with response
	 */
	async saveContractSectionsByIdentificador(
		identificadorUnico: string,
		sections: Array<ContractSectionUpdateRequest>
	): Promise<void> {
		await apiClient.post(`produtomusical/${identificadorUnico}/gravarSecoesContrato`, {
			SecoesContrato: sections,
		});
	},

	/**
	 * Get contract statistics for a user
	 * @param userId - The ID of the user
	 * @param periodo - Period to analyze (7d, 30d, 90d, 1y)
	 * @returns Promise with contract statistics
	 */
	async getContractStatistics(
		userId: number,
		periodo: string = "30d"
	): Promise<{
		total: number;
		ativos: number;
		concluidos: number;
		pendentes: number;
		valorTotal: number;
		valorMedio: number;
	}> {
		const response = await apiClient.get<{
			total: number;
			ativos: number;
			concluidos: number;
			pendentes: number;
			valorTotal: number;
			valorMedio: number;
		}>(`contratos/estatisticas/${userId}?periodo=${periodo}`);
		return response;
	},

	/**
	 * Search contracts by term
	 * @param searchTerm - The search term
	 * @param userId - The ID of the user (optional, for filtering own contracts)
	 * @param limit - Maximum number of results
	 * @returns Promise with search results
	 */
	async searchContracts(
		searchTerm: string,
		userId?: number,
		limit: number = 50
	): Promise<Array<ContractResponse>> {
		const parameters = new URLSearchParams({
			termo: searchTerm,
			limite: limit.toString(),
		});

		if (userId) {
			parameters.append("usuarioId", userId.toString());
		}

		const response = await apiClient.get<Array<ContractResponse>>(
			`contratos/buscar?${parameters.toString()}`
		);
		return response;
	},
};

