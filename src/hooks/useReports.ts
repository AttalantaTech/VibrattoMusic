import { useQuery } from "@tanstack/react-query";
import { reportsService } from "../api/services/reportsService";
import { useActiveMusicalProduct } from "./useActiveMusicalProduct";
import type { ReportPeriod, ReportType } from "../api/types";

/**
 * Hook to fetch sales reports for the current user
 */
export const useSalesReports = (
	periodo: ReportPeriod = "30d",
	tipo: ReportType = "vendas"
) => {
	const { activeProduct } = useActiveMusicalProduct();

	return useQuery({
		queryKey: ["sales-reports", periodo, tipo, activeProduct?.id],
		queryFn: () => {
			if (!activeProduct?.id) {
				throw new Error("No active product found");
			}
			return reportsService.getSalesReports(Number(activeProduct.id), {
				periodo,
				tipo,
			});
		},
		enabled: !!activeProduct?.id,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

/**
 * Hook to fetch dashboard metrics for the current user
 */
export const useDashboardMetrics = () => {
	const { activeProduct } = useActiveMusicalProduct();

	return useQuery({
		queryKey: ["dashboard-metrics", activeProduct?.id],
		queryFn: () => {
			if (!activeProduct?.id) {
				throw new Error("No active product found");
			}
			return reportsService.getDashboardMetrics(Number(activeProduct.id));
		},
		enabled: !!activeProduct?.id,
		staleTime: 10 * 60 * 1000, // 10 minutes
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

/**
 * Hook to fetch sales performance metrics
 */
export const useSalesPerformance = (periodo: ReportPeriod = "30d") => {
	const { activeProduct } = useActiveMusicalProduct();

	return useQuery({
		queryKey: ["sales-performance", periodo, activeProduct?.id],
		queryFn: () => {
			if (!activeProduct?.id) {
				throw new Error("No active product found");
			}
			return reportsService.getSalesPerformance(Number(activeProduct.id), periodo);
		},
		enabled: !!activeProduct?.id,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

/**
 * Hook to fetch profile analytics
 */
export const useProfileAnalytics = (periodo: ReportPeriod = "30d") => {
	const { activeProduct } = useActiveMusicalProduct();

	return useQuery({
		queryKey: ["profile-analytics", periodo, activeProduct?.id],
		queryFn: () => {
			if (!activeProduct?.id) {
				throw new Error("No active product found");
			}
			return reportsService.getProfileAnalytics(Number(activeProduct.id), periodo);
		},
		enabled: !!activeProduct?.id,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

/**
 * Hook to get formatted reports data for UI components
 * This hook transforms the raw API data into the format expected by the UI
 */
export const useFormattedReports = (
	periodo: ReportPeriod = "30d",
	tipo: ReportType = "vendas"
) => {
	const { data: reportsData, isLoading, error, refetch } = useSalesReports(periodo, tipo);

	// Transform data for UI consumption
	const formattedData = reportsData ? {
		vendasPeriodo: {
			value: reportsData.vendasPeriodo,
			label: "Vendas no período",
			isUp: reportsData.comparativoMesAnterior.vendas >= 0,
			percentage: Math.abs(reportsData.comparativoMesAnterior.vendas),
			icon: "DollarSign",
		},
		cliquesPerfil: {
			value: reportsData.cliquesPerfil,
			label: "Cliques no perfil",
			isUp: reportsData.comparativoMesAnterior.cliques >= 0,
			percentage: Math.abs(reportsData.comparativoMesAnterior.cliques),
			icon: "User",
		},
		mensagensTrocadas: {
			value: reportsData.mensagensTrocadas,
			label: "Mensagens trocadas",
			isUp: reportsData.comparativoMesAnterior.mensagens >= 0,
			percentage: Math.abs(reportsData.comparativoMesAnterior.mensagens),
			icon: "MessageCircle",
		},
		showsRealizados: {
			value: reportsData.showsRealizados,
			label: "Shows realizados",
			isUp: reportsData.comparativoMesAnterior.shows >= 0,
			percentage: Math.abs(reportsData.comparativoMesAnterior.shows),
			icon: "Music",
		},
		aparicaoBuscas: {
			value: reportsData.aparicaoBuscas,
			label: "Aparição nas buscas",
			isUp: true, // Assuming this is always positive
			percentage: 0,
			icon: "TrendingUp",
		},
	} : null;

	return {
		data: formattedData,
		isLoading,
		error,
		rawData: reportsData,
		refetch,
	};
};
