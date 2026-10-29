import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
	useCreateProposal,
	useMyProposals,
	useProductProposals,
	useUpdateProposalStatus,
} from "../useProposals";
import { proposalService } from "../../api/services/proposalService";
import { useAuthStore } from "../../store/authStore";
import type { CreateProposalRequest, ProposalResponse } from "../../api/types";

// Mock the proposal service
vi.mock("../../api/services/proposalService", () => ({
	proposalService: {
		createProposal: vi.fn(),
		getMyProposalsAsContractor: vi.fn(),
		getProductProposals: vi.fn(),
		acceptProposal: vi.fn(),
		rejectProposal: vi.fn(),
		cancelProposal: vi.fn(),
	},
}));

// Mock the auth store
vi.mock("../../store/authStore", () => ({
	useAuthStore: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("useProposals hooks", () => {
	let queryClient: QueryClient;

	const createWrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		vi.clearAllMocks();
	});

	describe("useCreateProposal", () => {
		it("should create a proposal successfully", async () => {
			const mockResponse: ProposalResponse = {
				id: 1,
				idProdutoMusical: 1,
				idContratante: 3,
				idTipoEvento: 2,
				descricao: "Test proposal",
				valor: 500,
				local: "Test location",
				dataInicio: "2025-08-02",
				dataFim: "2025-08-02",
				horaInicio: "21:00",
				horaFim: "23:00",
				status: "pendente",
				dataCriacao: "2025-01-01T00:00:00Z",
			};

			const mockRequest: CreateProposalRequest = {
				IdContratante: 3,
				IdTipoEvento: 2,
				Descricao: "Test proposal",
				Valor: 500,
				Local: "Test location",
				DataInicio: "2025-08-02",
				DataFim: "2025-08-02",
				HoraInicio: "21:00",
				HoraFim: "23:00",
			};

			const mockCreateProposal = vi.mocked(proposalService.createProposal);
			mockCreateProposal.mockResolvedValue(mockResponse);

			const { result } = renderHook(() => useCreateProposal(), {
				wrapper: createWrapper,
			});

			await result.current.mutateAsync({
				productId: 1,
				data: mockRequest,
			});

			await waitFor(() => {
				expect(mockCreateProposal).toHaveBeenCalledWith(
					1,
					mockRequest
				);
			});
		});

		it("should handle error when creating proposal", async () => {
			const mockRequest: CreateProposalRequest = {
				IdContratante: 3,
				IdTipoEvento: 2,
				Descricao: "Test proposal",
				Valor: 500,
				Local: "Test location",
				DataInicio: "2025-08-02",
				DataFim: "2025-08-02",
				HoraInicio: "21:00",
				HoraFim: "23:00",
			};

			const mockCreateProposal = vi.mocked(proposalService.createProposal);
			mockCreateProposal.mockRejectedValue(
				new Error("API Error")
			);

			const { result } = renderHook(() => useCreateProposal(), {
				wrapper: createWrapper,
			});

			await expect(
				result.current.mutateAsync({
					productId: 1,
					data: mockRequest,
				})
			).rejects.toThrow("API Error");
		});
	});

	describe("useMyProposals", () => {
		it("should fetch proposals for logged in user", async () => {
			const mockUser = { id: 3, email: "test@example.com" };
			const mockProposals: Array<ProposalResponse> = [
				{
					id: 1,
					idProdutoMusical: 1,
					idContratante: 3,
					idTipoEvento: 2,
					descricao: "My proposal",
					valor: 750,
					local: "My location",
					dataInicio: "2025-08-15",
					dataFim: "2025-08-15",
					horaInicio: "20:00",
					horaFim: "23:00",
					status: "pendente",
					dataCriacao: "2025-01-05T00:00:00Z",
				},
			];

			// The hook reads the store through a selector: useAuthStore(s => s.user)
			vi.mocked(useAuthStore).mockImplementation(((selector: any) =>
				selector({ user: mockUser })) as any);

			const mockGetMyProposals = vi.mocked(proposalService.getMyProposalsAsContractor);
			mockGetMyProposals.mockResolvedValue(
				mockProposals
			);

			const { result } = renderHook(() => useMyProposals(), {
				wrapper: createWrapper,
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockProposals);
			expect(mockGetMyProposals).toHaveBeenCalledWith(
				3
			);
		});

		it("should return empty array when user is not logged in", async () => {
			vi.mocked(useAuthStore).mockImplementation(((selector: any) =>
				selector({ user: null })) as any);

			const { result } = renderHook(() => useMyProposals(), {
				wrapper: createWrapper,
			});

			// Logged out the query stays disabled: nothing is fetched
			expect(result.current.status).toBe("pending");
			expect(
				proposalService.getMyProposalsAsContractor
			).not.toHaveBeenCalled();
		});
	});

	describe("useProductProposals", () => {
		it("should fetch proposals for a specific product", async () => {
			const mockProposals: Array<ProposalResponse> = [
				{
					id: 1,
					idProdutoMusical: 5,
					idContratante: 3,
					idTipoEvento: 2,
					descricao: "Product proposal",
					valor: 1200,
					local: "Product location",
					dataInicio: "2025-10-01",
					dataFim: "2025-10-01",
					horaInicio: "18:00",
					horaFim: "21:00",
					status: "aceito",
					dataCriacao: "2025-01-10T00:00:00Z",
				},
			];

			const mockGetProductProposals = vi.mocked(proposalService.getProductProposals);
			mockGetProductProposals.mockResolvedValue(
				mockProposals
			);

			const { result } = renderHook(
				() => useProductProposals({ productId: 5, IdContratante: 3 }),
				{ wrapper: createWrapper }
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockProposals);
			expect(mockGetProductProposals).toHaveBeenCalledWith({
				productId: 5,
				IdContratante: 3,
			});
		});

		it("should fetch the contractor's proposals when there is no product", async () => {
			vi.mocked(proposalService.getProductProposals).mockResolvedValue([]);

			const { result } = renderHook(
				() => useProductProposals({ productId: null, IdContratante: 3 }),
				{ wrapper: createWrapper }
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(proposalService.getProductProposals).toHaveBeenCalledWith({
				productId: null,
				IdContratante: 3,
			});
		});
	});

	describe("useUpdateProposalStatus", () => {
		it("should accept a proposal", async () => {
			const mockAcceptProposal = vi.mocked(proposalService.acceptProposal);
			mockAcceptProposal.mockResolvedValue({
				success: true,
			});

			const { result } = renderHook(() => useUpdateProposalStatus(), {
				wrapper: createWrapper,
			});

			await result.current.mutateAsync({
				proposalId: 1,
				status: "aceito",
			});

			await waitFor(() => {
				expect(mockAcceptProposal).toHaveBeenCalledWith(1);
			});
		});

		it("should reject a proposal", async () => {
			const mockRejectProposal = vi.mocked(proposalService.rejectProposal);
			mockRejectProposal.mockResolvedValue({
				success: true,
			});

			const { result } = renderHook(() => useUpdateProposalStatus(), {
				wrapper: createWrapper,
			});

			await result.current.mutateAsync({
				proposalId: 2,
				status: "rejeitado",
			});

			await waitFor(() => {
				expect(mockRejectProposal).toHaveBeenCalledWith(2);
			});
		});

		it("should cancel a proposal", async () => {
			const mockCancelProposal = vi.mocked(proposalService.cancelProposal);
			mockCancelProposal.mockResolvedValue({
				success: true,
			});

			const { result } = renderHook(() => useUpdateProposalStatus(), {
				wrapper: createWrapper,
			});

			await result.current.mutateAsync({
				proposalId: 3,
				status: "cancelado",
			});

			await waitFor(() => {
				expect(mockCancelProposal).toHaveBeenCalledWith(3);
			});
		});

		it("should throw error for invalid status", async () => {
			const { result } = renderHook(() => useUpdateProposalStatus(), {
				wrapper: createWrapper,
			});

			await expect(
				result.current.mutateAsync({
					proposalId: 1,
					status: "invalid" as any,
				})
			).rejects.toThrow("Invalid status: invalid");
		});
	});
});