import { contractService } from '../contractService';
import { apiClient } from '../../core/client';

// Mock the API client
jest.mock('../../core/client');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('contractService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('loadContract', () => {
		it('should call API with correct endpoint and return contract data', async () => {
			const mockContract = {
				id: 1,
				identificadorUnico: 'test-uuid',
				titulo: 'Test Contract',
				status: { id: 1, nome: 'Ativo' },
				valor: 150000,
				dataCriacao: '2024-01-01T00:00:00Z',
			};

			mockApiClient.get.mockResolvedValue(mockContract);

			const result = await contractService.loadContract('test-uuid');

			expect(mockApiClient.get).toHaveBeenCalledWith('produtomusical/test-uuid/carregaContrato');
			expect(result).toEqual(mockContract);
		});

		it('should handle API errors', async () => {
			const error = new Error('API Error');
			mockApiClient.get.mockRejectedValue(error);

			await expect(contractService.loadContract('test-uuid')).rejects.toThrow('API Error');
		});
	});

	describe('listContractSections', () => {
		it('should call API with correct endpoint and return sections array', async () => {
			const mockSections = [
				{
					numero: 1,
					titulo: 'Section 1',
					texto: 'Content of section 1',
					editavel: true,
				},
				{
					numero: 2,
					titulo: 'Section 2',
					texto: 'Content of section 2',
					editavel: false,
				},
			];

			mockApiClient.get.mockResolvedValue(mockSections);

			const result = await contractService.listContractSections(1);

			expect(mockApiClient.get).toHaveBeenCalledWith('produtomusical/1/listarSecoesContrato');
			expect(result).toEqual(mockSections);
		});

		it('should handle API errors', async () => {
			const error = new Error('API Error');
			mockApiClient.get.mockRejectedValue(error);

			await expect(contractService.listContractSections(1)).rejects.toThrow('API Error');
		});
	});

	describe('saveContractSections', () => {
		it('should call API with correct endpoint and data format', async () => {
			const sectionsToSave = [
				{
					numero: 1,
					titulo: 'Updated Section 1',
					texto: 'Updated content',
				},
			];

			mockApiClient.post.mockResolvedValue(undefined);

			await contractService.saveContractSections(1, sectionsToSave);

			expect(mockApiClient.post).toHaveBeenCalledWith(
				'produtomusical/1/gravarSecoesContrato',
				{ SecoesContrato: sectionsToSave }
			);
		});

		it('should handle API errors', async () => {
			const error = new Error('API Error');
			const sectionsToSave = [{ numero: 1, titulo: 'Test', texto: 'Test' }];

			mockApiClient.post.mockRejectedValue(error);

			await expect(contractService.saveContractSections(1, sectionsToSave)).rejects.toThrow('API Error');
		});
	});

	describe('getContractStatistics', () => {
		it('should call API with correct endpoint and parameters', async () => {
			const mockStats = {
				total: 10,
				ativos: 5,
				concluidos: 3,
				pendentes: 2,
				valorTotal: 150000,
				valorMedio: 15000,
			};

			mockApiClient.get.mockResolvedValue(mockStats);

			const result = await contractService.getContractStatistics(1, '30d');

			expect(mockApiClient.get).toHaveBeenCalledWith('contratos/estatisticas/1?periodo=30d');
			expect(result).toEqual(mockStats);
		});

		it('should use default period when not provided', async () => {
			const mockStats = { total: 5, ativos: 3, concluidos: 1, pendentes: 1, valorTotal: 75000, valorMedio: 15000 };
			mockApiClient.get.mockResolvedValue(mockStats);

			await contractService.getContractStatistics(1);

			expect(mockApiClient.get).toHaveBeenCalledWith('contratos/estatisticas/1?periodo=30d');
		});
	});

	describe('searchContracts', () => {
		it('should call API with correct parameters', async () => {
			const mockResults = [
				{ id: 1, titulo: 'Contract 1' },
				{ id: 2, titulo: 'Contract 2' },
			];

			mockApiClient.get.mockResolvedValue(mockResults);

			const result = await contractService.searchContracts('test search', 1, 20);

			expect(mockApiClient.get).toHaveBeenCalledWith(
				'contratos/buscar?termo=test%20search&limite=20&usuarioId=1'
			);
			expect(result).toEqual(mockResults);
		});

		it('should handle search without user ID', async () => {
			const mockResults = [{ id: 1, titulo: 'Contract 1' }];
			mockApiClient.get.mockResolvedValue(mockResults);

			await contractService.searchContracts('test', undefined, 10);

			expect(mockApiClient.get).toHaveBeenCalledWith(
				'contratos/buscar?termo=test&limite=10'
			);
		});
	});
});

