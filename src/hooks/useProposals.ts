import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { proposalService } from "../api/services/proposalService";
import type {
	CreateProposalRequest,
	ProposalFilterRequest,
	ProposalResponse,
} from "../api/types";
import { toast } from "sonner";
import { useAuthStore } from "../store/authStore";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

export interface UseProductProposalsParameters {
	productId: number | null;
	IdContratante: number | null;
}

const PROPOSAL_QUERY_KEYS = {
	all: ["proposals"] as const,
	mine: () => [...PROPOSAL_QUERY_KEYS.all, "mine"] as const,
	byProduct: (id: number | null) =>
		[...PROPOSAL_QUERY_KEYS.all, "product", id] as const,
};

/**
 * Hook to create a new proposal
 */
export const useCreateProposal = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			productId,
			data,
		}: {
			productId: number;
			data: CreateProposalRequest;
		}) => proposalService.createProposal(productId, data),
		onSuccess: () => {
			// Invalidate relevant queries
			void queryClient.invalidateQueries({ queryKey: ["filtered-proposals"] });

			toast.success("Proposta enviada com sucesso!");
		},
		onError: (error) => {
			console.error("❌ Proposal creation error:", error);

			// Don't show toast here as it's handled in the modal
			// This allows for more specific error handling in the component
		},
	});
};

/**
 * Hook to fetch my proposals (as contractor)
 * This assumes the current user is fetching proposals they created as a contractor
 */
export const useMyProposals = () => {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: PROPOSAL_QUERY_KEYS.mine(),
		queryFn: () => {
			if (!user?.id) {
				return Promise.resolve([]);
			}
			// Use user ID as contractor ID to fetch proposals
			return proposalService.getMyProposalsAsContractor(user.id);
		},
		enabled: !!user?.id,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};

/**
 * Hook to fetch proposals for a specific product
 */

export const useProductProposals = ({
	productId,
	IdContratante,
}: UseProductProposalsParameters) => {
	return useQuery({
		queryKey: PROPOSAL_QUERY_KEYS.byProduct(productId ?? IdContratante),
		queryFn: () => {
			return proposalService.getProductProposals({ productId, IdContratante });
		},
		enabled: true,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};

/**
 * Hook to update proposal status
 */
export const useUpdateProposalStatus = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			proposalId,
			status,
			reasonId,
		}: {
			proposalId: number;
			status: "aceito" | "rejeitado" | "cancelado" | "sinalPago";
			reasonId?: number;
		}) => {
			switch (status) {
				case "aceito":
					return proposalService.acceptProposal(proposalId);
				case "rejeitado":
					// If reasonId is provided, use it; otherwise default to 1 (Outro motivo)
					if (reasonId) {
						return proposalService.rejectProposalWithReason(proposalId, {
							IdMotivoRejeicao: reasonId,
						});
					}
					return proposalService.rejectProposal(proposalId);
				case "cancelado":
					return proposalService.cancelProposal(proposalId);
				case "sinalPago":
					return proposalService.markDepositAsPaid(proposalId);
				default:
					throw new Error(`Invalid status: ${String(status)}`);
			}
		},
		onSuccess: (_, variables) => {
			// Invalidate relevant queries
			void queryClient.invalidateQueries({ queryKey: ["filtered-proposals"] });

			const statusMessages = {
				aceito:
					"Proposta aceita! O contrato será gerado e enviado em breve para o seu email.",
				rejeitado: "Proposta rejeitada.",
				cancelado: "Proposta cancelada.",
				sinalPago:
					"Sinal de proposta marcado como pago. O contrato agora precisa ser assinado.",
			};

			toast.success(statusMessages[variables.status]);
		},
		onError: () => {
			toast.error("Erro ao atualizar status da proposta.");
		},
	});
};

export const useProposalById = (identificadorUnico: string) => {
	return useQuery({
		queryKey: ["proposal", identificadorUnico],
		queryFn: () => proposalService.getProposalById(identificadorUnico),
		enabled: !!identificadorUnico,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};

/**
 * Hook to fetch filtered proposals with local filtering/sorting/pagination
 */
export const useFilteredProposals = (filters: {
	status?: Array<string>;
	searchTerm?: string;
	ordenacao?: {
		campo: "data" | "valor" | "status" | "cliente" | "evento";
		direcao: "asc" | "desc";
	};
	pagina?: number;
	limite?: number;
	IdProdutoMusical?: number | null;
	IdContratante?: number | null;
	IdProdutoMusicalContratante?: number | null;
}) => {
	const IdContratante = filters.IdContratante;
	const IdProdutoMusical = filters.IdProdutoMusical;
	const IdProdutoMusicalContratante = filters.IdProdutoMusicalContratante;

	return useQuery({
		queryKey: ["filtered-proposals", filters, IdProdutoMusical],
		queryFn: async () => {
			// if (!productId) {
			// 	return {
			// 		data: [] as Array<ProposalResponse>,
			// 		pagination: {
			// 			total: 0,
			// 			pagina: 1,
			// 			limite: 0,
			// 			totalPaginas: 1,
			// 			hasNextPage: false,
			// 			hasPreviousPage: false,
			// 		},
			// 	};
			// }

			// Server supports only basic filters. Fetch and filter locally.
			const payload: ProposalFilterRequest = {
				Id: null,
				IdentificadorUnico: null,
				IdContratante,
				IdProdutoMusicalContratante,
				IdProdutoMusical,
				DataDe: null,
				DataAte: null,
			};

			const results = await proposalService.listProposals(payload);

			let filtered: Array<ProposalResponse> = results;
			// Local filtering by status
			if (filters.status && filters.status.length > 0) {
				const set = new Set(filters.status.map((s) => s.toLowerCase()));
				filtered = filtered.filter((p) => set.has(p.status.nome.toLowerCase()));
			}

			// Local search by term (in descricao, local, nomes)
			if (filters.searchTerm && filters.searchTerm.trim().length > 0) {
				const term = filters.searchTerm.trim().toLowerCase();
				filtered = filtered.filter((p) => {
					return (
						p.descricao?.toLowerCase().includes(term) ||
						p.local?.toLowerCase().includes(term) ||
						p.nomeContratante?.toLowerCase().includes(term) ||
						p.nomeTipoEvento?.toLowerCase().includes(term)
					);
				});
			}
			// Local sorting
			if (filters.ordenacao) {
				const { campo, direcao } = filters.ordenacao;
				const factor = direcao === "asc" ? 1 : -1;
				filtered = [...filtered].sort((a, b) => {
					switch (campo) {
						case "data": {
							const da = new Date(a.dataInicio).getTime();
							const db = new Date(b.dataInicio).getTime();
							return (da - db) * factor;
						}
						case "valor":
							return ((a.valor ?? 0) - (b.valor ?? 0)) * factor;
						case "status": {
							const statusA =
								typeof a.status === "object" ? a.status.nome : a.status;
							const statusB =
								typeof b.status === "object" ? b.status.nome : b.status;
							return statusA.localeCompare(statusB) * factor;
						}
						case "cliente":
							return (
								(a.nomeContratante || "").localeCompare(
									b.nomeContratante || ""
								) * factor
							);
						case "evento":
							return (
								(a.nomeTipoEvento || "").localeCompare(b.nomeTipoEvento || "") *
								factor
							);
						default:
							return 0;
					}
				});
			}
			// Local pagination
			if (filters.pagina !== undefined && filters.limite !== undefined) {
				const start = (filters.pagina - 1) * filters.limite;
				const end = start + filters.limite;
				filtered = filtered.slice(start, end);
			}

			// Return a shape similar to previous advanced response
			return {
				data: filtered,
				pagination: {
					total: results.length,
					pagina: filters.pagina ?? 1,
					limite: filters.limite ?? results.length,
					totalPaginas: filters.limite
						? Math.ceil(results.length / filters.limite)
						: 1,
					hasNextPage: !!(
						filters.limite &&
						filters.pagina &&
						filters.pagina * filters.limite < results.length
					),
					hasPreviousPage: !!(
						filters.limite &&
						filters.pagina &&
						filters.pagina > 1
					),
				},
			};
		},
		enabled: true,
		staleTime: 2 * 60 * 1000, // 2 minutes
		retry: 2,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

/**
 * Hook to fetch proposal statistics
 */
export const useProposalStatistics = (periodo: string = "30d") => {
	const { activeProduct } = useMusicalProductStore();
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: ["proposal-statistics", periodo, user?.id, activeProduct?.id],
		queryFn: () => {
			if (!user?.id) {
				throw new Error("No user ID available");
			}
			return proposalService.getProposalStatistics(user.id, periodo);
		},
		enabled: !!user?.id,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

/**
 * Hook to search proposals
 */
export const useSearchProposals = (searchTerm: string, limit: number = 50) => {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: ["search-proposals", searchTerm, limit, user?.id],
		queryFn: () => {
			if (!user?.id) {
				throw new Error("No user ID available");
			}
			return proposalService.searchProposals(searchTerm, user.id, limit);
		},
		enabled: !!searchTerm && searchTerm.length > 2, // Only search if term is meaningful
		staleTime: 1 * 60 * 1000, // 1 minute
		retry: 2,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

/**
 * Hook to fetch proposals by date range
 */
export const useProposalsByDateRange = (startDate: string, endDate: string) => {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: ["proposals-by-date", startDate, endDate, user?.id],
		queryFn: () => {
			if (!user?.id) {
				throw new Error("No user ID available");
			}
			return proposalService.getProposalsByDateRange(
				user.id,
				startDate,
				endDate
			);
		},
		enabled: !!user?.id && !!startDate && !!endDate,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};
