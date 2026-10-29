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
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { ProposalResponse } from "../../../api/types";
import { ProposalDetailsModal } from "../Proposals/components/ProposalDetailsModal";
import { SendProposalModal } from "../Proposals/components/SendProposalModal";
import { ConfirmDownPaymentDialog } from "../Proposals/components/ConfirmDownPaymentDialog";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { ProposalStatusCard } from "@/components/BandProfile/Proposals/components/ProposalStatusCard";
import { useProposalFromLink } from "@/components/BandProfile/Proposals/hooks/useProposalFromLink";
import {
	proposalStatusFilters,
	proposalStatusLabel,
} from "@/components/BandProfile/Proposals/components/ProposalStatusCard/types";
import { useSendStatusMessage } from "@/features/message/hooks/useSendStatusMessage";
import { entityLinks } from "@/features/message/utils/messageTemplates";
import {
	proposalParties,
	resolveStatusSender,
} from "@/features/message/utils/resolveStatusSender";
import { showApiError } from "@/utils/showApiError";
import { useConversations } from "@/hooks/useMessaging";
import { ShareLink } from "@/components/ui/ShareLink/ShareLink";
import type { Conversation } from "@/api/services/messages/types";

export const SalesTab = () => {
	const navigate = useNavigate();

	const { activeProduct } = useMusicalProductStore();
	const currentUser = useAuthStore((state) => state.user);
	const updateStatusMutation = useUpdateProposalStatus();
	const { sendStatusMessage } = useSendStatusMessage();

	const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
	// Rejected proposal being answered with a counter-proposal
	const [counterProposalOf, setCounterProposalOf] =
		useState<ProposalResponse | null>(null);
	const [isProposalDetailsModalOpen, setIsProposalDetailsModalOpen] =
		useState(false);
	const [proposalDetails, setProposalDetails] =
		useState<ProposalResponse | null>(null);
	const [isLoadingPaidSign, setIsLoadingPaidSign] = useState(false);
	// Proposal waiting for the "received the down payment?" confirmation
	const [proposalToConfirmPayment, setProposalToConfirmPayment] =
		useState<ProposalResponse | null>(null);
	const [isLoadingCancel, setIsLoadingCancel] = useState(false);
	const [statusFilter, setStatusFilter] = useState<string>("Todos os status");
	// identificadorUnico of the proposal being shared (null = modal closed)
	const [shareProposalId, setShareProposalId] = useState<string | null>(null);

	const {
		data: filteredProposals,
		isLoading,
		error,
	} = useFilteredProposals({
		status: statusFilter === "Todos os status" ? undefined : [statusFilter],
		IdProdutoMusical: activeProduct?.id,
	});

	const { data: conversationsData } = useConversations({
		IdProdutoMusical: activeProduct?.id || null,
		enabled: false,
	});

	const conversation = useMemo<Conversation | null>(() => {
		if (!proposalDetails || !conversationsData) return null;

		const { produtoMusicalContratanteId, contratanteId } =
			proposalParties(proposalDetails);

		return (
			conversationsData.find((c) => {
				if (c.produtoMusicalId !== proposalDetails.produtoMusical.id)
					return false;

				return produtoMusicalContratanteId
					? c.produtoMusicalContratanteId === produtoMusicalContratanteId
					: !c.produtoMusicalContratanteId && c.contratanteId === contratanteId;
			}) ?? null
		);
	}, [conversationsData, proposalDetails]);

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

	const handleOpenLinkedProposal = useCallback((proposal: ProposalResponse) => {
		setProposalDetails(proposal);
		setIsProposalDetailsModalOpen(true);
	}, []);

	useProposalFromLink({
		tab: "sales",
		proposals: filteredProposals?.data,
		onOpen: handleOpenLinkedProposal,
	});

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

	// It used to open an empty form with no contractor, so the "counter-
	// proposal" went to the band itself; it now starts from the rejected one
	const handleCounterProposal = useCallback(
		(proposalId: string) => {
			const rejected = filteredProposals?.data.find(
				(p) => p.identificadorUnico === proposalId
			);
			if (!rejected) return;

			setProposalDetails(null);
			setCounterProposalOf(rejected);
			setIsProposalModalOpen(true);
		},
		[filteredProposals?.data]
	);

	const handleOpenConfirmPayment = useCallback(
		(proposalId: string) => {
			setProposalToConfirmPayment(
				filteredProposals?.data.find(
					(p) => p.identificadorUnico === proposalId
				) || null
			);
		},
		[filteredProposals?.data]
	);

	const handlePaidSign = async (proposal: ProposalResponse) => {
		try {
			setIsLoadingPaidSign(true);
			await updateStatusMutation.mutateAsync({
				proposalId: proposal.id,
				status: "sinalPago",
			});
			setProposalToConfirmPayment(null);

			sendStatusMessage({
				type: "proposalPaidSign",
				...resolveStatusSender(proposalParties(proposal), "contratado"),
				// Without the id, chat/obter finds the conversation from the parties
				produtoMusicalName: proposal.produtoMusical.nome,
				link: entityLinks.proposalTab(proposal.id),
				errorMessage: "Erro ao enviar sua requisição",
				payload: {},
			});
		} catch (error) {
			showApiError(error, "Erro ao confirmar o sinal. Tente novamente.");
		} finally {
			setIsLoadingPaidSign(false);
		}
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

				// The conversations query only reads the cache: when it's empty the
				// message used to be skipped; chat/obter finds the conversation
				if (!proposalDetails) return;

				sendStatusMessage({
					type: "proposalCanceled",
					...resolveStatusSender(
						proposalParties(proposalDetails),
						"contratado"
					),
					conversationId: conversation?.id,
					produtoMusicalName: proposalDetails.produtoMusical.nome,
					link: entityLinks.proposalTab(proposalDetails.id),
					errorMessage: "Erro ao enviar requisição",
					payload: {},
				});
			} catch (error) {
				showApiError(error, "Error updating proposal status:");
			} finally {
				setIsLoadingCancel(false);
			}
		},
		[conversation?.id, proposalDetails, sendStatusMessage, updateStatusMutation]
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
						// Standalone proposals have no registered contractor: the API sends
						// an empty contratante.nome and the typed name in nomeContratante
						clientName: event.contratante.nome || event.nomeContratante || "-",
						value: event.valor,
						// Once answered the proposal is no longer "Rejeitada"
						aceitaContraProposta:
							event.aceitaContraProposta && event.status.nome === "Rejeitada",
						canSign:
							event.status.nome === "Aceita" &&
							((!event.assinaturaContratante && isContractor) ||
								(!event.assinaturaContratado && !isContractor)),

						onCounterProposal: handleCounterProposal,
						onSeeProposal: handleSeeProposal,
						onSeeContract: handleSeeContract,
						onEditContract: handleEditContract,
						onShareProposal: setShareProposalId,
						onConfirmDownPayment:
							event.status.nome === "AguardandoPagamento"
								? handleOpenConfirmPayment
								: undefined,
					};
				}),
			[
				filteredProposals?.data,
				currentUser?.id,
				handleSeeProposal,
				handleSeeContract,
				handleEditContract,
				handleOpenConfirmPayment,
				handleCounterProposal,
			]
		) || [];

	return (
		<div className="w-full h-full flex flex-col gap-4">
			<div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-bold text-2xl">Minhas Vendas</h1>
					<p className="text-gray-600 mt-1">
						Gerencie suas vendas e propostas enviadas aos clientes
					</p>
				</div>
				<Button
					className="w-full sm:w-auto shrink-0 gap-3 whitespace-nowrap"
					onClick={() => {
						setIsProposalModalOpen(true);
					}}
				>
					<Plus />
					Criar Proposta Avulsa
				</Button>
			</div>
			<hr className="w-full" />

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="text-black mt-1 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4">
					<p className="font-bold whitespace-nowrap">Filtrar por status:</p>
					<Dropdown
						align="left"
						className="p-0.5"
						trigger={
							<Button
								variant="outline"
								className="w-full sm:w-auto min-w-[180px] justify-between whitespace-nowrap"
							>
								{proposalStatusLabel(statusFilter)}
								<ChevronDown className="h-4 w-4 ml-2" />
							</Button>
						}
					>
						{proposalStatusFilters.map((item) => (
							<div className="flex w-full" key={item}>
								<button
									className="flex justify-between items-center rounded-md px-4 py-2 text-left hover:bg-gray-100 w-full"
									onClick={() => {
										setStatusFilter(item);
									}}
								>
									{proposalStatusLabel(item)}
									{item === statusFilter && <Check color="gray" size={16} />}
								</button>
							</div>
						))}
					</Dropdown>
				</div>
				<p className="text-gray-600 text-sm">
					{filteredProposals?.data.length} de{" "}
					{filteredProposals?.pagination.total}{" "}
					{filteredProposals?.pagination.total === 1 ? "venda" : "vendas"}
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
				counterProposalOf={counterProposalOf}
				onClose={() => {
					setIsProposalModalOpen(false);
					setProposalDetails(null);
					setCounterProposalOf(null);
				}}
			/>

			<ProposalDetailsModal
				isOpen={isProposalDetailsModalOpen}
				mode="Contracted"
				onClose={() => {
					setIsProposalDetailsModalOpen(false);
					setProposalDetails(null);
				}}
				proposal={proposalDetails}
				onPaidSign={(proposalId) => {
					handleOpenConfirmPayment(
						filteredProposals?.data.find((p) => p.id === proposalId)
							?.identificadorUnico ?? ""
					);
					return Promise.resolve();
				}}
				onCancel={handleCancelProposal}
				onSeeContract={handleSeeContract}
				isLoadingPaidSign={isLoadingPaidSign}
				isLoadingCancel={isLoadingCancel}
			/>

			<ConfirmDownPaymentDialog
				proposal={proposalToConfirmPayment}
				isLoading={isLoadingPaidSign}
				onConfirm={handlePaidSign}
				onClose={() => {
					setProposalToConfirmPayment(null);
				}}
			/>

			{/* The link opens the proposal PDF without login */}
			<ShareLink
				open={!!shareProposalId}
				onOpenChange={(open) => {
					if (!open) setShareProposalId(null);
				}}
				url={
					shareProposalId ? entityLinks.proposalPublic(shareProposalId).url : ""
				}
			/>
		</div>
	);
};
