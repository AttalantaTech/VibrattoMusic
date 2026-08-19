import { FileText } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { EventsTable } from "@/components/EventsTable";
import type { EventsTableBudgetsData } from "@/components/EventsTable/types";
import { useFilteredBudgets } from "../../../hooks/useProposals";
import { EmptyState, ErrorState, TableSkeleton } from "../../ui/LoadingStates";
import type { BudgetResponse, ProposalResponse } from "@/api/types";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

interface BudgetsTabProps {
	productId?: number;
}

import type { CreateProposalForm } from "../Proposals/schemas/proposal.schema";
import { SendBudgetToProposal } from "../Proposals/components/SendBudgetToProposal";

const getInitialFormValues = (
	proposal?: ProposalResponse | BudgetResponse | null
): CreateProposalForm => {
	// 1. Caso nulo/vazio (Criando proposta do zero)
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

	// 2. Caso seja um BudgetResponse (Veio da aba de Orçamentos)
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
		};
	}

	// 3. Caso seja um ProposalResponse (Modo edição de proposta existente)
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

export const BudgetsTab = ({ productId }: BudgetsTabProps) => {
	const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

	const [budget, setBudget] = useState<BudgetResponse | null>(null);

	const { activeProduct } = useMusicalProductStore();

	const currentProductId =
		productId || (activeProduct?.id ? Number(activeProduct.id) : undefined);

	const {
		data: filteredBudgets,
		isLoading,
		error,
	} = useFilteredBudgets({
		IdProdutoMusical: activeProduct?.id,
	});

	// const dataEvento = useMemo(
	// 	() =>
	// 		budget?.dataEvento
	// 			? format(budget.dataEvento, "yyyy-MM-dd")
	// 			: format(toBR(new Date()), "yyyy-MM-dd"),
	// 	[budget?.dataEvento]
	// );

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
		<div className="w-full h-full flex flex-col gap-4">
			<div className="flex w-full items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl">Solicitação de Orçamentos</h1>
					<p className="text-gray-600 mt-1">
						Acompanhe aqui todas verificações de disponibilidade que você
						recebeu e transforme em propostas.
					</p>
				</div>
			</div>
			<hr className="w-full" />

			<div className="flex justify-between">
				<p className="text-gray-600 text-sm">
					{filteredBudgets?.data.length} de {filteredBudgets?.pagination.total}{" "}
					Solicitações de orçamento
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

			<SendBudgetToProposal
				isOpen={isProposalModalOpen}
				budget={budgetDetails}
				onClose={() => {
					setIsProposalModalOpen(false);
					setBudget(null);
				}}
				recipientId={currentProductId}
			/>
		</div>
	);
};
