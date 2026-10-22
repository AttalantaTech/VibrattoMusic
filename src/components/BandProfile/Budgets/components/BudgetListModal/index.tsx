import type { BudgetResponse, ProposalResponse } from "@/api/types";
import { SendBudgetToProposal } from "@/components/BandProfile/Proposals/components/SendBudgetToProposal";
import type { CreateProposalForm } from "@/components/BandProfile/Proposals/schemas/proposal.schema";
import { EventsTable } from "@/components/EventsTable";
import type { EventsTableBudgetsData } from "@/components/EventsTable/types";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	EmptyState,
	ErrorState,
	TableSkeleton,
} from "@/components/ui/LoadingStates";
import { useFilteredBudgets } from "@/hooks/useProposals";
import { FileText } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

interface BudgetListModalProps {
	isOpen: boolean;
	onClose: (value: boolean) => void;
	idProdutoMusicalConversa?: number | null;
	idContratanteConversa?: number;
	conversationId?: number;
	idDestinatario?: number;
}

const getInitialFormValues = (
	proposal?: ProposalResponse | BudgetResponse | null
): CreateProposalForm => {
	if (!proposal) {
		return {
			idTipoEvento: 0,
			nomeContratante: "",
			descricao: "",
			local: "",
			valor: 0,
			dataEvento: "",
			horaInicio: "",
			duracao: "",
			dataVencimentoAceite: 15,
			dataVencimentoSinalPagamento: 30,
			formaPagamento: [],
			idCondicoesPagamento: 0,
			transporteIncluso: false,
			acomodacaoInclusa: false,
			definirHorarioEvento: false,
		};
	}

	if ("dataEvento" in proposal) {
		return {
			idTipoEvento: proposal.tipoEvento?.id || 0,
			nomeContratante: proposal.contratante?.nome || "",
			descricao: proposal.descricao || "",
			local: proposal.local || "",
			valor: 0,
			dataEvento: proposal.dataEvento,
			horaInicio: proposal.horaInicio || "",
			duracao: proposal.duracao || "",
			dataVencimentoAceite: 15,
			dataVencimentoSinalPagamento: 30,
			formaPagamento: [],
			idCondicoesPagamento: 2,
			transporteIncluso: false,
			acomodacaoInclusa: false,
			definirHorarioEvento: Boolean(proposal.horaInicio),
			idOrcamento: proposal.id,
		};
	}

	return {
		idTipoEvento: proposal.idTipoEvento || proposal.tipoEvento?.id || 0,
		nomeContratante: proposal.nomeContratante || "",
		descricao: proposal.descricao || "",
		local: proposal.local || "",
		valor: proposal.valor || 0,
		dataEvento: proposal.dataInicio,
		horaInicio: proposal.horaInicio || "",
		duracao: "",
		dataVencimentoAceite: 15,
		dataVencimentoSinalPagamento: 30,
		formaPagamento: proposal.formaPagamento.map((item) => item.id) || [],
		idCondicoesPagamento: proposal.idCondicoesPagamento || 0,
		transporteIncluso: Boolean(proposal.transporteIncluso),
		acomodacaoInclusa: Boolean(proposal.acomodacaoInclusa),
		definirHorarioEvento: Boolean(proposal.horaInicio),
	};
};

export const BudgetListModal = ({
	isOpen,
	onClose,
	idProdutoMusicalConversa,
	idContratanteConversa,
	conversationId,
	idDestinatario,
}: BudgetListModalProps) => {
	const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
	const [budget, setBudget] = useState<BudgetResponse | null>(null);

	const {
		data: filteredBudgets,
		isLoading,
		error,
	} = useFilteredBudgets({
		IdProdutoMusical: idProdutoMusicalConversa,
		IdContratante: idProdutoMusicalConversa ? null : idContratanteConversa,
	});

	const budgetDetails = useMemo<CreateProposalForm>(
		() => getInitialFormValues(budget),
		[budget]
	);

	const handleCreateProposal = useCallback((budget: BudgetResponse) => {
		setBudget(budget);
		setIsProposalModalOpen(true);
	}, []);

	const tableData: EventsTableBudgetsData =
		useMemo(
			() =>
				filteredBudgets?.data.map((budget) => {
					return {
						budget,
						createProposal: handleCreateProposal,
					};
				}),
			[filteredBudgets?.data, handleCreateProposal]
		) || [];

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose(false);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Solicitação de Orçamentos</DialogTitle>
					<DialogDescription>
						Acompanhe aqui todas verificações de disponibilidade que você
						recebeu e transforme em propostas.
					</DialogDescription>
				</DialogHeader>
				<div className="w-full h-full flex flex-col gap-4 overflow-auto">
					<hr className="w-full" />

					<div className="flex justify-between">
						<p className="text-gray-600 text-sm">
							{filteredBudgets?.data.length} de{" "}
							{filteredBudgets?.pagination.total} Solicitações de orçamento
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
							title={"Nenhum Orçamento encontrado"}
							message={
								filteredBudgets && filteredBudgets?.pagination.total > 0
									? "Tente ajustar os filtros."
									: "Você não tem orçamentos pendentes."
							}
						/>
					)}
					{tableData.length > 0 && (
						<EventsTable dataBudgets={tableData} mode="budgets" />
					)}
				</div>

				<SendBudgetToProposal
					isOpen={isProposalModalOpen}
					budget={budgetDetails}
					onClose={() => {
						setIsProposalModalOpen(false);
						setBudget(null);
					}}
					conversationId={conversationId}
					recipientId={idDestinatario}
				/>
			</DialogContent>
		</Dialog>
	);
};
