import { useState } from "react";
import {
	CreditCard,
	AlertCircle,
	CheckCircle,
	Loader2,
	DollarSign,
	Calendar,
	Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/Badge/Badge";
import { useUpdateProposalStatus } from "@/hooks/useProposals";
import type { ProposalResponse } from "@/api/types";

interface DepositPaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	proposal: ProposalResponse | null;
}

export const DepositPaymentModal = ({
	isOpen,
	onClose,
	proposal,
}: DepositPaymentModalProps) => {
	const [step, setStep] = useState<"info" | "gateway" | "success" | "error">(
		"info"
	);
	const [isProcessingPayment, setIsProcessingPayment] = useState(false);

	const markPaidMutation = useUpdateProposalStatus();

	// Mock payment processing
	const handleProcessPayment = () => {
		setIsProcessingPayment(true);

		// Simulate payment processing
		setTimeout(() => {
			setIsProcessingPayment(false);
			setStep("success");
		}, 2000);
	};

	const handleMarkAsPaid = async () => {
		if (!proposal) return;

		try {
			await markPaidMutation.mutateAsync({
				proposalId: proposal.id,
				status: "sinalPago",
			});
			setStep("success");
		} catch (error) {
			console.error("Error marking deposit as paid:", error);
			setStep("error");
		}
	};

	const handleClose = () => {
		setStep("info");
		setIsProcessingPayment(false);
		onClose();
	};

	const handleSuccessClose = () => {
		setStep("info");
		setIsProcessingPayment(false);
		onClose();
	};

	if (!proposal) return null;

	// Calculate deposit amount (mock - 30% of total)
	const depositAmount = proposal.valor * 0.3;

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{step === "info" && (
							<CreditCard className="w-5 h-5 text-primary-600" />
						)}
						{step === "gateway" && (
							<CreditCard className="w-5 h-5 text-primary-600" />
						)}
						{step === "success" && (
							<CheckCircle className="w-5 h-5 text-green-600" />
						)}
						{step === "error" && (
							<AlertCircle className="w-5 h-5 text-red-600" />
						)}
						{step === "info" && "Pagamento do Sinal"}
						{step === "gateway" && "Processando Pagamento"}
						{step === "success" && "Pagamento Confirmado!"}
						{step === "error" && "Erro no Pagamento"}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{step === "info" && (
						<>
							{/* Proposal Summary */}
							<div className="space-y-3 p-4 bg-gray-50 rounded-lg">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">
										Proposta #{proposal.id}
									</span>
									<Badge className="bg-primary-100 text-primary-800">
										Aguardando Pagamento
									</Badge>
								</div>

								<div className="space-y-2 text-sm">
									<div className="flex items-center gap-2">
										<DollarSign className="w-4 h-4 text-gray-500" />
										<span>
											Valor Total: R${" "}
											{proposal.valor.toLocaleString("pt-BR", {
												minimumFractionDigits: 2,
											})}
										</span>
									</div>

									<div className="flex items-center gap-2">
										<DollarSign className="w-4 h-4 text-green-600" />
										<span className="font-medium text-green-600">
											Sinal: R${" "}
											{depositAmount.toLocaleString("pt-BR", {
												minimumFractionDigits: 2,
											})}
										</span>
									</div>

									<div className="flex items-center gap-2">
										<Calendar className="w-4 h-4 text-gray-500" />
										<span>
											Vencimento:{" "}
											{new Date(
												Date.now() + 7 * 24 * 60 * 60 * 1000
											).toLocaleDateString("pt-BR")}
										</span>
									</div>
								</div>
							</div>

							{/* Payment Options */}
							<div className="space-y-4">
								<h4 className="font-medium text-gray-900">
									Opções de Pagamento
								</h4>

								{/* Payment Gateway Placeholder */}
								<div
									className="p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 transition-colors"
									onClick={() => {
										setStep("gateway");
									}}
								>
									<div className="text-center">
										<CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
										<p className="font-medium text-gray-700">
											Pagar com Cartão
										</p>
										<p className="text-sm text-gray-500">
											Stripe, PagSeguro, Mercado Pago
										</p>
										<p className="text-xs text-gray-400 mt-1">
											Integração em desenvolvimento
										</p>
									</div>
								</div>

								{/* Manual Confirmation */}
								<div className="p-4 border border-gray-200 rounded-lg">
									<div className="flex items-start gap-3">
										<Info className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
										<div className="text-sm">
											<p className="font-medium text-gray-700">
												Pagamento Manual
											</p>
											<p className="text-gray-600 mt-1">
												Se você já efetuou o pagamento por transferência
												bancária, pix ou outro meio, confirme abaixo.
											</p>
											<Button
												variant="outline"
												size="sm"
												className="mt-3"
												onClick={handleMarkAsPaid}
												disabled={markPaidMutation.isPending}
											>
												{markPaidMutation.isPending ? (
													<>
														<Loader2 className="w-3 h-3 animate-spin mr-1" />
														Processando...
													</>
												) : (
													"Marcar como Pago"
												)}
											</Button>
										</div>
									</div>
								</div>
							</div>

							{/* Warning */}
							<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
								<div className="flex gap-2">
									<AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
									<div className="text-sm">
										<p className="font-medium text-yellow-800">Importante</p>
										<p className="text-yellow-700 mt-1">
											O sinal garante sua reserva. Em caso de cancelamento após
											o pagamento, verifique as condições contratuais.
										</p>
									</div>
								</div>
							</div>

							{/* Actions */}
							<div className="flex gap-3">
								<Button
									variant="outline"
									onClick={handleClose}
									className="flex-1"
								>
									Cancelar
								</Button>
								<Button
									onClick={() => {
										setStep("gateway");
									}}
									className="flex-1 bg-primary-600 hover:bg-blue-700"
								>
									Pagar Sinal
								</Button>
							</div>
						</>
					)}

					{step === "gateway" && (
						<>
							{/* Payment Gateway Placeholder */}
							<div className="text-center space-y-6">
								<div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
									<CreditCard className="w-10 h-10 text-primary-600" />
								</div>

								<div>
									<h3 className="text-lg font-semibold text-gray-900">
										Gateway de Pagamento
									</h3>
									<p className="text-sm text-gray-600 mt-2">
										Valor do sinal: R${" "}
										{depositAmount.toLocaleString("pt-BR", {
											minimumFractionDigits: 2,
										})}
									</p>
								</div>

								{/* Placeholder for payment form */}
								<div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
									<div className="space-y-4 text-left max-w-xs mx-auto">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Número do Cartão
											</label>
											<div className="h-10 bg-white border border-gray-300 rounded px-3 flex items-center text-gray-400">
												•••• •••• •••• ••••
											</div>
										</div>

										<div className="grid grid-cols-2 gap-3">
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">
													Validade
												</label>
												<div className="h-10 bg-white border border-gray-300 rounded px-3 flex items-center text-gray-400">
													MM/AA
												</div>
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">
													CVV
												</label>
												<div className="h-10 bg-white border border-gray-300 rounded px-3 flex items-center text-gray-400">
													•••
												</div>
											</div>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Nome no Cartão
											</label>
											<div className="h-10 bg-white border border-gray-300 rounded px-3 flex items-center text-gray-400">
												NOME COMPLETO
											</div>
										</div>
									</div>

									<p className="text-xs text-gray-400 mt-4">
										Placeholder - Integração com gateway será implementada
										futuramente
									</p>
								</div>

								{/* Actions */}
								<div className="flex gap-3">
									<Button
										variant="outline"
										onClick={() => {
											setStep("info");
										}}
										className="flex-1"
									>
										Voltar
									</Button>
									<Button
										onClick={handleProcessPayment}
										disabled={isProcessingPayment}
										className="flex-1 bg-primary-600 hover:bg-blue-700 flex items-center gap-2"
									>
										{isProcessingPayment ? (
											<>
												<Loader2 className="w-4 h-4 animate-spin" />
												Processando...
											</>
										) : (
											<>
												<CreditCard className="w-4 h-4" />
												Pagar R${" "}
												{depositAmount.toLocaleString("pt-BR", {
													minimumFractionDigits: 2,
												})}
											</>
										)}
									</Button>
								</div>
							</div>
						</>
					)}

					{step === "success" && (
						<>
							<div className="text-center space-y-4">
								<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
									<CheckCircle className="w-8 h-8 text-green-600" />
								</div>

								<div>
									<h3 className="text-lg font-semibold text-green-800">
										Pagamento Confirmado!
									</h3>
									<p className="text-sm text-gray-600 mt-2">
										O sinal foi pago com sucesso. O contrato está agora ativo e
										você pode visualizar todos os detalhes.
									</p>
								</div>

								{/* Payment Summary */}
								<div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
									<h4 className="font-medium text-green-800 mb-2">
										Resumo do Pagamento:
									</h4>
									<div className="space-y-1 text-sm text-green-700">
										<div className="flex justify-between">
											<span>Sinal:</span>
											<span>
												R${" "}
												{depositAmount.toLocaleString("pt-BR", {
													minimumFractionDigits: 2,
												})}
											</span>
										</div>
										<div className="flex justify-between">
											<span>Restante:</span>
											<span>
												R${" "}
												{(proposal.valor - depositAmount).toLocaleString(
													"pt-BR",
													{ minimumFractionDigits: 2 }
												)}
											</span>
										</div>
										<div className="border-t border-green-300 pt-1 mt-2">
											<div className="flex justify-between font-medium">
												<span>Total:</span>
												<span>
													R${" "}
													{proposal.valor.toLocaleString("pt-BR", {
														minimumFractionDigits: 2,
													})}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							<Button onClick={handleSuccessClose} className="w-full">
								Continuar
							</Button>
						</>
					)}

					{step === "error" && (
						<>
							<div className="text-center space-y-4">
								<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
									<AlertCircle className="w-8 h-8 text-red-600" />
								</div>

								<div>
									<h3 className="text-lg font-semibold text-red-800">
										Erro no Pagamento
									</h3>
									<p className="text-sm text-gray-600 mt-2">
										Ocorreu um erro ao processar o pagamento. Tente novamente ou
										entre em contato com o suporte.
									</p>
								</div>
							</div>

							<div className="flex gap-3">
								<Button
									variant="outline"
									onClick={handleClose}
									className="flex-1"
								>
									Fechar
								</Button>
								<Button
									onClick={() => {
										setStep("info");
									}}
									className="flex-1"
								>
									Tentar Novamente
								</Button>
							</div>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};
