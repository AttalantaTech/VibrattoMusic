import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
	paymentService,
	getPaymentConfig,
	formatCurrency,
	calculateDeposit,
} from '../services/paymentService';
import type { PaymentData, PaymentSession, PaymentStatus } from '../services/paymentService';
import { toast } from 'sonner';

// Configure payment service on module load
paymentService.configure(getPaymentConfig());

/**
 * Hook to create payment session
 */
export const useCreatePaymentSession = () => {
	return useMutation({
		mutationFn: (data: PaymentData) => paymentService.createPaymentSession(data),
		onSuccess: (session: PaymentSession) => {
			toast.success('Sessão de pagamento criada com sucesso');
			// Redirect to payment gateway would happen here
			console.log('Redirecting to payment gateway:', session.url);
		},
		onError: (error) => {
			console.error('Payment session creation error:', error);
			toast.error('Erro ao criar sessão de pagamento. Tente novamente.');
		},
	});
};

/**
 * Hook to get payment status
 */
export const usePaymentStatus = (_paymentId: string | null) => {
	return useMutation({
		mutationFn: (id: string) => paymentService.getPaymentStatus(id),
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

/**
 * Hook to process deposit payment
 */
export const useProcessDepositPayment = () => {
	const [isProcessing, setIsProcessing] = useState(false);

	const createSession = useCreatePaymentSession();

	const processDeposit = async (proposalData: {
		proposalId: number;
		totalAmount: number;
		userId: number;
		description: string;
	}) => {
		setIsProcessing(true);

		try {
			const depositAmount = calculateDeposit(proposalData.totalAmount);

			const paymentData: PaymentData = {
				amount: depositAmount,
				currency: 'BRL',
				description: proposalData.description,
				metadata: {
					proposalId: proposalData.proposalId,
					type: 'deposit',
					userId: proposalData.userId,
				},
				successUrl: `${window.location.origin}/payment/success`,
				cancelUrl: `${window.location.origin}/payment/cancel`,
			};

			const session = await createSession.mutateAsync(paymentData);

			// In a real implementation, this would redirect to the payment gateway
			// For now, we'll just show a success message
			toast.success(`Pagamento simulado: ${formatCurrency(depositAmount * 100)}`);

			return session;
		} catch (error) {
			toast.error('Erro ao processar pagamento do sinal');
			throw error;
		} finally {
			setIsProcessing(false);
		}
	};

	return {
		processDeposit,
		isProcessing: isProcessing || createSession.isPending,
	};
};

/**
 * Hook to process full payment
 */
export const useProcessFullPayment = () => {
	const [isProcessing, setIsProcessing] = useState(false);

	const createSession = useCreatePaymentSession();

	const processFullPayment = async (proposalData: {
		proposalId: number;
		totalAmount: number;
		userId: number;
		description: string;
	}) => {
		setIsProcessing(true);

		try {
			const paymentData: PaymentData = {
				amount: proposalData.totalAmount,
				currency: 'BRL',
				description: proposalData.description,
				metadata: {
					proposalId: proposalData.proposalId,
					type: 'full_payment',
					userId: proposalData.userId,
				},
				successUrl: `${window.location.origin}/payment/success`,
				cancelUrl: `${window.location.origin}/payment/cancel`,
			};

			const session = await createSession.mutateAsync(paymentData);

			toast.success(`Pagamento completo simulado: ${formatCurrency(proposalData.totalAmount * 100)}`);

			return session;
		} catch (error) {
			toast.error('Erro ao processar pagamento completo');
			throw error;
		} finally {
			setIsProcessing(false);
		}
	};

	return {
		processFullPayment,
		isProcessing: isProcessing || createSession.isPending,
	};
};

/**
 * Hook for payment utilities
 */
export const usePaymentUtilities = () => {
	return {
		formatCurrency,
		calculateDeposit,
		isValidAmount: (amount: number) => amount > 0 && amount <= 100000000,
		getGatewayName: (gateway: string) => {
			const names = {
				stripe: 'Stripe',
				pagseguro: 'PagSeguro',
				mercadoPago: 'Mercado Pago',
			};
			return names[gateway as keyof typeof names] || gateway;
		},
	};
};

/**
 * Hook to handle payment success/cancel callbacks
 */
export const usePaymentCallback = () => {
	const getStatus = usePaymentStatus(null);

	const handlePaymentSuccess = async (sessionId: string) => {
		try {
			const status = await getStatus.mutateAsync(sessionId);

			if (status.status === 'succeeded') {
				toast.success('Pagamento confirmado com sucesso!');
				return status;
			} else {
				toast.error('Pagamento não foi confirmado. Entre em contato com o suporte.');
				return null;
			}
		} catch {
			toast.error('Erro ao verificar status do pagamento');
			return null;
		}
	};

	const handlePaymentCancel = () => {
		toast.warning('Pagamento cancelado pelo usuário');
	};

	return {
		handlePaymentSuccess,
		handlePaymentCancel,
		isLoading: getStatus.isPending,
	};
};

// Export types for components
export type { PaymentData, PaymentSession, PaymentStatus };

