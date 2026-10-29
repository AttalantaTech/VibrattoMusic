import { beforeEach, describe, expect, it } from 'vitest';
import { PaymentService, formatCurrency, calculateDeposit, isValidPaymentAmount } from '../paymentService';

describe('PaymentService', () => {
	let paymentService: PaymentService;

	beforeEach(() => {
		paymentService = new PaymentService();
	});

	describe('configure', () => {
		it('should configure payment service', () => {
			const config = {
				gateway: 'stripe' as const,
				publicKey: 'pk_test_123',
				environment: 'sandbox' as const,
			};

			paymentService.configure(config);

			// Configuration is stored internally, but we can't test private properties
			// This test ensures no errors are thrown
			expect(() => paymentService.configure(config)).not.toThrow();
		});
	});

	describe('validatePaymentData', () => {
		it('should validate correct payment data', () => {
			const validData = {
				amount: 150000, // R$ 1500.00
				currency: 'BRL' as const,
				description: 'Test payment',
				metadata: {
					proposalId: 1,
					type: 'deposit' as const,
					userId: 123,
				},
				successUrl: 'https://example.com/success',
				cancelUrl: 'https://example.com/cancel',
			};

			const isValid = paymentService.validatePaymentData(validData);
			expect(isValid).toBe(true);
		});

		it('should reject invalid amount', () => {
			const invalidData = {
				amount: 0,
				currency: 'BRL' as const,
				description: 'Test payment',
				metadata: {
					proposalId: 1,
					type: 'deposit' as const,
					userId: 123,
				},
				successUrl: 'https://example.com/success',
				cancelUrl: 'https://example.com/cancel',
			};

			const isValid = paymentService.validatePaymentData(invalidData);
			expect(isValid).toBe(false);
		});

		it('should reject invalid currency', () => {
			const invalidData = {
				amount: 150000,
				currency: 'USD' as any,
				description: 'Test payment',
				metadata: {
					proposalId: 1,
					type: 'deposit' as const,
					userId: 123,
				},
				successUrl: 'https://example.com/success',
				cancelUrl: 'https://example.com/cancel',
			};

			const isValid = paymentService.validatePaymentData(invalidData);
			expect(isValid).toBe(false);
		});
	});

	describe('createPaymentSession', () => {
		it('should throw error when not configured', async () => {
			const paymentData = {
				amount: 150000,
				currency: 'BRL' as const,
				description: 'Test payment',
				metadata: {
					proposalId: 1,
					type: 'deposit' as const,
					userId: 123,
				},
				successUrl: 'https://example.com/success',
				cancelUrl: 'https://example.com/cancel',
			};

			await expect(paymentService.createPaymentSession(paymentData)).rejects.toThrow(
				'Payment service not configured'
			);
		});

		it('should create payment session when configured', async () => {
			paymentService.configure({
				gateway: 'stripe',
				publicKey: 'pk_test_123',
				environment: 'sandbox',
			});

			const paymentData = {
				amount: 150000,
				currency: 'BRL' as const,
				description: 'Test payment',
				metadata: {
					proposalId: 1,
					type: 'deposit' as const,
					userId: 123,
				},
				successUrl: 'https://example.com/success',
				cancelUrl: 'https://example.com/cancel',
			};

			// This will use the placeholder implementation
			const session = await paymentService.createPaymentSession(paymentData);

			expect(session).toHaveProperty('sessionId');
			expect(session).toHaveProperty('url');
			expect(session).toHaveProperty('expiresAt');
		});
	});
});

describe('Payment utility functions', () => {
	describe('formatCurrency', () => {
		it('should format currency correctly', () => {
			expect(formatCurrency(150000)).toBe('R$ 1.500,00');
			expect(formatCurrency(50000)).toBe('R$ 500,00');
			expect(formatCurrency(100)).toBe('R$ 1,00');
		});
	});

	describe('calculateDeposit', () => {
		it('should calculate deposit amount correctly', () => {
			expect(calculateDeposit(100000, 30)).toBe(30000); // 30% of R$ 1000.00
			expect(calculateDeposit(200000, 25)).toBe(50000); // 25% of R$ 2000.00
		});

		it('should use default percentage of 30%', () => {
			expect(calculateDeposit(100000)).toBe(30000);
		});
	});

	describe('isValidPaymentAmount', () => {
		it('should validate payment amounts', () => {
			expect(isValidPaymentAmount(1000)).toBe(true);
			expect(isValidPaymentAmount(100000000)).toBe(true); // R$ 1,000,000.00
			expect(isValidPaymentAmount(0)).toBe(false);
			expect(isValidPaymentAmount(-100)).toBe(false);
			expect(isValidPaymentAmount(100000001)).toBe(false); // Above max
		});
	});
});

