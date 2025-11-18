import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContractSignatureWebhook, useContingencyWebhook, useWebhookValidation } from '../useWebhook';
import { webhookService } from '../../api/services/webhookService';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('../../api/services/webhookService');
vi.mock('sonner', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

const mockWebhookService = webhookService as any;
const mockToast = toast as any;

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

describe('useWebhook hooks', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('useContractSignatureWebhook', () => {
		it('should handle successful contract signature webhook', async () => {
			const mockPayload = {
				uuid: 'test-uuid',
				type_post: '4',
				message: 'Signed',
				email: 'user@example.com',
			};

			const mockResponse = {
				success: true,
				message: 'Contract signed successfully',
				contractId: 123,
			};

			mockWebhookService.handleContractSignatureWebhook.mockResolvedValue(mockResponse);

			const { result } = renderHook(() => useContractSignatureWebhook(), {
				wrapper: createWrapper(),
			});

			result.current.mutate(mockPayload);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(mockWebhookService.handleContractSignatureWebhook).toHaveBeenCalledWith(mockPayload);
			expect(mockToast.success).toHaveBeenCalledWith('Contrato assinado com sucesso!');
		});

		it('should handle failed contract signature webhook', async () => {
			const mockPayload = {
				uuid: 'test-uuid',
				type_post: '4',
				message: 'Signed',
				email: 'user@example.com',
			};

			const mockError = new Error('Webhook failed');
			mockWebhookService.handleContractSignatureWebhook.mockRejectedValue(mockError);

			const { result } = renderHook(() => useContractSignatureWebhook(), {
				wrapper: createWrapper(),
			});

			result.current.mutate(mockPayload);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(mockToast.error).toHaveBeenCalledWith('Erro ao processar assinatura do contrato');
		});

		it('should show error toast when webhook response indicates failure', async () => {
			const mockPayload = {
				uuid: 'test-uuid',
				type_post: '4',
				message: 'Signed',
				email: 'user@example.com',
			};

			const mockResponse = {
				success: false,
				message: 'Signature verification failed',
			};

			mockWebhookService.handleContractSignatureWebhook.mockResolvedValue(mockResponse);

			const { result } = renderHook(() => useContractSignatureWebhook(), {
				wrapper: createWrapper(),
			});

			result.current.mutate(mockPayload);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(mockToast.error).toHaveBeenCalledWith('Erro na assinatura: Signature verification failed');
		});
	});

	describe('useContingencyWebhook', () => {
		it('should handle successful contingency webhook', async () => {
			const mockPayload = {
				uuid: 'test-uuid',
				type_post: '4',
				message: 'Signed',
				email: 'user@example.com',
			};

			const mockResponse = {
				success: true,
				message: 'Contingency processed successfully',
				contractId: 456,
			};

			mockWebhookService.handleContingencyWebhook.mockResolvedValue(mockResponse);

			const { result } = renderHook(() => useContingencyWebhook(), {
				wrapper: createWrapper(),
			});

			result.current.mutate(mockPayload);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(mockWebhookService.handleContingencyWebhook).toHaveBeenCalledWith(mockPayload);
			expect(mockToast.success).toHaveBeenCalledWith('Webhook de contingência processado com sucesso!');
		});

		it('should handle failed contingency webhook', async () => {
			const mockPayload = {
				uuid: 'test-uuid',
				type_post: '4',
				message: 'Signed',
				email: 'user@example.com',
			};

			const mockError = new Error('Contingency webhook failed');
			mockWebhookService.handleContingencyWebhook.mockRejectedValue(mockError);

			const { result } = renderHook(() => useContingencyWebhook(), {
				wrapper: createWrapper(),
			});

			result.current.mutate(mockPayload);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(mockToast.error).toHaveBeenCalledWith('Erro ao processar webhook de contingência');
		});
	});

	describe('useWebhookValidation', () => {
		it('should provide validation functions', () => {
			const { result } = renderHook(() => useWebhookValidation());

			expect(typeof result.current.validatePayload).toBe('function');
			expect(typeof result.current.parseFormData).toBe('function');
		});

		it('should validate payload correctly', () => {
			const { result } = renderHook(() => useWebhookValidation());

			const validPayload = {
				uuid: 'test-uuid',
				type_post: '4',
				message: 'Signed',
				email: 'user@example.com',
			};

			const invalidPayload = {
				uuid: 'test-uuid',
				type_post: '4',
				email: 'user@example.com',
				// missing message
			};

			mockWebhookService.validateWebhookPayload
				.mockReturnValueOnce(true)
				.mockReturnValueOnce(false);

			expect(result.current.validatePayload(validPayload)).toBe(true);
			expect(result.current.validatePayload(invalidPayload as any)).toBe(false);
		});

		it('should parse form data correctly', () => {
			const { result } = renderHook(() => useWebhookValidation());

			const formData = new FormData();
			formData.append('uuid', 'test-uuid');
			formData.append('type_post', '4');
			formData.append('message', 'Signed');
			formData.append('email', 'test@example.com');

			const expectedPayload = {
				uuid: 'test-uuid',
				type_post: '4',
				message: 'Signed',
				email: 'test@example.com',
			};

			mockWebhookService.parseWebhookFormData.mockReturnValue(expectedPayload);

			const parsed = result.current.parseFormData(formData);
			expect(parsed).toEqual(expectedPayload);
		});
	});
});

