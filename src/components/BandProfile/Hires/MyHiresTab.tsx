import { useCallback, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useFilteredProposals } from "@/hooks/useProposals";
import type { EventsTableHiresData } from "../../EventsTable/types";
import { EventsTable } from "../../EventsTable";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { ProposalViewer } from "../Proposals/components/ProposalViewer";
import type { ProposalView } from "../Proposals/components/ProposalViewTabs";
import type { ProposalResponse } from "@/api/types";
import { toast } from "sonner";
import { ProposalStatusCard } from "@/components/BandProfile/Proposals/components/ProposalStatusCard";
import { useProposalFromLink } from "@/components/BandProfile/Proposals/hooks/useProposalFromLink";
import { ProposalStatusFilter } from "@/components/BandProfile/Proposals/components/ProposalStatusFilter";
import { proposalTitle } from "@/components/BandProfile/Proposals/utils/proposalTitle";

export const MyHiresTab = () => {
	const [statusFilter, setStatusFilter] = useState<string>("Todos os status");
	// Proposal shown in the viewer (progress/details/contract); null = closed.
	// Accepting and rejecting happen there
	const [viewing, setViewing] = useState<{
		id: number;
		view: ProposalView;
	} | null>(null);

	const currentUser = useAuthStore((state) => state.user);
	const { activeProduct } = useMusicalProductStore();

	const { data: filteredProposals, isLoading: proposalIsLoading } =
		useFilteredProposals({
			status: statusFilter === "Todos os status" ? undefined : [statusFilter],
			IdContratante: activeProduct?.id ? null : currentUser?.id,
			IdProdutoMusicalContratante: activeProduct ? activeProduct.id : null,
		});

	// The menu passes the identificadorUnico; the viewer reads the proposal
	// again by its number, so it shows what changed meanwhile
	const openViewer = useCallback(
		(identificadorUnico: string, view: ProposalView) => {
			const proposal = filteredProposals?.data.find(
				(p) => p.identificadorUnico === identificadorUnico
			);
			if (proposal) {
				setViewing({ id: proposal.id, view });
			} else {
				toast.error("Não foi possível abrir esta proposta.");
			}
		},
		[filteredProposals?.data]
	);

	const handleSeeContract = useCallback(
		(proposalId: string) => {
			openViewer(proposalId, "contract");
		},
		[openViewer]
	);

	const handleSeeProposal = useCallback(
		(proposalId: string) => {
			openViewer(proposalId, "details");
		},
		[openViewer]
	);

	const handleOpenLinkedProposal = useCallback((proposal: ProposalResponse) => {
		setViewing({ id: proposal.id, view: "details" });
	}, []);

	useProposalFromLink({
		tab: "hires",
		proposals: filteredProposals?.data,
		onOpen: handleOpenLinkedProposal,
	});

	const tableData: EventsTableHiresData =
		useMemo(
			() =>
				filteredProposals?.data.map((event) => {
					const isContractor = event.idContratante === currentUser?.id;

					return {
						event: {
							id: event.identificadorUnico,
							// The other party (the artist hired) over "Casamento · 20/12/2026"; it
							// was the description, the same standard text for every proposal
							title: event.produtoMusical.nome || proposalTitle(event),
							subtitle: proposalTitle(event),
							date: event.dataCriacao,
						},
						status: event.status.nome,
						statusComponent: <ProposalStatusCard name={event.status.nome} />,
						clientName: event.contratante.nome,
						productName: event.produtoMusical.nome,
						value: event.valor,
						canSign:
							event.status.nome === "Aceita" &&
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
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="text-black mt-1 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4">
						<p className="font-bold whitespace-nowrap">Filtrar por status:</p>
						<ProposalStatusFilter
							value={statusFilter}
							onChange={setStatusFilter}
						/>
					</div>
					<p className="text-gray-600 text-sm">
						{filteredProposals?.data.length} de{" "}
						{filteredProposals?.pagination.total}{" "}
						{filteredProposals?.pagination.total === 1
							? "contratação"
							: "contratações"}
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
			<ProposalViewer
				proposalId={viewing?.id ?? null}
				initialView={viewing?.view}
				isSeller={false}
				onClose={() => {
					setViewing(null);
				}}
			/>
		</div>
	);
};
