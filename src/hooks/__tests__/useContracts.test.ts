import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContract, useContractSections, useUpdateContractSections, useMyContracts } from '../useContracts';
import { contractService } from '../../api/services/contractService';
import { proposalService } from '../../api/services/proposalService';

// Mock the contract service
vi.mock('../../api/services/contractService');
const mockContractService = contractService as any;

// Mock the proposal service
vi.mock('../../api/services/proposalService');
const mockProposalService = proposalService as any;

// Mock auth store
vi.mock('../../store/authStore', () => ({
	useAuthStore: vi.fn(() => ({ user: { id: 1 } })),
}));

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	);
};

describe('useContracts hooks', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('useContract', () => {
		it('should load contract data successfully', async () => {
			const mockContract = {
				id: 1,
				titulo: 'Test Contract',
				status: 'ativo',
				valorTotal: 150000,
				dataCriacao: '2024-01-01T00:00:00Z',
			};

			mockContractService.loadContract.mockResolvedValue(mockContract);

			const { result } = renderHook(() => useContract('test-uuid'), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockContract);
			expect(mockContractService.loadContract).toHaveBeenCalledWith('test-uuid');
		});

		it('should handle loading state', () => {
			mockContractService.loadContract.mockImplementation(
				() => new Promise(resolve => setTimeout(() => resolve({} as any), 100))
			);

			const { result } = renderHook(() => useContract('test-uuid'), {
				wrapper: createWrapper(),
			});

			expect(result.current.isLoading).toBe(true);
		});

		it('should handle error state', async () => {
			const error = new Error('Failed to load contract');
			mockContractService.loadContract.mockRejectedValue(error);

			const { result } = renderHook(() => useContract('test-uuid'), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toEqual(error);
		});

		it('should not fetch when identificadorUnico is null', () => {
			renderHook(() => useContract(null as any), {
				wrapper: createWrapper(),
			});

			expect(mockContractService.loadContract).not.toHaveBeenCalled();
		});
	});

	describe('useContractSections', () => {
		it('should load contract sections successfully', async () => {
			const mockSections = [
				{ numero: 1, titulo: 'Section 1', texto: 'Content 1', editavel: true },
				{ numero: 2, titulo: 'Section 2', texto: 'Content 2', editavel: false },
			];

			mockContractService.listContractSections.mockResolvedValue(mockSections);

			const { result } = renderHook(() => useContractSections(1), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockSections);
			expect(mockContractService.listContractSections).toHaveBeenCalledWith(1);
		});

		it('should not fetch when contractId is null', () => {
			renderHook(() => useContractSections(null as any), {
				wrapper: createWrapper(),
			});

			expect(mockContractService.listContractSections).not.toHaveBeenCalled();
		});
	});

	describe('useUpdateContractSections', () => {
		it('should update contract sections successfully', async () => {
			const sectionsToUpdate = [
				{ numero: 1, titulo: 'Updated Title', texto: 'Updated content' },
			];

			mockContractService.saveContractSections.mockResolvedValue(undefined);

			const { result } = renderHook(() => useUpdateContractSections(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({
				contractId: 1,
				sections: sectionsToUpdate,
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(mockContractService.saveContractSections).toHaveBeenCalledWith(1, sectionsToUpdate);
		});

		it('should handle update error', async () => {
			const error = new Error('Failed to update sections');
			const sectionsToUpdate = [{ numero: 1, titulo: 'Title', texto: 'Content' }];

			mockContractService.saveContractSections.mockRejectedValue(error);

			const { result } = renderHook(() => useUpdateContractSections(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({
				contractId: 1,
				sections: sectionsToUpdate,
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toEqual(error);
		});
	});

	describe('useMyContracts', () => {
		it('should return empty array when no user is logged in', async () => {
			// Mock no user
			const mockUseAuthStore = vi.mocked(require('../../store/authStore').useAuthStore);
			mockUseAuthStore.mockReturnValue({ user: null });

			const { result } = renderHook(() => useMyContracts(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual([]);
		});

		it('should fetch contracts from accepted proposals successfully', async () => {
			const mockProposals = [
				{
					id: 1,
					status: 'aceito',
					nomeTipoEvento: 'Formatura',
					valor: 15000,
					dataCriacao: '2024-01-01T00:00:00Z',
				},
				{
					id: 2,
					status: 'sinalPago',
					nomeTipoEvento: 'Aniversário',
					valor: 20000,
					dataCriacao: '2024-01-02T00:00:00Z',
				},
				{
					id: 3,
					status: 'pendente', // Should be filtered out
					nomeTipoEvento: 'Casamento',
					valor: 50000,
					dataCriacao: '2024-01-03T00:00:00Z',
				},
			];

			const mockContract = {
				id: 1,
				idProposta: 1,
				titulo: 'Contrato - Formatura',
				status: 'assinatura_pendente',
				valorTotal: 15000,
				dataCriacao: '2024-01-01T00:00:00Z',
				secoes: [],
			};

			mockProposalService.getMyProposalsAsContractor.mockResolvedValue(mockProposals);
			mockContractService.loadContract.mockResolvedValue(mockContract);

			const { result } = renderHook(() => useMyContracts(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(mockProposalService.getMyProposalsAsContractor).toHaveBeenCalledWith(1);
			expect(mockContractService.loadContract).toHaveBeenCalledWith(1);
			expect(mockContractService.loadContract).toHaveBeenCalledWith(2);
			expect(result.current.data).toHaveLength(2);
			expect(result.current.data![0]).toEqual(mockContract);
		});

		it('should create mock contract when contract loading fails', async () => {
			const mockProposals = [
				{
					id: 1,
					status: 'aceito',
					nomeTipoEvento: 'Formatura',
					valor: 15000,
					dataCriacao: '2024-01-01T00:00:00Z',
				},
			];

			mockProposalService.getMyProposalsAsContractor.mockResolvedValue(mockProposals);
			mockContractService.loadContract.mockRejectedValue(new Error('Contract not found'));

			const { result } = renderHook(() => useMyContracts(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toHaveLength(1);
			expect(result.current.data![0]).toEqual({
				id: 1,
				idProposta: 1,
				titulo: 'Contrato - Formatura',
				status: 'assinatura_pendente',
				valorTotal: 15000,
				dataCriacao: '2024-01-01T00:00:00Z',
				secoes: [],
			});
		});

		it('should handle different proposal statuses correctly', async () => {
			const mockProposals = [
				{
					id: 1,
					status: 'aceito',
					nomeTipoEvento: 'Evento 1',
					valor: 10000,
					dataCriacao: '2024-01-01T00:00:00Z',
				},
				{
					id: 2,
					status: 'sinalPago',
					nomeTipoEvento: 'Evento 2',
					valor: 20000,
					dataCriacao: '2024-01-02T00:00:00Z',
				},
				{
					id: 3,
					status: 'concluido',
					nomeTipoEvento: 'Evento 3',
					valor: 30000,
					dataCriacao: '2024-01-03T00:00:00Z',
				},
			];

			mockProposalService.getMyProposalsAsContractor.mockResolvedValue(mockProposals);
			mockContractService.loadContract.mockRejectedValue(new Error('Contract not found'));

			const { result } = renderHook(() => useMyContracts(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toHaveLength(3);
			expect(result.current.data![0].status).toBe('assinatura_pendente');
			expect(result.current.data![1].status).toBe('ativo');
			expect(result.current.data![2].status).toBe('concluido');
		});

		it('should handle proposal service error gracefully', async () => {
			mockProposalService.getMyProposalsAsContractor.mockRejectedValue(
				new Error('Failed to fetch proposals')
			);

			const { result } = renderHook(() => useMyContracts(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual([]);
		});

		it('should filter out proposals that are not accepted', async () => {
			const mockProposals = [
				{
					id: 1,
					status: 'aceito',
					nomeTipoEvento: 'Accepted Event',
					valor: 10000,
					dataCriacao: '2024-01-01T00:00:00Z',
				},
				{
					id: 2,
					status: 'rejeitado',
					nomeTipoEvento: 'Rejected Event',
					valor: 20000,
					dataCriacao: '2024-01-02T00:00:00Z',
				},
				{
					id: 3,
					status: 'cancelado',
					nomeTipoEvento: 'Cancelled Event',
					valor: 30000,
					dataCriacao: '2024-01-03T00:00:00Z',
				},
			];

			mockProposalService.getMyProposalsAsContractor.mockResolvedValue(mockProposals);
			mockContractService.loadContract.mockRejectedValue(new Error('Contract not found'));

			const { result } = renderHook(() => useMyContracts(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toHaveLength(1);
			expect(result.current.data![0].titulo).toBe('Contrato - Accepted Event');
		});
	});
});

