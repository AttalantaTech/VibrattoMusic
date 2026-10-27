import { useCallback, useMemo, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import {
	useFilteredProposals,
	useUpdateProposalStatus,
} from "@/hooks/useProposals";
import type { EventsTableHiresData } from "../../EventsTable/types";
import { Dropdown } from "@/components/ui/Dropdown/Dropdown";
import { Button } from "@/components/ui/Button/Button";
import { splitOnUppercase } from "@/utils/labels";
import { EventsTable } from "../../EventsTable";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { ProposalDetailsModal } from "../Proposals/components/ProposalDetailsModal";
import type { ProposalResponse } from "@/api/types";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { ProposalStatusCard } from "@/components/BandProfile/Proposals/components/ProposalStatusCard";
import { ProposalRejectionModal } from "../Proposals/components/ProposalRejectionModal";
import { showApiError } from "@/utils/showApiError";
import { useSendStatusMessage } from "@/features/message/hooks/useSendStatusMessage";
import { entityLinks } from "@/features/message/utils/messageTemplates";
import {
	proposalParties,
	resolveStatusSender,
} from "@/features/message/utils/resolveStatusSender";
import { useConversations } from "@/hooks/useMessaging";
import type { Conversation } from "@/api/services/messages/types";

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

export const MyHiresTab = () => {
	const navigate = useNavigate();

	const [statusFilter, setStatusFilter] = useState<string>("Todos os status");
	const [proposalToReject, setProposalToReject] =
		useState<ProposalResponse | null>(null);
	const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
	const [isProposalDetailsModalOpen, setIsProposalDetailsModalOpen] =
		useState(false);
	const [proposalDetails, setProposalDetails] =
		useState<ProposalResponse | null>(null);
	const [isLoadingAccept, setIsLoadingAccept] = useState(false);

	const currentUser = useAuthStore((state) => state.user);
	const { activeProduct } = useMusicalProductStore();

	const { data: filteredProposals, isLoading: proposalIsLoading } =
		useFilteredProposals({
			status: statusFilter === "Todos os status" ? undefined : [statusFilter],
			IdContratante: activeProduct?.id ? null : currentUser?.id,
			IdProdutoMusicalContratante: activeProduct ? activeProduct.id : null,
		});

	const { data: conversationsData } = useConversations({
		IdContratante: !activeProduct ? currentUser?.id : activeProduct.id,
		IdProdutoMusical: activeProduct?.id || null,
		enabled: false,
	});

	const updateStatusMutation = useUpdateProposalStatus();
	const { sendStatusMessage } = useSendStatusMessage();

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

	const handleAcceptProposal = async (proposalId: number) => {
		try {
			setIsLoadingAccept(true);
			await updateStatusMutation.mutateAsync({
				proposalId: proposalId,
				status: "aceito",
			});

			if (!proposalDetails || !conversation?.id) return;

			sendStatusMessage({
				type: "proposalAccepted",
				...resolveStatusSender(proposalParties(proposalDetails), "contratante"),
				conversationId: conversation.id,
				produtoMusicalName: proposalDetails.produtoMusical.nome,
				link: entityLinks.proposalTab(proposalDetails.id),
				errorMessage: "Erro ao enviar solicitação orçamento",
				payload: {},
			});
		} catch (error) {
			showApiError(
				error,
				"Erro ao tentar aceitar a proposta. Tente novamente."
			);
		} finally {
			setIsLoadingAccept(false);
		}
	};

	const handleRejectProposal = useCallback(
		(proposal: ProposalResponse | string) => {
			if (typeof proposal === "string") {
				const foundProposal = filteredProposals?.data.find(
					(p) => p.identificadorUnico === proposal
				);
				if (!foundProposal) return;
				setProposalToReject(foundProposal);
			} else {
				setProposalToReject(proposal);
			}
			setIsRejectionModalOpen(true);
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

	const tableData: EventsTableHiresData =
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
						productName: event.produtoMusical.nome,
						value: event.valor,
						canSign:
							event.status.nome === "AguardandoAssinatura" &&
							((!event.assinaturaContratante && isContractor) ||
								(!event.assinaturaContratado && !isContractor)),

						onSeeProposal: handleSeeProposal,
						onSeeContract: handleSeeContract,
					};
				}),
			[
				filteredProposals?.data,
				handleSeeProposal,
				handleSeeContract,
				currentUser?.id,
			]
		) || [];

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

			{/* Hirings Table */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="font-bold text-xl text-gray-900">Contratações</h2>
					<span className="text-sm text-gray-500">
						{filteredProposals?.data.length} contratações encontradas
					</span>
				</div>
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

				<div>
					{!proposalIsLoading ? (
						<EventsTable dataProposals={tableData} mode="hires" />
					) : (
						<div className="flex items-center justify-center py-12">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
							<span className="ml-3 text-gray-600">
								Carregando contratações...
							</span>
						</div>
					)}
				</div>
			</div>
			{/* Modals */}
			<ProposalDetailsModal
				isOpen={isProposalDetailsModalOpen}
				mode="Contractor"
				onClose={() => {
					setIsProposalDetailsModalOpen(false);
				}}
				proposal={proposalDetails}
				onAccept={handleAcceptProposal}
				onReject={handleRejectProposal}
				onSeeContract={handleSeeContract}
				isLoadingAccept={isLoadingAccept}
			/>

			<ProposalRejectionModal
				isOpen={isRejectionModalOpen}
				onClose={() => {
					setIsRejectionModalOpen(false);
					setProposalToReject(null);
				}}
				proposal={proposalToReject}
			/>
		</div>
	);
};
