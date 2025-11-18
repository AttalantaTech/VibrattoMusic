import {
	DollarSignIcon,
	UserIcon,
	TrendingUpIcon,
	MusicIcon,
	MessageCircleIcon,
	Search,
} from "lucide-react";
import { FilterSelector } from "../../ui/FilterSelector/FilterSelector";
import { useState } from "react";
import { UpdateButton } from "../../ui/UpdateButton/UpdateButton";
import { ReportsCard } from "../../cards/ReportsCard/ReportsCard";
import { useFormattedReports } from "../../../hooks/useReports";
import { ReportsSkeleton } from "../../ui/LoadingStates";
import { ErrorState } from "../../ui/LoadingStates";
import type { ReportPeriod } from "../../../api/types";

export const Reports = () => {
	const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("30d");

	const availableFilters = [
		{ id: "7d", label: "Últimos 7 dias" },
		{ id: "30d", label: "Últimos 30 dias" },
		{ id: "90d", label: "Último trimestre" },
		{ id: "1y", label: "Último ano" },
	];

	// Get formatted reports data from API
	const { data: reportsData, isLoading, error, refetch } = useFormattedReports(selectedPeriod);

	// Create reports array from API data
	const reports = reportsData ? [
		{
			icon: <DollarSignIcon size={20} />,
			value: reportsData.vendasPeriodo.value,
			label: reportsData.vendasPeriodo.label,
			isUp: reportsData.vendasPeriodo.isUp,
			percentage: reportsData.vendasPeriodo.percentage,
		},
		{
			icon: <UserIcon size={20} />,
			value: reportsData.cliquesPerfil.value,
			label: reportsData.cliquesPerfil.label,
			isUp: reportsData.cliquesPerfil.isUp,
			percentage: reportsData.cliquesPerfil.percentage,
		},
		{
			icon: <TrendingUpIcon size={20} />,
			value: reportsData.vendasPeriodo.value, // Using sales value for conversion rate
			label: "Taxa de conversão",
			isUp: reportsData.vendasPeriodo.isUp,
			percentage: reportsData.vendasPeriodo.percentage,
		},
		{
			icon: <MusicIcon size={20} />,
			value: reportsData.showsRealizados.value,
			label: reportsData.showsRealizados.label,
			isUp: reportsData.showsRealizados.isUp,
			percentage: reportsData.showsRealizados.percentage,
		},
		{
			icon: <MessageCircleIcon size={20} />,
			value: reportsData.mensagensTrocadas.value,
			label: reportsData.mensagensTrocadas.label,
			isUp: reportsData.mensagensTrocadas.isUp,
			percentage: reportsData.mensagensTrocadas.percentage,
		},
		{
			icon: <Search size={20} />,
			value: reportsData.aparicaoBuscas.value,
			label: reportsData.aparicaoBuscas.label,
			isUp: reportsData.aparicaoBuscas.isUp,
			percentage: reportsData.aparicaoBuscas.percentage,
		},
	] : [];

	// Handle period filter change
	const handlePeriodChange = (selectedIds: string[]) => {
		const periodId = selectedIds[0];
		if (periodId) {
			const periodMap: Record<string, ReportPeriod> = {
				"7d": "7d",
				"30d": "30d",
				"90d": "90d",
				"1y": "1y"
			};
			setSelectedPeriod(periodMap[periodId] || "30d");
		}
	};

	// Handle refresh
	const handleRefresh = () => {
		refetch();
	};

	// Show loading state
	if (isLoading) {
		return <ReportsSkeleton />;
	}

	// Show error state
	if (error) {
		return (
			<ErrorState
				message="Erro ao carregar dados dos relatórios"
				onRetry={handleRefresh}
			/>
		);
	}

	return (
		<div className="w-full flex flex-col gap-4">
			<div className="flex w-full items-center justify-between">
				<FilterSelector
					filters={availableFilters}
					selectedFilters={[selectedPeriod]}
					onFilterChange={handlePeriodChange}
				/>
				<UpdateButton onClick={handleRefresh} />
			</div>

			<div className="flex items-center w-full justify-center">
				<div className="grid grid-cols-3 gap-4 w-full">
					{reports.map((report, index) => (
						<ReportsCard key={index} report={report} />
					))}
				</div>
			</div>
		</div>
	);
};
