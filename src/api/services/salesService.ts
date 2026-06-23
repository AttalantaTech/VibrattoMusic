import { apiClient } from "../core/client";
import type {
	SalesChartResponse,
	ChartPeriod,
	ProposalResponse,
	ProposalStatus,
} from "../types";

/**
 * Service for managing sales data and charts using available endpoints
 */
export const salesService = {
	/**
	 * Get sales chart data by analyzing proposals over time
	 * Since we don't have a dedicated chart endpoint, we'll create chart data from proposals
	 * @param params - Parameters for the chart data
	 * @returns Promise with calculated sales chart data
	 */
	async getSalesChartData(params: {
		userId: number;
		periodo: ChartPeriod;
	}): Promise<SalesChartResponse> {
		// Calculate date range based on period
		const endDate = new Date();
		const startDate = new Date();

		let daysDiff: number;
		switch (params.periodo) {
			case "7d":
				startDate.setDate(endDate.getDate() - 7);
				daysDiff = 7;
				break;
			case "30d":
				startDate.setDate(endDate.getDate() - 30);
				daysDiff = 30;
				break;
			case "90d":
				startDate.setDate(endDate.getDate() - 90);
				daysDiff = 90;
				break;
			case "1y":
				startDate.setFullYear(endDate.getFullYear() - 1);
				daysDiff = 365;
				break;
		}

		// Get proposals for the period
		const proposalsResponse = await apiClient.post<Array<ProposalResponse>>(
			"produtomusical/listarPropostas",
			{
				IdProdutoMusical: params.userId,
				DataDe: startDate.toISOString().split("T")[0],
				DataAte: endDate.toISOString().split("T")[0],
			}
		);

		const proposals = proposalsResponse || [];

		// Group proposals by date and calculate daily values
		const dailyData: { [date: string]: number } = {};

		// Initialize all dates with 0
		for (let i = 0; i <= daysDiff; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);
			const dateStr = date.toISOString().split("T")[0];
			if (dateStr) {
				dailyData[dateStr] = 0;
			}
		}

		// Sum values by date for accepted proposals
		proposals
			.filter((p) => p.status.nome === "Aceita")
			.forEach((proposal) => {
				const proposalDate = new Date(proposal.dataCriacao)
					.toISOString()
					.split("T")[0];
				if (proposalDate && dailyData[proposalDate] !== undefined) {
					dailyData[proposalDate] += proposal.valor || 0;
				}
			});

		// Create chart data
		const labels: string[] = [];
		const values: number[] = [];
		let totalVendas = 0;

		Object.entries(dailyData)
			.sort(([a], [b]) => a.localeCompare(b))
			.forEach(([date, value]) => {
				labels.push(date);
				values.push(value);
				totalVendas += value;
			});

		// Calculate growth (simplified - compare first and last periods)
		const midPoint = Math.floor(values.length / 2);
		const firstHalf = values
			.slice(0, midPoint)
			.reduce((sum, val) => sum + val, 0);
		const secondHalf = values
			.slice(midPoint)
			.reduce((sum, val) => sum + val, 0);
		const crescimentoPercentual =
			firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

		return {
			labels,
			values,
			periodo: params.periodo,
			totalVendas,
			crescimentoPercentual,
		};
	},

	/**
	 * Get sales summary for a specific period
	 * @param userId - The ID of the user
	 * @param periodo - The period to analyze
	 * @returns Promise with sales summary data
	 */
	async getSalesSummary(
		userId: number,
		periodo: ChartPeriod = "30d"
	): Promise<{
		totalVendas: number;
		totalPropostas: number;
		vendasPendentes: number;
		vendasConcluidas: number;
		receitaTotal: number;
		receitaMensal: number;
		crescimentoPercentual: number;
	}> {
		const response = await apiClient.get(
			`vendas/resumo/${userId}?periodo=${periodo}`
		);
		return response as {
			totalVendas: number;
			totalPropostas: number;
			vendasPendentes: number;
			vendasConcluidas: number;
			receitaTotal: number;
			receitaMensal: number;
			crescimentoPercentual: number;
		};
	},

	/**
	 * Get sales by status
	 * @param userId - The ID of the user
	 * @param periodo - The period to analyze
	 * @returns Promise with sales grouped by status
	 */
	async getSalesByStatus(
		userId: number,
		periodo: ChartPeriod = "30d"
	): Promise<{
		[status in ProposalStatus]: {
			count: number;
			value: number;
			percentage: number;
		};
	}> {
		const response = await apiClient.get(
			`vendas/por-status/${userId}?periodo=${periodo}`
		);
		return response as {
			pendente: { count: number; value: number; percentage: number };
			aguardando_pagamento: {
				count: number;
				value: number;
				percentage: number;
			};
			aceito: { count: number; value: number; percentage: number };
			concluido: { count: number; value: number; percentage: number };
			rejeitado: { count: number; value: number; percentage: number };
			cancelado: { count: number; value: number; percentage: number };
		};
	},

	/**
	 * Get sales trends over time
	 * @param userId - The ID of the user
	 * @param periodo - The period to analyze
	 * @returns Promise with sales trends data
	 */
	async getSalesTrends(
		userId: number,
		periodo: ChartPeriod = "30d"
	): Promise<{
		trends: Array<{
			date: string;
			vendas: number;
			receita: number;
			propostas: number;
		}>;
		periodo: string;
		totalPeriodo: {
			vendas: number;
			receita: number;
			propostas: number;
		};
	}> {
		const response = await apiClient.get(
			`vendas/tendencias/${userId}?periodo=${periodo}`
		);
		return response as {
			trends: {
				date: string;
				vendas: number;
				receita: number;
				propostas: number;
			}[];
			periodo: string;
			totalPeriodo: { vendas: number; receita: number; propostas: number };
		};
	},

	/**
	 * Get top selling periods or months
	 * @param userId - The ID of the user
	 * @param periodo - The period to analyze
	 * @returns Promise with top selling periods
	 */
	async getTopSellingPeriods(
		userId: number,
		periodo: ChartPeriod = "1y"
	): Promise<{
		topPeriods: Array<{
			period: string;
			vendas: number;
			receita: number;
			rank: number;
		}>;
	}> {
		const response = await apiClient.get(
			`vendas/top-periodos/${userId}?periodo=${periodo}`
		);
		return response as {
			topPeriods: {
				period: string;
				vendas: number;
				receita: number;
				rank: number;
			}[];
		};
	},

	/**
	 * Export sales data
	 * @param userId - The ID of the user
	 * @param filters - Export filters
	 * @returns Promise with export data
	 */
	async exportSalesData(
		userId: number,
		filters: {
			periodo: ChartPeriod;
			formato: "csv" | "excel" | "pdf";
			status?: ProposalStatus[];
		}
	): Promise<{
		downloadUrl: string;
		fileName: string;
		expiresAt: string;
	}> {
		const params = new URLSearchParams({
			periodo: filters.periodo,
			formato: filters.formato,
		});

		if (filters.status && filters.status.length > 0) {
			params.append("status", filters.status.join(","));
		}

		const response = await apiClient.post(
			`vendas/exportar/${userId}?${params.toString()}`
		);
		return response as {
			downloadUrl: string;
			fileName: string;
			expiresAt: string;
		};
	},
};
