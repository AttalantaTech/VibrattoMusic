import { useQuery } from "@tanstack/react-query";
import { salesService } from "../api/services/salesService";
import { useActiveMusicalProduct } from "./useActiveMusicalProduct";
import type { ChartPeriod } from "../api/types";

/**
 * Hook to fetch sales chart data for the current user
 */
export const useSalesChart = (periodo: ChartPeriod = "30d") => {
	const { activeProduct } = useActiveMusicalProduct();

	return useQuery({
		queryKey: ["sales-chart", periodo, activeProduct?.id],
		queryFn: () => {
			if (!activeProduct?.id) {
				throw new Error("No active product found");
			}
			return salesService.getSalesChartData({
				userId: Number(activeProduct.id),
				periodo,
			});
		},
		enabled: !!activeProduct?.id,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

/**
 * Hook to fetch sales summary for the current user
 */
export const useSalesSummary = (periodo: ChartPeriod = "30d") => {
	const { activeProduct } = useActiveMusicalProduct();

	return useQuery({
		queryKey: ["sales-summary", periodo, activeProduct?.id],
		queryFn: () => {
			if (!activeProduct?.id) {
				throw new Error("No active product found");
			}
			return salesService.getSalesSummary(Number(activeProduct.id), periodo);
		},
		enabled: !!activeProduct?.id,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

/**
 * Hook to fetch sales by status for the current user
 */
export const useSalesByStatus = (periodo: ChartPeriod = "30d") => {
	const { activeProduct } = useActiveMusicalProduct();

	return useQuery({
		queryKey: ["sales-by-status", periodo, activeProduct?.id],
		queryFn: () => {
			if (!activeProduct?.id) {
				throw new Error("No active product found");
			}
			return salesService.getSalesByStatus(Number(activeProduct.id), periodo);
		},
		enabled: !!activeProduct?.id,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

/**
 * Hook to fetch sales trends for the current user
 */
export const useSalesTrends = (periodo: ChartPeriod = "30d") => {
	const { activeProduct } = useActiveMusicalProduct();

	return useQuery({
		queryKey: ["sales-trends", periodo, activeProduct?.id],
		queryFn: () => {
			if (!activeProduct?.id) {
				throw new Error("No active product found");
			}
			return salesService.getSalesTrends(Number(activeProduct.id), periodo);
		},
		enabled: !!activeProduct?.id,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

/**
 * Hook to fetch top selling periods for the current user
 */
export const useTopSellingPeriods = (periodo: ChartPeriod = "1y") => {
	const { activeProduct } = useActiveMusicalProduct();

	return useQuery({
		queryKey: ["top-selling-periods", periodo, activeProduct?.id],
		queryFn: () => {
			if (!activeProduct?.id) {
				throw new Error("No active product found");
			}
			return salesService.getTopSellingPeriods(Number(activeProduct.id), periodo);
		},
		enabled: !!activeProduct?.id,
		staleTime: 10 * 60 * 1000, // 10 minutes (less frequent updates)
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

/**
 * Hook to get formatted chart data ready for UI consumption
 * This transforms the raw API data into the format expected by the chart component
 */
export const useFormattedChartData = (periodo: ChartPeriod = "30d") => {
	const { data: chartData, isLoading, error } = useSalesChart(periodo);

	// Format data for the LineChartComponent
	const formattedData = chartData ? {
		labels: chartData.labels,
		values: chartData.values,
		title: `Variação de Valores - ${periodo}`,
		totalValue: chartData.totalVendas,
		growthPercentage: chartData.crescimentoPercentual,
	} : null;

	return {
		data: formattedData,
		rawData: chartData,
		isLoading,
		error,
		hasData: chartData && chartData.labels.length > 0 && chartData.values.length > 0,
	};
};

/**
 * Hook to export sales data
 */
export const useExportSalesData = () => {
	const { activeProduct } = useActiveMusicalProduct();

	const exportData = async (filters: {
		periodo: ChartPeriod;
		formato: "csv" | "excel" | "pdf";
		status?: Array<"pendente" | "aguardando_pagamento" | "aceito" | "concluido" | "rejeitado" | "cancelado">;
	}) => {
		if (!activeProduct?.id) {
			throw new Error("No active product found");
		}

		return await salesService.exportSalesData(Number(activeProduct.id), filters);
	};

	return {
		exportData,
		userId: activeProduct?.id,
	};
};
