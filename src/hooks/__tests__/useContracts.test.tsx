import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	useContract,
	useContractPDF,
	useContractPermissions,
	useContractSections,
	useUpdateContractSections,
} from "../useContracts";
import { contractService } from "../../api/services/contractService";
import { proposalService } from "../../api/services/proposalService";

vi.mock("../../api/services/contractService");
vi.mock("../../api/services/proposalService");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../../store/authStore", () => ({
	useAuthStore: (selector: (state: { user: { id: number } }) => unknown) =>
		selector({ user: { id: 1 } }),
}));

const mockContractService = vi.mocked(contractService);
const mockProposalService = vi.mocked(proposalService);

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe("useContracts hooks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("useContract", () => {
		it("loads the contract by its unique identifier", async () => {
			const contract = { id: 1, identificadorUnico: "abc" };
			mockContractService.loadContract.mockResolvedValue(contract as never);

			const { result } = renderHook(() => useContract("abc"), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});
			expect(mockContractService.loadContract).toHaveBeenCalledWith("abc");
			expect(result.current.data).toEqual(contract);
		});

		it("does not fetch without an identifier", () => {
			renderHook(() => useContract(""), { wrapper: createWrapper() });

			expect(mockContractService.loadContract).not.toHaveBeenCalled();
		});
	});

	describe("useContractPDF", () => {
		it("does not fetch the PDF without an identifier", () => {
			renderHook(() => useContractPDF(""), { wrapper: createWrapper() });

			expect(mockContractService.loadContractPDF).not.toHaveBeenCalled();
		});
	});

	describe("useContractSections", () => {
		it("loads the sections of the proposal's contract", async () => {
			const sections = [{ numero: 1, titulo: "Objeto", texto: "..." }];
			mockContractService.listContractSectionsByMusicalProductId.mockResolvedValue(
				sections as never
			);

			const { result } = renderHook(() => useContractSections(42), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});
			expect(
				mockContractService.listContractSectionsByMusicalProductId
			).toHaveBeenCalledWith(42);
			expect(result.current.data).toEqual(sections);
		});

		it("does not fetch without a proposal", () => {
			renderHook(() => useContractSections(0), { wrapper: createWrapper() });

			expect(
				mockContractService.listContractSectionsByMusicalProductId
			).not.toHaveBeenCalled();
		});
	});

	describe("useUpdateContractSections", () => {
		const sections = [{ numero: 1, texto: "Novo texto" }];

		it("saves the sections and confirms it", async () => {
			mockContractService.saveContractSectionsByIdentificador.mockResolvedValue(
				undefined as never
			);

			const { result } = renderHook(() => useUpdateContractSections(), {
				wrapper: createWrapper(),
			});
			result.current.mutate({
				identificadorUnico: "abc",
				sections: sections as never,
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});
			expect(
				mockContractService.saveContractSectionsByIdentificador
			).toHaveBeenCalledWith("abc", sections);
			expect(toast.success).toHaveBeenCalled();
		});

		it("warns the user when saving fails", async () => {
			mockContractService.saveContractSectionsByIdentificador.mockRejectedValue(
				new Error("API Error")
			);
			vi.spyOn(console, "error").mockImplementation(() => undefined);

			const { result } = renderHook(() => useUpdateContractSections(), {
				wrapper: createWrapper(),
			});
			result.current.mutate({
				identificadorUnico: "abc",
				sections: sections as never,
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});
			expect(toast.error).toHaveBeenCalled();
		});
	});

	describe("useContractPermissions", () => {
		const permissionsFor = async (status: string | null) => {
			mockProposalService.listProposals.mockResolvedValue(
				(status ? [{ status: { id: 1, nome: status } }] : []) as never
			);
			const { result } = renderHook(() => useContractPermissions("abc"), {
				wrapper: createWrapper(),
			});
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});
			return result.current.data;
		};

		it("allows editing an accepted or concluded hiring", async () => {
			expect((await permissionsFor("Aceita"))?.canEdit).toBe(true);
			expect((await permissionsFor("ContratacaoConcluida"))?.canEdit).toBe(
				true
			);
		});

		it("does not allow editing a pending proposal", async () => {
			expect((await permissionsFor("Pendente"))?.canEdit).toBe(false);
		});

		it("denies everything when the proposal is not found", async () => {
			expect(await permissionsFor(null)).toEqual({
				canEdit: false,
				canView: false,
			});
		});
	});
});
