import { useState } from "react";
import { FilterSelector } from "../../ui/FilterSelector/FilterSelector";
import { UpdateButton } from "../../ui/UpdateButton/UpdateButton";
import type { Report } from "../../../common/types";
import {
	ChartLineIcon,
	DollarSignIcon,
	BriefcaseIcon,
	TrendingUpIcon,
	AlertCircleIcon,
} from "lucide-react";
import { ReportsCard } from "../../cards/ReportsCard/ReportsCard";
import { LineChartComponent } from "../../charts/line/LineChart";
import { HiresTable } from "./HiresTable";
import { ContractModal } from "./ContractModal";
import { ProposalModal } from "./ProposalModal";
import { CancelHiringModal } from "./CancelHiringModal";
import { useMyHirings, useHiringContract, useHiringProposal, useCancelHiring } from "../../../hooks/useHirings";
import { useToastStore } from "../../../store/toast/toastStore";
import { dates, values } from "./data";

const reports: Array<Report> = [
	{
		icon: <BriefcaseIcon size={20} />,
		value: 8,
		label: "Contratações",
		isUp: true,
		percentage: 14.3,
	},
	{
		icon: <DollarSignIcon size={20} />,
		value: 28500,
		label: "Valor Total Gasto",
		isUp: true,
		percentage: 8.7,
	},
	{
		icon: <TrendingUpIcon size={20} />,
		value: 6,
		label: "Contratos Ativos",
		percentage: 20,
		isUp: true,
	},
	{
		icon: <AlertCircleIcon size={20} />,
		value: 2,
		label: "Aguardando Pagamento",
		percentage: -5.2,
		isUp: false,
	},
];

export const MyHiresTab = () => {
	const [selectedFilters, setSelectedFilters] = useState<Array<string>>([]);
	const availableFilters = [
		{ id: "all", label: "Todas" },
		{ id: "active", label: "Ativas" },
		{ id: "pending", label: "Pendentes" },
		{ id: "completed", label: "Concluídas" },
		{ id: "cancelled", label: "Canceladas" },
	];

	const [selectedChartFilters, setSelectedChartFilters] = useState<Array<string>>([]);
	const chartFilters = [{ id: "spending", label: "Gastos" }];

	// Modal states
	const [contractModalOpen, setContractModalOpen] = useState(false);
	const [proposalModalOpen, setProposalModalOpen] = useState(false);
	const [cancelModalOpen, setCancelModalOpen] = useState(false);

	// Current items for modals
	const [currentContractId, setCurrentContractId] = useState<string | null>(null);
	const [currentProposalId, setCurrentProposalId] = useState<string | null>(null);
	const [currentHiringToCancel, setCurrentHiringToCancel] = useState<{ id: string; title: string } | null>(null);

	// Hooks
	const { data: hiringsData, isLoading: hiringsLoading, refetch: refetchHirings } = useMyHirings();
	const { data: contractData, isLoading: contractLoading } = useHiringContract(currentContractId || "", !!currentContractId);
	const { data: proposalData, isLoading: proposalLoading } = useHiringProposal(currentProposalId || "", !!currentProposalId);
	const cancelHiringMutation = useCancelHiring();
	const { addToast } = useToastStore();

	// Filter hirings based on selected filters
	const filteredHirings = hiringsData?.data || [];

	const handleViewContract = (contractId: string) => {
		setCurrentContractId(contractId);
		setContractModalOpen(true);
	};

	const handleViewProposal = (hiringId: string) => {
		setCurrentProposalId(hiringId);
		setProposalModalOpen(true);
	};

	const handleCancelHiring = (hiringId: string) => {
		const hiring = filteredHirings.find(h => h.id === hiringId);
		if (hiring) {
			setCurrentHiringToCancel({ id: hiringId, title: hiring.title });
			setCancelModalOpen(true);
		}
	};

	const handleConfirmCancel = async (reason: string) => {
		if (!currentHiringToCancel) return;

		try {
			await cancelHiringMutation.mutateAsync({
				hiringId: currentHiringToCancel.id,
				reason,
			});

			addToast({
				message: "Contratação cancelada com sucesso!",
				type: "success",
			});

			setCancelModalOpen(false);
			setCurrentHiringToCancel(null);
			refetchHirings();
		} catch (error) {
			addToast({
				message: "Erro ao cancelar contratação. Tente novamente.",
				type: "error",
			});
		}
	};

	const handleViewDetails = (hiringId: string) => {
		// Implementar navegação para detalhes da contratação
		console.log("Ver detalhes da contratação:", hiringId);
	};

	return (
		<div className="w-full h-full flex flex-col gap-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-gray-900">Contratações</h1>
					<p className="text-gray-600 mt-1">
						Gerencie todas as contratações que você fez como contratante
					</p>
				</div>
			</div>

			<hr className="w-full border-gray-200" />

			{/* Filters */}
			<div className="flex w-full justify-between items-center">
				<FilterSelector
					filters={availableFilters}
					selectedFilters={selectedFilters}
					onFilterChange={setSelectedFilters}
				/>
				<UpdateButton onClick={() => refetchHirings()} />
			</div>

			{/* Statistics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
				{reports.map((report, index) => (
					<ReportsCard key={index} report={report} />
				))}
			</div>

			<hr className="w-full border-gray-200" />

			{/* Spending Chart */}
			<div className="flex flex-col w-full bg-gray-50 border border-gray-200 gap-6 p-6 rounded-lg">
				<div className="w-full flex items-center justify-between">
					<div className="flex gap-3 items-center">
						<div className="bg-white border border-gray-300 rounded-lg p-2 text-gray-600">
							<ChartLineIcon size={14} />
						</div>
						<h3 className="font-medium text-gray-900">Evolução de Gastos</h3>
						<FilterSelector
							filters={chartFilters}
							selectedFilters={selectedChartFilters}
							onFilterChange={setSelectedChartFilters}
						/>
					</div>
					<UpdateButton onClick={() => {}} />
				</div>
				<LineChartComponent dates={dates} values={values} />
			</div>

			{/* Hirings Table */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="font-bold text-xl text-gray-900">Lista de Contratações</h2>
					<span className="text-sm text-gray-500">
						{filteredHirings.length} contratações encontradas
					</span>
				</div>

				<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
					{!hiringsLoading ? (
						<HiresTable
							data={filteredHirings}
							onViewContract={handleViewContract}
							onViewProposal={handleViewProposal}
							onCancelHiring={handleCancelHiring}
							onViewDetails={handleViewDetails}
						/>
					) : (
						<div className="flex items-center justify-center py-12">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
							<span className="ml-3 text-gray-600">Carregando contratações...</span>
						</div>
					)}
				</div>
			</div>

			{/* Modals */}
			<ContractModal
				isOpen={contractModalOpen}
				onClose={() => {
					setContractModalOpen(false);
					setCurrentContractId(null);
				}}
				contract={contractData || null}
				loading={contractLoading}
			/>

			<ProposalModal
				isOpen={proposalModalOpen}
				onClose={() => {
					setProposalModalOpen(false);
					setCurrentProposalId(null);
				}}
				proposal={proposalData || null}
				loading={proposalLoading}
			/>

			<CancelHiringModal
				isOpen={cancelModalOpen}
				onClose={() => {
					setCancelModalOpen(false);
					setCurrentHiringToCancel(null);
				}}
				onConfirm={handleConfirmCancel}
				hiringTitle={currentHiringToCancel?.title || ""}
				loading={cancelHiringMutation.isPending}
			/>
		</div>
	);
};
