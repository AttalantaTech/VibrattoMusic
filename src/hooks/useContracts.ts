import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contractService } from "../api/services/contractService";
import { proposalService } from "../api/services/proposalService";
import type {
	ContractSectionUpdateRequest,
	ContractResponse,
} from "../api/types";
import { toast } from "sonner";
import { useAuthStore } from "../store/authStore";
import { useActiveMusicalProduct } from "./useActiveMusicalProduct";

const CONTRACT_QUERY_KEYS = {
	all: ["contracts"] as const,
	byId: (identificadorUnico: string) =>
		[...CONTRACT_QUERY_KEYS.all, "id", identificadorUnico] as const,
	sections: (identificadorUnico: string) =>
		[...CONTRACT_QUERY_KEYS.all, "sections", identificadorUnico] as const,
	mine: () => [...CONTRACT_QUERY_KEYS.all, "mine"] as const,
};

/**
 * Hook to load contract details
 */
export const useContract = (identificadorUnico: string) => {
	return useQuery({
		queryKey: CONTRACT_QUERY_KEYS.byId(identificadorUnico),
		queryFn: () => contractService.loadContract(identificadorUnico),
		enabled: !!identificadorUnico && identificadorUnico.length > 0,
		staleTime: 10 * 60 * 1000, // 10 minutes
		retry: 2,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

/**
 * Hook to load contract PDF
 */
export const useContractPDF = (identificadorUnico: string) => {
	return useQuery({
		queryKey: [...CONTRACT_QUERY_KEYS.all, "pdf", identificadorUnico] as const,
		queryFn: () => contractService.loadContractPDF(identificadorUnico),
		enabled: !!identificadorUnico && identificadorUnico.length > 0,
		staleTime: 10 * 60 * 1000, // 10 minutes
		retry: 2,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

/**
 * Hook to load contract sections for editing
 */
export const useContractSections = (identificadorUnico: string) => {
	return useQuery({
		queryKey: CONTRACT_QUERY_KEYS.sections(identificadorUnico),
		queryFn: () =>
			contractService.listContractSectionsByIdentificador(identificadorUnico),
		enabled: !!identificadorUnico && identificadorUnico.length > 0,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 2,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

/**
 * Hook to update contract sections
 */
export const useUpdateContractSections = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			identificadorUnico,
			sections,
		}: {
			identificadorUnico: string;
			sections: Array<ContractSectionUpdateRequest>;
		}) =>
			contractService.saveContractSectionsByIdentificador(
				identificadorUnico,
				sections
			),
		onSuccess: (_, variables) => {
			// Invalidate related queries
			void queryClient.invalidateQueries({
				queryKey: CONTRACT_QUERY_KEYS.sections(variables.identificadorUnico),
			});
			void queryClient.invalidateQueries({
				queryKey: CONTRACT_QUERY_KEYS.byId(variables.identificadorUnico),
			});

			toast.success("Seções do contrato salvas com sucesso!");
		},
		onError: (error) => {
			console.error("❌ Contract sections update error:", error);
			toast.error("Erro ao salvar seções do contrato. Tente novamente.");
		},
	});
};

/**
 * Hook to fetch the contract for the current active musical product
 * Gets the proposal for the current product and loads its contract using identificadorUnico
 */
export const useMyContracts = (): ReturnType<
	typeof useQuery<Array<ContractResponse>>
> => {
	const user = useAuthStore((state) => state.user);
	const { activeProduct } = useActiveMusicalProduct();

	return useQuery({
		queryKey: CONTRACT_QUERY_KEYS.mine(),
		queryFn: async (): Promise<Array<ContractResponse>> => {
			if (!user?.id || !activeProduct?.id) {
				return [];
			}

			try {
				const productId = Number(activeProduct.id);
				if (isNaN(productId)) {
					return [];
				}

				// Get proposals for this musical product
				const proposals = await proposalService.listProposals({
					IdProdutoMusical: productId,
					IdContratante: null,
					Id: null,
					IdentificadorUnico: null,
					DataDe: null,
					DataAte: null,
				});

				if (!Array.isArray(proposals) || proposals.length === 0) {
					return [];
				}

				// Get the first proposal (assuming one proposal per product)
				const proposal = proposals[0];

				if (!proposal || !proposal.identificadorUnico) {
					return [];
				}

				// Load the contract using the proposal's identificadorUnico
				const contract = await contractService.loadContract(
					proposal.identificadorUnico
				);

				return [contract];
			} catch (error) {
				console.log("🔍 Debug - No contract found or error occurred:", error);
				return [];
			}
		},
		enabled: !!user?.id && !!activeProduct?.id,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 2,
	});
};

/**
 * Hook to fetch contract statistics
 */
export const useContractStatistics = (periodo: string = "30d") => {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: ["contract-statistics", periodo, user?.id],
		queryFn: () => {
			if (!user?.id) {
				throw new Error("No user ID available");
			}
			return contractService.getContractStatistics(user.id, periodo);
		},
		enabled: !!user?.id,
		staleTime: 10 * 60 * 1000, // 10 minutes
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

/**
 * Hook to search contracts
 */
export const useSearchContracts = (searchTerm: string, limit: number = 50) => {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: ["search-contracts", searchTerm, limit, user?.id],
		queryFn: () => {
			if (!user?.id) {
				throw new Error("No user ID available");
			}
			return contractService.searchContracts(searchTerm, user.id, limit);
		},
		enabled: !!searchTerm && searchTerm.length > 2 && !!user?.id,
		staleTime: 1 * 60 * 1000, // 1 minute
		retry: 2,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

/**
 * Hook to check if a contract can be edited by current user
 */
export const useContractPermissions = (identificadorUnico: string) => {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: ["contract-permissions", identificadorUnico, user?.id],
		queryFn: async () => {
			if (!identificadorUnico || !user?.id) {
				return { canEdit: false, canView: false };
			}

			// This would check contract ownership and status
			// For now, return basic permissions
			const contract = await contractService.loadContract(identificadorUnico);

			return {
				canEdit:
					contract.status.nome === "Assinado" ||
					contract.status.nome === "Aceita",
				canView: true,
				isOwner: true, // TODO: Check actual ownership
			};
		},
		enabled: !!identificadorUnico && !!user?.id,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};
