// import { FilterSelector } from "../../ui/FilterSelector/FilterSelector";
// import { UpdateButton } from "../../ui/UpdateButton/UpdateButton";
// import { Reports } from "./Reports";
// import { LineChartComponent } from "../../charts/line/LineChart";

// const [selectedChartFilters, setSelectedChartFilters] = useState<
// 	Array<string>
// >([]);
// const chartFilters = [{ id: "sales", label: "Vendas" }];

{
	/* <h1 className="font-bold text-2xl">Relatórios</h1>
			<hr className="w-full" />

			<Reports />

			<div className="flex flex-col w-full bg-gray-50 border border-gray-200 gap-6 p-6 rounded-lg">
				<div className="w-full flex items-center justify-between">
					<div className="flex gap-3 items-center">
						<div className="bg-white border border-gay-300 rounded-lg p-2 text-gray-600">
							<ChartLineIcon size={14} />
						</div>
						<FilterSelector
							filters={chartFilters}
							selectedFilters={selectedChartFilters}
							onFilterChange={setSelectedChartFilters}
						/>
					</div>
					<UpdateButton
						onClick={() => {
							// Handle update
						}}
					/>
				</div>
				<LineChartComponent
					dates={
						filteredProposals?.data.map((event) =>
							new Date(event.dataCriacao).toLocaleDateString("pt-BR")
						) || []
					}
					values={filteredProposals?.data.map((event) => event.valor) || []}
				/>
			</div> */
}

import { Check, ChevronDown, FileText, Plus } from "lucide-react";
import { Button } from "../../ui/Button/Button";

import { useCallback, useMemo, useState } from "react";

import { EventsTable } from "../../EventsTable";
import type { EventsTableSaleData } from "../../EventsTable/types";
import { Dropdown } from "../../ui/Dropdown/Dropdown";
import {
	useFilteredProposals,
	useUpdateProposalStatus,
} from "../../../hooks/useProposals";
import { EmptyState, ErrorState, TableSkeleton } from "../../ui/LoadingStates";

import { useAuthStore } from "../../../store/authStore";
import { splitOnUppercase } from "../../../utils/labels";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { ProposalResponse } from "../../../api/types";
import { ProposalDetailsModal } from "../Proposals/components/ProposalDetailsModal";
import { SendProposalModal } from "../Proposals/components/SendProposalModal";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { ProposalStatusCard } from "@/components/BandProfile/Proposals/components/ProposalStatusCard";
import { useSendStatusMessage } from "@/features/message/hooks/useSendStatusMessage";
import { entityLinks } from "@/features/message/utils/messageTemplates";
import { showApiError } from "@/utils/showApiError";

interface AbaVendasProps {
	productId?: number;
}

export const SalesTab = ({ productId }: AbaVendasProps) => {
	const navigate = useNavigate();

	const { activeProduct } = useMusicalProductStore();
	const currentUser = useAuthStore((state) => state.user);
	const updateStatusMutation = useUpdateProposalStatus();
	const { sendStatusMessage } = useSendStatusMessage();

	const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
	const [isProposalDetailsModalOpen, setIsProposalDetailsModalOpen] =
		useState(false);
	const [proposalDetails, setProposalDetails] =
		useState<ProposalResponse | null>(null);
	const [isLoadingPaidSign, setIsLoadingPaidSign] = useState(false);
	const [isLoadingCancel, setIsLoadingCancel] = useState(false);
	const [statusFilter, setStatusFilter] = useState<string>("Todos os status");

	const currentProductId =
		productId || (activeProduct?.id ? Number(activeProduct.id) : undefined);

	const {
		data: filteredProposals,
		isLoading,
		error,
	} = useFilteredProposals({
		status: statusFilter === "Todos os status" ? undefined : [statusFilter],
		IdProdutoMusical: activeProduct?.id,
	});

	const possibleStatusFilters = [
		"Todos os status",
		"Pendente",
		"Aceita",
		"Rejeitada",
		"SinalPago",
		"EnvioDocumento",
		"EnvioSignatarios",
		"EnvioAssinatura",
		"AguardandoAssinatura",
		"ContratoAssinado",
	];

	const handleSeeProposal = useCallback(
		(proposalId: string) => {
			setProposalDetails(
				filteredProposals?.data.find(
					(p) => p.identificadorUnico === proposalId
				) || null
			);
			setIsProposalDetailsModalOpen(true);
		},
		[filteredProposals?.data]
	);

	const handleSeeContract = useCallback(
		async (proposalId: string) => {
			if (proposalId) {
				await navigate({
					to: "/band/contract/$id",
					params: { id: proposalId },
				});
			} else {
				toast.error(
					"Não foi possível acessar o contrato. Identificador da proposta não encontrado."
				);
			}
		},
		[navigate]
	);

	const handleEditContract = useCallback(
		(proposalId: string) => {
			setIsProposalModalOpen(true);
			setProposalDetails(
				filteredProposals?.data.find(
					(p) => p.identificadorUnico === proposalId
				) || null
			);
		},
		[filteredProposals?.data]
	);

	const handlePaidSign = async (proposalId: number) => {
		try {
			setIsLoadingPaidSign(true);
			await updateStatusMutation.mutateAsync({
				proposalId: proposalId,
				status: "sinalPago",
			});

			sendStatusMessage({
				type: "proposalPaidSign",
				recipientId: proposalDetails?.produtoMusical.id || 0,
				recipientName: proposalDetails?.produtoMusical.nome,
				link: entityLinks.proposalTab(proposalDetails?.id || 0),
				errorMessage: "Erro ao enviar sua requisição",
				payload: {},
			});
		} catch (error) {
			showApiError(error, "Erro ao pagar o sinal. Tente novamente.");
		} finally {
			setIsLoadingPaidSign(false);
		}
	};

	const handleCounterProposal = () => {
		setIsProposalModalOpen(true);
	};

	const handleCancelProposal = useCallback(
		async (proposalId: number | null) => {
			try {
				setIsLoadingCancel(true);
				if (!proposalId) {
					toast.error("Proposta não encontrada.");
					return;
				}

				await updateStatusMutation.mutateAsync({
					proposalId,
					status: "cancelado",
				});

				sendStatusMessage({
					type: "proposalCanceled",
					recipientId: proposalDetails?.produtoMusical.id || 0,
					recipientName: proposalDetails?.produtoMusical.nome,
					link: entityLinks.proposalTab(proposalDetails?.id || 0),

					errorMessage: "Erro ao enviar requisição",
					payload: {},
				});
			} catch (error) {
				showApiError(error, "Error updating proposal status:");
			} finally {
				setIsLoadingCancel(false);
			}
		},
		[proposalDetails, sendStatusMessage, updateStatusMutation]
	);

	const tableData: EventsTableSaleData =
		useMemo(
			() =>
				filteredProposals?.data.map((event) => {
					const isContractor = event.idContratante === currentUser?.id;

					return {
						event: {
							id: event.identificadorUnico,
							title: event.descricao,
							date: event.dataCriacao,
						},
						status: event.status.nome,
						statusComponent: <ProposalStatusCard name={event.status.nome} />,
						clientName: event.contratante.nome,
						value: event.valor,
						aceitaContraProposta: event.aceitaContraProposta,
						canSign:
							event.status.nome === "AguardandoAssinatura" &&
							((!event.assinaturaContratante && isContractor) ||
								(!event.assinaturaContratado && !isContractor)),

						onCounterProposal: handleCounterProposal,
						onSeeProposal: handleSeeProposal,
						onSeeContract: handleSeeContract,
						onEditContract: handleEditContract,
					};
				}),
			[
				filteredProposals?.data,
				currentUser?.id,
				handleSeeProposal,
				handleSeeContract,
				handleEditContract,
			]
		) || [];

	return (
		<div className="w-full h-full flex flex-col gap-4">
			<div className="flex w-full items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl">Minhas Vendas</h1>
					<p className="text-gray-600 mt-1">
						Gerencie suas vendas e propostas enviadas aos clientes
					</p>
				</div>
				<Button
					className="gap-3"
					onClick={() => {
						setIsProposalModalOpen(true);
					}}
				>
					<Plus />
					Cirar Proposta Avulsa
				</Button>
			</div>
			<hr className="w-full" />

			<div className="flex justify-between">
				<div className="text-black mt-1 flex items-center gap-4">
					<p className="font-bold">Filtrar por status:</p>
					<Dropdown
						align="left"
						className="p-0.5"
						trigger={
							<Button
								variant="outline"
								className="min-w-[180px] justify-between"
							>
								{splitOnUppercase(statusFilter)}
								<ChevronDown className="h-4 w-4 ml-2" />
							</Button>
						}
					>
						{possibleStatusFilters.map((item) => (
							<div className="flex w-full" key={item}>
								<button
									className="flex justify-between items-center rounded-md px-4 py-2 text-left hover:bg-gray-100 w-full"
									onClick={() => {
										setStatusFilter(item);
									}}
								>
									{splitOnUppercase(item)}
									{item === statusFilter && <Check color="gray" size={16} />}
								</button>
							</div>
						))}
					</Dropdown>
				</div>
				<p className="text-gray-600 text-sm">
					{filteredProposals?.data.length} de{" "}
					{filteredProposals?.pagination.total} vendas
				</p>
			</div>

			{isLoading && <TableSkeleton />}
			{error && !isLoading && (
				<ErrorState
					message="Erro ao carregar vendas e propostas"
					onRetry={() => {
						window.location.reload();
					}}
				/>
			)}
			{!isLoading && !error && tableData.length === 0 && (
				<EmptyState
					icon={<FileText className="h-12 w-12 text-gray-400" />}
					title={"Nenhuma venda encontrada"}
					message={
						filteredProposals && filteredProposals?.pagination.total > 0
							? "Tente ajustar os filtros."
							: "Você ainda não tem vendas. Crie sua primeira proposta para começar."
					}
					action={
						filteredProposals &&
						filteredProposals?.pagination.total === 0 && (
							<Button
								onClick={() => {
									setIsProposalModalOpen(true);
								}}
								className="flex items-center gap-2 bg-primary-600 hover:bg-blue-700"
							>
								<Plus className="h-4 w-4" />
								Criar Primeira Proposta
							</Button>
						)
					}
				/>
			)}
			{tableData.length > 0 && (
				<EventsTable dataSales={tableData} mode="sale" />
			)}

			<SendProposalModal
				isOpen={isProposalModalOpen}
				proposal={proposalDetails}
				onClose={() => {
					setIsProposalModalOpen(false);
					setProposalDetails(null);
				}}
				recipientId={currentProductId}
			/>

			<ProposalDetailsModal
				isOpen={isProposalDetailsModalOpen}
				mode="Contracted"
				onClose={() => {
					setIsProposalDetailsModalOpen(false);
					setProposalDetails(null);
				}}
				proposal={proposalDetails}
				onPaidSign={handlePaidSign}
				onCancel={handleCancelProposal}
				onSeeContract={handleSeeContract}
				isLoadingPaidSign={isLoadingPaidSign}
				isLoadingCancel={isLoadingCancel}
			/>
		</div>
	);
};
