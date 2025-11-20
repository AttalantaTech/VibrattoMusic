import { apiClient } from "../core/client";
import type {
	CreateProposalRequest,
	ProposalResponse,
	ProposalFilterRequest,
} from "../types";

/**
 * Service for managing proposals
 */
export const proposalService = {
	/**
	 * Create a proposal for a musical product
	 * @param productId - The ID of the musical product
	 * @param data - The proposal data
	 * @returns Promise with the created proposal
	 */
	async createProposal(
		productId: number,
		data: CreateProposalRequest
	): Promise<ProposalResponse> {
		// Ensure the payload strictly follows the API contract (camelCase)
		const payload: CreateProposalRequest = {
			...data,
			idProdutoMusical: productId,
			idCondicoesPagamentoRestante: data.idCondicoesPagamentoRestante ?? null,
			tipoSinalPagamento: data.tipoSinalPagamento ?? null,
			valorSinalPagamento: data.valorSinalPagamento ?? null,
			dataVencimentoSinalPagamento: data.dataVencimentoSinalPagamento ?? null,
			transporteIncluso: data.transporteIncluso ?? false,
			acomodacaoInclusa: data.acomodacaoInclusa ?? false,
			camarimIncluso: data.camarimIncluso ?? false,
		};

		const response = await apiClient.post<ProposalResponse>(
			`produtomusical/${productId}/proposta`,
			payload
		);
		return response;
	},

	/**
	 * List proposals with filters
	 * @param filters - The filter criteria
	 * @returns Promise with list of proposals
	 */
	async listProposals(
		filters: ProposalFilterRequest
	): Promise<Array<ProposalResponse>> {
		// Normalize payload to match API contract: ensure all expected keys are present and never undefined
		const payload = {
			Id: filters.Id ?? null,
			IdentificadorUnico: filters.IdentificadorUnico ?? null,
			IdContratante: filters.IdContratante ?? null,
			IdProdutoMusical: filters.IdProdutoMusical ?? null,
			DataDe: filters.DataDe ?? null,
			DataAte: filters.DataAte ?? null,
		};

		// const response = await apiClient.post<Array<ProposalResponse>>(
		// 	"produtomusical/listarPropostas",
		// 	payload
		// );
		return [
			{
				id: 1,
				identificadorUnico: "ABC123",
				contratante: {
					id: 10,
					nome: "Empresa XYZ",
				},
				produtoMusical: {
					id: 47,
					nome: "Produto Musical XYZ",
				},
				tipoEvento: {
					id: 1,
					nome: "Evento XYZ",
				},
				descricao: "Descrição do evento XYZ",
				valor: 1000,
				local: "Local XYZ",
				dataInicio: "2024-01-01",
				dataFim: "2024-01-02",
				horaInicio: "18:00",
				horaFim: "22:00",
				transporteIncluso: true,
				acomodacaoInclusa: true,
				camarimIncluso: true,
				formaPagamento: {
					id: 1,
					nome: "Forma de Pagamento XYZ",
				},
				condicoesPagamento: {
					id: 1,
					nome: "Condições de Pagamento XYZ",
				},
				condicoesPagamentoRestante: {
					id: 1,
					nome: "Condições de Pagamento Restante XYZ",
				},
				tipoSinalPagamento: null,
				valorSinalPagamento: null,
				dataVencimentoSinalPagamento: null,
				status: {
					id: 1,
					nome: "Pendente",
				},
				motivoRejeicao: null,
				assinaturaContratante: false,
				dataAssinaturaContratante: null,
				assinaturaContratado: false,
				dataAssinaturaContratado: null,
				dataCriacao: "2024-05-01",
				dataAtualizacao: "",
				idContratoDigital: "",
			},
		];
		// return response;
	},

	/**
	 * Get all proposals for the authenticated user (as contractor)
	 * @returns Promise with list of proposals
	 */
	async getMyProposalsAsContractor(
		contractorId: number
	): Promise<Array<ProposalResponse>> {
		return this.listProposals({
			IdContratante: contractorId,
			Id: null,
			IdentificadorUnico: null,
			IdProdutoMusical: null,
			DataDe: null,
			DataAte: null,
		});
	},

	/**
	 * Get proposals for a specific musical product
	 * @param productId - The ID of the musical product
	 * @returns Promise with list of proposals
	 */
	async getProductProposals(
		productId: number
	): Promise<Array<ProposalResponse>> {
		return this.listProposals({
			IdProdutoMusical: productId,
			Id: null,
			IdentificadorUnico: null,
			IdContratante: null,
			DataDe: null,
			DataAte: null,
		});
	},

	/**
	 * Accept a proposal
	 * @param proposalId - The ID of the proposal
	 * @returns Promise with response
	 */
	async acceptProposal(proposalId: number): Promise<any> {
		const response = await apiClient.post(
			`produtomusical/${proposalId}/propostaAceita`,
			{}
		);
		return response;
	},

	/**
	 * Reject a proposal
	 * @param proposalId - The ID of the proposal
	 * @returns Promise with response
	 */
	async rejectProposal(proposalId: number): Promise<any> {
		const response = await apiClient.post(
			`produtomusical/${proposalId}/propostaRejeitada`,
			{}
		);
		return response;
	},

	/**
	 * Reject a proposal with reason
	 * @param proposalId - The ID of the proposal
	 * @param reasonData - The rejection reason data
	 * @returns Promise with response
	 */
	async rejectProposalWithReason(
		proposalId: number,
		reasonData: { IdMotivoRejeicao: number }
	): Promise<any> {
		const response = await apiClient.post(
			`produtomusical/${proposalId}/propostaRejeitada`,
			reasonData
		);
		return response;
	},

	/**
	 * Mark proposal deposit/signal as paid
	 * @param proposalId - The ID of the proposal
	 * @returns Promise with response
	 */
	async markDepositAsPaid(proposalId: number): Promise<any> {
		const response = await apiClient.post(
			`produtomusical/${proposalId}/sinalPago`,
			{}
		);
		return response;
	},

	/**
	 * Cancel a proposal - using reject endpoint as API doesn't have specific cancel
	 * @param proposalId - The ID of the proposal
	 * @param reasonId - Optional reason ID for cancellation (defaults to 1 for "Outro motivo")
	 * @returns Promise with response
	 */
	async cancelProposal(proposalId: number, reasonId: number = 1): Promise<any> {
		// Using reject endpoint as there's no specific cancel endpoint in the API
		// According to Postman collection, "Cancelar Proposta" uses propostaRejeitada with IdMotivoRejeicao
		return this.rejectProposalWithReason(proposalId, {
			IdMotivoRejeicao: reasonId,
		});
	},

	/**
	 * Get proposal statistics
	 * @param userId - The ID of the user
	 * @param periodo - Period to analyze
	 * @returns Promise with proposal statistics
	 */
	async getProposalStatistics(
		userId: number,
		periodo: string = "30d"
	): Promise<{
		total: number;
		pendentes: number;
		aceitas: number;
		rejeitadas: number;
		canceladas: number;
		valorTotal: number;
		valorMedio: number;
		taxaConversao: number;
	}> {
		const response = await apiClient.get<{
			total: number;
			pendentes: number;
			aceitas: number;
			rejeitadas: number;
			canceladas: number;
			valorTotal: number;
			valorMedio: number;
			taxaConversao: number;
		}>(`propostas/estatisticas/${userId}?periodo=${periodo}`);
		return response;
	},

	/**
	 * Search proposals by term
	 * @param searchTerm - The search term
	 * @param userId - The ID of the user (optional, for filtering own proposals)
	 * @param limit - Maximum number of results
	 * @returns Promise with search results
	 */
	async searchProposals(
		searchTerm: string,
		userId?: number,
		limit: number = 50
	): Promise<Array<ProposalResponse>> {
		const parameters = new URLSearchParams({
			termo: searchTerm,
			limite: limit.toString(),
		});

		if (userId) {
			parameters.append("usuarioId", userId.toString());
		}

		const response = await apiClient.get<Array<ProposalResponse>>(
			`propostas/buscar?${parameters.toString()}`
		);
		return response;
	},

	/**
	 * Get proposals by date range
	 * @param userId - The ID of the user
	 * @param startDate - Start date
	 * @param endDate - End date
	 * @returns Promise with proposals in date range
	 */
	async getProposalsByDateRange(
		userId: number,
		startDate: string,
		endDate: string
	): Promise<Array<ProposalResponse>> {
		const parameters = new URLSearchParams({
			dataInicio: startDate,
			dataFim: endDate,
		});

		const response = await apiClient.get<Array<ProposalResponse>>(
			`propostas/por-periodo/${userId}?${parameters.toString()}`
		);
		return response;
	},
};
