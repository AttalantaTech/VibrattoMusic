import { useState } from "react";
import { CheckCircle, AlertCircle, Loader2, FileText, DollarSign, Calendar } from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Badge } from "../../ui/Badge/Badge";
import { useUpdateProposalStatus } from "../../../hooks/useProposals";
import type { ProposalResponse } from "../../../api/types";

interface ProposalAcceptModalProps {
	isOpen: boolean;
	onClose: () => void;
	proposal: ProposalResponse | null;
}

export const ProposalAcceptModal = ({ isOpen, onClose, proposal }: ProposalAcceptModalProps) => {
	const [step, setStep] = useState<'confirm' | 'success' | 'error'>('confirm');

	const acceptMutation = useUpdateProposalStatus();

	const handleAccept = async () => {
		if (!proposal) return;

		try {
			await acceptMutation.mutateAsync({
				proposalId: proposal.id,
				status: 'aceito'
			});
			setStep('success');
		} catch (error) {
			console.error('Error accepting proposal:', error);
			setStep('error');
		}
	};

	const handleClose = () => {
		setStep('confirm');
		onClose();
	};

	const handleSuccessClose = () => {
		setStep('confirm');
		onClose();
		// TODO: Navigate to contract view or refresh proposals list
	};

	if (!proposal) return null;

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{step === 'confirm' && <CheckCircle className="w-5 h-5 text-green-600" />}
						{step === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
						{step === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
						{step === 'confirm' && 'Aceitar Proposta'}
						{step === 'success' && 'Proposta Aceita!'}
						{step === 'error' && 'Erro ao Aceitar'}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{step === 'confirm' && (
						<>
							{/* Proposal Summary */}
							<div className="space-y-3 p-4 bg-gray-50 rounded-lg">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">Proposta #{proposal.id}</span>
									<Badge className="bg-blue-100 text-blue-800">
										Pendente
									</Badge>
								</div>

								<div className="space-y-2 text-sm">
									<div className="flex items-center gap-2">
										<FileText className="w-4 h-4 text-gray-500" />
										<span>{proposal.nomeTipoEvento || 'Evento'}</span>
									</div>

									<div className="flex items-center gap-2">
										<DollarSign className="w-4 h-4 text-gray-500" />
										<span>R$ {proposal.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
									</div>

									<div className="flex items-center gap-2">
										<Calendar className="w-4 h-4 text-gray-500" />
										<span>
											{new Date(proposal.dataInicio).toLocaleDateString('pt-BR')} - {new Date(proposal.dataFim).toLocaleDateString('pt-BR')}
										</span>
									</div>
								</div>

								<div className="pt-2 border-t border-gray-200">
									<p className="text-sm text-gray-600">
										<strong>Contratante:</strong> {proposal.nomeContratante || 'Não informado'}
									</p>
									<p className="text-sm text-gray-600 mt-1">
										<strong>Local:</strong> {proposal.local}
									</p>
								</div>
							</div>

							{/* Warning */}
							<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
								<div className="flex gap-2">
									<AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
									<div className="text-sm">
										<p className="font-medium text-yellow-800">Atenção</p>
										<p className="text-yellow-700 mt-1">
											Ao aceitar esta proposta, você se compromete com os termos acordados.
											Um contrato será gerado automaticamente para assinatura.
										</p>
									</div>
								</div>
							</div>

							{/* Actions */}
							<div className="flex gap-3">
							<Button
								variant="outline"
								onClick={() => { handleClose(); }}
								className="flex-1"
								disabled={acceptMutation.isPending}
							>
									Cancelar
								</Button>
								<Button
									onClick={handleAccept}
									disabled={acceptMutation.isPending}
									className="flex-1 bg-green-600 hover:bg-green-700 flex items-center gap-2"
								>
									{acceptMutation.isPending ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											Processando...
										</>
									) : (
										<>
											<CheckCircle className="w-4 h-4" />
											Aceitar Proposta
										</>
									)}
								</Button>
							</div>
						</>
					)}

					{step === 'success' && (
						<>
							<div className="text-center space-y-4">
								<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
									<CheckCircle className="w-8 h-8 text-green-600" />
								</div>

								<div>
									<h3 className="text-lg font-semibold text-green-800">
										Proposta Aceita com Sucesso!
									</h3>
									<p className="text-sm text-gray-600 mt-2">
										O contrato foi gerado e está disponível para visualização e assinatura.
										O contratante será notificado sobre a aceitação.
									</p>
								</div>

								{/* Next Steps */}
								<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
									<h4 className="font-medium text-blue-800 mb-2">Próximos Passos:</h4>
									<ul className="text-sm text-blue-700 space-y-1">
										<li>• Aguarde o pagamento do sinal pelo contratante</li>
										<li>• Revise e edite o contrato se necessário</li>
										<li>• Prepare-se para o evento na data acordada</li>
									</ul>
								</div>
							</div>

							<Button onClick={handleSuccessClose} className="w-full">
								Continuar
							</Button>
						</>
					)}

					{step === 'error' && (
						<>
							<div className="text-center space-y-4">
								<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
									<AlertCircle className="w-8 h-8 text-red-600" />
								</div>

								<div>
									<h3 className="text-lg font-semibold text-red-800">
										Erro ao Aceitar Proposta
									</h3>
									<p className="text-sm text-gray-600 mt-2">
										Ocorreu um erro ao processar sua solicitação.
										Tente novamente ou entre em contato com o suporte.
									</p>
								</div>
							</div>

							<div className="flex gap-3">
								<Button variant="outline" onClick={handleClose} className="flex-1">
									Fechar
								</Button>
								<Button onClick={() => { setStep('confirm'); }} className="flex-1">
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

