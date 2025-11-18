import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { webhookService } from '../webhookService';
import { apiClient } from '../../apiClient';

// Mock the apiClient
vi.mock('../../apiClient', () => ({
	apiClient: {
		post: vi.fn(),
	},
}));

const mockApiClient = apiClient as {
	post: MockedFunction<typeof apiClient.post>;
};

describe('WebhookService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('handleContractSignatureWebhook', () => {
		it('should handle contract signature webhook successfully', async () => {
			const mockPayload = {
				uuid: 'test-uuid-123',
				type_post: '4',
				message: 'Signed',
				email: 'user@example.com',
			};

			const mockResponse = {
				data: {
					success: true,
					message: 'Contract signed successfully',
					contractId: 123,
				},
			};

			mockApiClient.post.mockResolvedValue(mockResponse);

			const result = await webhookService.handleContractSignatureWebhook(mockPayload);

			expect(mockApiClient.post).toHaveBeenCalledWith(
				'/produtomusical/d4sign/webhook',
				mockPayload,
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				}
			);
			expect(result).toEqual(mockResponse.data);
		});

		it('should handle webhook processing error', async () => {
			const mockPayload = {
				uuid: 'test-uuid-123',
				type_post: '4',
				message: 'Signed',
				email: 'user@example.com',
			};

			const mockError = new Error('Network error');
			mockApiClient.post.mockRejectedValue(mockError);

			await expect(webhookService.handleContractSignatureWebhook(mockPayload))
				.rejects.toThrow('Failed to process contract signature webhook');
		});
	});

	describe('handleContingencyWebhook', () => {
		it('should handle contingency webhook successfully', async () => {
			const mockPayload = {
				uuid: 'test-uuid-456',
				type_post: '4',
				message: 'Signed',
				email: 'user@example.com',
			};

			const mockResponse = {
				data: {
					success: true,
					message: 'Contingency webhook processed',
					contractId: 456,
				},
			};

			mockApiClient.post.mockResolvedValue(mockResponse);

			const result = await webhookService.handleContingencyWebhook(mockPayload);

			expect(mockApiClient.post).toHaveBeenCalledWith(
				'/produtomusical/d4sign/contingenciaWebhook',
				mockPayload,
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				}
			);
			expect(result).toEqual(mockResponse.data);
		});
	});

	describe('validateWebhookPayload', () => {
		it('should validate valid payload', () => {
			const validPayload = {
				uuid: 'test-uuid',
				type_post: '4',
				message: 'Signed',
				email: 'user@example.com',
			};

			const result = webhookService.validateWebhookPayload(validPayload);
			expect(result).toBe(true);
		});

		it('should reject invalid payload - missing uuid', () => {
			const invalidPayload = {
				type_post: '4',
				message: 'Signed',
				email: 'user@example.com',
			} as any;

			const result = webhookService.validateWebhookPayload(invalidPayload);
			expect(result).toBe(false);
		});

		it('should reject invalid payload - missing type_post', () => {
			const invalidPayload = {
				uuid: 'test-uuid',
				message: 'Signed',
				email: 'user@example.com',
			} as any;

			const result = webhookService.validateWebhookPayload(invalidPayload);
			expect(result).toBe(false);
		});

		it('should reject invalid payload - missing message', () => {
			const invalidPayload = {
				uuid: 'test-uuid',
				type_post: '4',
				email: 'user@example.com',
			} as any;

			const result = webhookService.validateWebhookPayload(invalidPayload);
			expect(result).toBe(false);
		});

		it('should reject invalid payload - missing email', () => {
			const invalidPayload = {
				uuid: 'test-uuid',
				type_post: '4',
				message: 'Signed',
			} as any;

			const result = webhookService.validateWebhookPayload(invalidPayload);
			expect(result).toBe(false);
		});
	});

	describe('parseWebhookFormData', () => {
		it('should parse form data correctly', () => {
			const formData = new FormData();
			formData.append('uuid', 'test-uuid-789');
			formData.append('type_post', '4');
			formData.append('message', 'Signed');
			formData.append('email', 'test@example.com');

			const result = webhookService.parseWebhookFormData(formData);

			expect(result).toEqual({
				uuid: 'test-uuid-789',
				type_post: '4',
				message: 'Signed',
				email: 'test@example.com',
			});
		});
	});

	describe('createWebhookResponse', () => {
		it('should create success response', () => {
			const result = webhookService.createWebhookResponse(
				true,
				'Operation successful',
				123,
				456
			);

			expect(result).toEqual({
				success: true,
				message: 'Operation successful',
				contractId: 123,
				proposalId: 456,
			});
		});

		it('should create error response', () => {
			const result = webhookService.createWebhookResponse(
				false,
				'Operation failed'
			);

			expect(result).toEqual({
				success: false,
				message: 'Operation failed',
				contractId: undefined,
				proposalId: undefined,
			});
		});
	});
});

