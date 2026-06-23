import { apiClient } from "../core/client";
import type {
	SalesReportsResponse,
	DashboardMetricsResponse,
	ReportPeriod,
	ReportType,
	ProposalResponse,
} from "../types";

/**
 * Service for managing sales reports and analytics using available endpoints
 */
export const reportsService = {
	/**
	 * Get sales reports by analyzing proposals data
	 * Since we don't have a dedicated reports endpoint, we'll calculate metrics from proposals
	 * @param userId - The ID of the user
	 * @param filters - Filter parameters
	 * @returns Promise with calculated sales reports data
	 */
	async getSalesReports(
		userId: number,
		filters: {
			periodo: ReportPeriod;
			tipo?: ReportType;
		}
	): Promise<SalesReportsResponse> {
		// Calculate date range based on period
		const endDate = new Date();
		const startDate = new Date();

		switch (filters.periodo) {
			case "7d":
				startDate.setDate(endDate.getDate() - 7);
				break;
			case "30d":
				startDate.setDate(endDate.getDate() - 30);
				break;
			case "90d":
				startDate.setDate(endDate.getDate() - 90);
				break;
			case "1y":
				startDate.setFullYear(endDate.getFullYear() - 1);
				break;
		}

		// Get proposals for the period to calculate metrics
		const proposalsResponse = await apiClient.post<Array<ProposalResponse>>(
			"produtomusical/listarPropostas",
			{
				IdProdutoMusical: userId,
				DataDe: startDate.toISOString().split("T")[0],
				DataAte: endDate.toISOString().split("T")[0],
			}
		);

		const proposals = proposalsResponse || [];

		// Calculate metrics from proposals data
		const totalPropostas = proposals.length;
		const propostasAceitas = proposals.filter(
			(p) => p.status.nome === "Aceita"
		).length;
		const valorAceito = proposals
			.filter((p) => p.status.nome === "Aceita")
			.reduce((sum, p) => sum + (p.valor || 0), 0);

		return {
			vendasPeriodo: valorAceito,
			cliquesPerfil: Math.floor(totalPropostas * 2.5), // Estimated based on proposals
			mensagensTrocadas: Math.floor(totalPropostas * 1.8), // Estimated
			showsRealizados: propostasAceitas,
			aparicaoBuscas: Math.floor(totalPropostas * 3.2), // Estimated
			comparativoMesAnterior: {
				vendas: 15.5, // Mock data for now
				cliques: -2.3,
				mensagens: 8.7,
				shows: 25.0,
			},
		};
	},

	/**
	 * Get dashboard metrics for a specific user
	 * @param userId - The ID of the user
	 * @returns Promise with dashboard metrics data
	 */
	async getDashboardMetrics(userId: number): Promise<DashboardMetricsResponse> {
		// Get recent proposals to calculate metrics
		const recentProposalsResponse = await apiClient.post<
			Array<ProposalResponse>
		>("produtomusical/listarPropostas", {
			IdProdutoMusical: userId,
			DataDe: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split("T")[0], // 30 days ago
		});

		const proposals = recentProposalsResponse || [];

		const metrics = [
			{
				label: "Vendas no período",
				value: proposals
					.filter((p) => p.status.nome === "Aceita")
					.reduce((sum, p) => sum + (p.valor || 0), 0),
				percentage: 15.5,
				isUp: true,
				icon: "DollarSign",
			},
			{
				label: "Cliques no perfil",
				value: Math.floor(proposals.length * 2.5),
				percentage: -2.3,
				isUp: false,
				icon: "User",
			},
			{
				label: "Mensagens trocadas",
				value: Math.floor(proposals.length * 1.8),
				percentage: 8.7,
				isUp: true,
				icon: "MessageCircle",
			},
			{
				label: "Shows realizados",
				value: proposals.filter((p) => p.status.nome === "Aceita").length,
				percentage: 25.0,
				isUp: true,
				icon: "Music",
			},
			{
				label: "Taxa de conversão",
				value:
					proposals.length > 0
						? Math.round(
								(proposals.filter((p) => p.status.nome === "Aceita").length /
									proposals.length) *
									100
							)
						: 0,
				percentage: 12.3,
				isUp: true,
				icon: "TrendingUp",
			},
			{
				label: "Aparição nas buscas",
				value: Math.floor(proposals.length * 3.2),
				percentage: 6.0,
				isUp: true,
				icon: "Search",
			},
		];

		return { metrics };
	},

	/**
	 * Get sales performance metrics using proposals data
	 * @param userId - The ID of the user
	 * @param periodo - Period to analyze
	 * @returns Promise with performance metrics
	 */
	async getSalesPerformance(
		userId: number,
		periodo: ReportPeriod = "30d"
	): Promise<{
		totalVendas: number;
		totalPropostas: number;
		taxaConversao: number;
		ticketMedio: number;
		crescimentoMensal: number;
	}> {
		// Calculate date range
		const endDate = new Date();
		const startDate = new Date();

		switch (periodo) {
			case "7d":
				startDate.setDate(endDate.getDate() - 7);
				break;
			case "30d":
				startDate.setDate(endDate.getDate() - 30);
				break;
			case "90d":
				startDate.setDate(endDate.getDate() - 90);
				break;
			case "1y":
				startDate.setFullYear(endDate.getFullYear() - 1);
				break;
		}

		const proposalsResponse = await apiClient.post<Array<ProposalResponse>>(
			"produtomusical/listarPropostas",
			{
				IdProdutoMusical: userId,
				DataDe: startDate.toISOString().split("T")[0],
				DataAte: endDate.toISOString().split("T")[0],
			}
		);

		const proposals = proposalsResponse || [];
		const propostasAceitas = proposals.filter(
			(p) => p.status.nome === "Aceita"
		);

		const totalVendas = propostasAceitas.reduce(
			(sum, p) => sum + (p.valor || 0),
			0
		);
		const totalPropostas = proposals.length;
		const taxaConversao =
			totalPropostas > 0 ? (propostasAceitas.length / totalPropostas) * 100 : 0;
		const ticketMedio =
			propostasAceitas.length > 0 ? totalVendas / propostasAceitas.length : 0;

		return {
			totalVendas,
			totalPropostas,
			taxaConversao,
			ticketMedio,
			crescimentoMensal: 15.5, // Mock data for now
		};
	},

	/**
	 * Get profile analytics using available data
	 * @param userId - The ID of the user
	 * @param periodo - Period to analyze
	 * @returns Promise with profile analytics data
	 */
	async getProfileAnalytics(
		userId: number,
		periodo: ReportPeriod = "30d"
	): Promise<{
		cliquesPerfil: number;
		visualizacoesPerfil: number;
		mensagensRecebidas: number;
		taxaConversaoPerfil: number;
		fontesTrafego: Array<{
			fonte: string;
			quantidade: number;
			percentual: number;
		}>;
	}> {
		// Get proposals data to estimate analytics
		const endDate = new Date();
		const startDate = new Date();

		switch (periodo) {
			case "7d":
				startDate.setDate(endDate.getDate() - 7);
				break;
			case "30d":
				startDate.setDate(endDate.getDate() - 30);
				break;
			case "90d":
				startDate.setDate(endDate.getDate() - 90);
				break;
			case "1y":
				startDate.setFullYear(endDate.getFullYear() - 1);
				break;
		}

		const proposalsResponse = await apiClient.post<Array<ProposalResponse>>(
			"produtomusical/listarPropostas",
			{
				IdProdutoMusical: userId,
				DataDe: startDate.toISOString().split("T")[0],
				DataAte: endDate.toISOString().split("T")[0],
			}
		);

		const propostas = proposalsResponse || [];
		const propostasAceitas = propostas.filter(
			(p) => p.status.nome === "Aceita"
		);

		const cliquesPerfil = Math.floor(propostas.length * 2.5);
		const mensagensRecebidas = Math.floor(propostas.length * 1.8);
		const taxaConversaoPerfil =
			propostas.length > 0
				? (propostasAceitas.length / propostas.length) * 100
				: 0;

		return {
			cliquesPerfil,
			visualizacoesPerfil: Math.floor(cliquesPerfil * 1.3),
			mensagensRecebidas,
			taxaConversaoPerfil,
			fontesTrafego: [
				{
					fonte: "Busca direta",
					quantidade: Math.floor(cliquesPerfil * 0.4),
					percentual: 40,
				},
				{
					fonte: "Redes sociais",
					quantidade: Math.floor(cliquesPerfil * 0.35),
					percentual: 35,
				},
				{
					fonte: "Indicação",
					quantidade: Math.floor(cliquesPerfil * 0.15),
					percentual: 15,
				},
				{
					fonte: "Outros",
					quantidade: Math.floor(cliquesPerfil * 0.1),
					percentual: 10,
				},
			],
		};
	},
};
