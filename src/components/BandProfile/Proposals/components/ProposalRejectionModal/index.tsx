import { useCallback, useState } from "react";
import {
	XCircle,
	AlertCircle,
	Loader2,
	FileText,
	DollarSign,
	Calendar,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/Badge/Badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/Select/Select";
import { Textarea } from "@/components/ui/Textarea/Textarea";
import {
	PROPOSAL_QUERY_KEYS,
	useUpdateProposalStatus,
} from "@/hooks/useProposals";
import { useMotivosRejeicaoProposta } from "@/hooks/useFilters";
import type { ProposalResponse, FilterOption } from "@/api/types";
import { proposalRejectionSchema } from "@/schemas/contractSchemas";
import { Label } from "@/components/ui/Label/Label";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { Button } from "@/components/ui/Button/Button";
import { useSendStatusMessage } from "@/features/message/hooks/useSendStatusMessage";
import { entityLinks } from "@/features/message/utils/messageTemplates";
import { useQueryClient } from "@tanstack/react-query";

interface ProposalRejectionModalProps {
	isOpen: boolean;
	onClose: () => void;
	proposal: ProposalResponse | null;
}

// Component logic moved to function body to use hooks

export const ProposalRejectionModal = ({
	isOpen,
	onClose,
	proposal,
}: ProposalRejectionModalProps) => {
	const queryClient = useQueryClient();

	const [step, setStep] = useState<"reason" | "confirm" | "success" | "error">(
		"reason"
	);
	const [selectedReasonId, setSelectedReasonId] = useState<number | null>(null);
	const [acceptsCounterProposal, setAcceptsCounterProposal] =
		useState<boolean>(false);
	const [additionalComments, setAdditionalComments] = useState("");
	const [validationError, setValidationError] = useState<string | null>(null);

	// Fetch rejection reasons from API
	const {
		data: rejectionReasons,
		isLoading: isLoadingReasons,
		error: reasonsError,
	} = useMotivosRejeicaoProposta(isOpen);

	const rejectMutation = useUpdateProposalStatus();
	const { sendStatusMessage } = useSendStatusMessage();

	const selectedReason = rejectionReasons?.find(
		(r) => r.Id === selectedReasonId
	);

	const handleNext = () => {
		if (!selectedReasonId) {
			setValidationError("Por favor, selecione um motivo para rejeição.");
			return;
		}

		setValidationError(null);
		setStep("confirm");
	};

	const handleInvalidateProposalQuery = useCallback(() => {
		void queryClient.invalidateQueries({
			queryKey: PROPOSAL_QUERY_KEYS.byId(proposal?.identificadorUnico || ""),
		});
	}, [proposal?.identificadorUnico, queryClient]);

	const handleReject = async () => {
		if (!proposal || !selectedReasonId) return;

		// Validate the rejection data
		const validation = proposalRejectionSchema.safeParse({
			IdMotivoRejeicao: selectedReasonId,
		});

		if (!validation.success) {
			setValidationError(
				validation.error.issues?.[0]?.message || "Erro de validação"
			);
			setStep("reason");
			return;
		}

		try {
			await rejectMutation.mutateAsync({
				proposalId: proposal.id,
				status: "rejeitado",
				reasonId: selectedReasonId,
				acceptsCounterProposal,
			});

			const produtoMusicalContratanteId = proposal
				? proposal?.produtoMusicalContratante.id > 0
					? proposal?.produtoMusicalContratante.id
					: 0
				: 0;

			const senderType = produtoMusicalContratanteId ? 2 : 1;

			sendStatusMessage({
				type: "proposalRejected",
				produtoMusicalId: proposal?.produtoMusical.id || 0,
				produtoMusicalName: proposal?.produtoMusical.nome || "",
				contratanteId: proposal.contratante.id || 0,
				produtoMusicalContratanteId,
				senderType,
				link: entityLinks.proposalTab(proposal?.id || 0),

				errorMessage: "Erro ao enviar solicitação orçamento",
				payload: { reason: selectedReason?.Nome || "-" },
				onSuccess() {
					handleInvalidateProposalQuery();
				},
			});

			setStep("success");
		} catch (error) {
			console.error("Error rejecting proposal:", error);
			setStep("error");
		}
	};

	const handleClose = () => {
		setStep("reason");
		setSelectedReasonId(null);
		setAdditionalComments("");
		setValidationError(null);
		onClose();
	};

	const handleSuccessClose = () => {
		setStep("reason");
		setSelectedReasonId(null);
		setAdditionalComments("");
		setAcceptsCounterProposal(false);
		setValidationError(null);
		onClose();
	};

	if (!proposal) return null;

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{step === "reason" && <XCircle className="w-5 h-5 text-red-600" />}
						{step === "confirm" && (
							<AlertCircle className="w-5 h-5 text-orange-600" />
						)}
						{step === "success" && <XCircle className="w-5 h-5 text-red-600" />}
						{step === "error" && (
							<AlertCircle className="w-5 h-5 text-red-600" />
						)}
						{step === "reason" && "Rejeitar Proposta"}
						{step === "confirm" && "Confirmar Rejeição"}
						{step === "success" && "Proposta Rejeitada"}
						{step === "error" && "Erro na Rejeição"}
					</DialogTitle>

					<DialogDescription />
				</DialogHeader>

				<div className="space-y-6">
					{step === "reason" && (
						<>
							{/* Proposal Summary */}
							<div className="space-y-3 p-4 bg-gray-50 rounded-lg">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">
										Proposta #{proposal.id}
									</span>
									<Badge className="bg-red-100 text-red-800">
										Será Rejeitada
									</Badge>
								</div>

								<div className="space-y-2 text-sm">
									<div className="flex items-center gap-2">
										<FileText className="w-4 h-4 text-gray-500" />
										<span>{proposal.nomeTipoEvento || "Evento"}</span>
									</div>

									<div className="flex items-center gap-2">
										<DollarSign className="w-4 h-4 text-gray-500" />
										<span>
											R${" "}
											{proposal.valor.toLocaleString("pt-BR", {
												minimumFractionDigits: 2,
											})}
										</span>
									</div>

									<div className="flex items-center gap-2">
										<Calendar className="w-4 h-4 text-gray-500" />
										<span>
											{new Date(proposal.dataInicio).toLocaleDateString(
												"pt-BR"
											)}{" "}
											- {new Date(proposal.dataFim).toLocaleDateString("pt-BR")}
										</span>
									</div>
								</div>
							</div>

							{/* Reason Selection */}
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Motivo da Rejeição *
									</label>
									<Select
										value={String(
											rejectionReasons?.find((r) => r.Id === selectedReasonId)
												?.Id
										)}
										onValueChange={(value) => {
											setSelectedReasonId(Number(value));
										}}
										disabled={isLoadingReasons || !!reasonsError}
									>
										<SelectTrigger className="w-full">
											<SelectValue
												className="bg-red-500"
												placeholder={
													isLoadingReasons
														? "Carregando motivos..."
														: "Selecione um motivo..."
												}
											/>
										</SelectTrigger>
										<SelectContent>
											{rejectionReasons?.map((reason: FilterOption) => (
												<SelectItem key={reason.Id} value={String(reason.Id)}>
													{reason.Nome}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{validationError && (
										<p className="text-sm text-red-600 mt-1">
											{validationError}
										</p>
									)}
									{reasonsError && (
										<p className="text-sm text-red-600 mt-1">
											Erro ao carregar motivos de rejeição. Tente novamente.
										</p>
									)}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Comentários Adicionais (Opcional)
									</label>
									<Textarea
										value={additionalComments}
										onChange={(event) => {
											setAdditionalComments(event.target.value);
										}}
										placeholder="Explique brevemente o motivo da rejeição..."
										rows={3}
										maxLength={500}
									/>
									<p className="text-xs text-gray-500 mt-1">
										{additionalComments.length}/500 caracteres
									</p>
								</div>

								<div className="flex items-center gap-3">
									<Checkbox
										id="acceptsCounterProposal"
										checked={acceptsCounterProposal}
										onCheckedChange={(checked) => {
											setAcceptsCounterProposal(Boolean(checked));
										}}
									/>
									<Label
										htmlFor="availabilityOtherEvents"
										className="text-sm font-medium text-gray-700 cursor-pointer"
									>
										Aceita contraproposta
									</Label>
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
									onClick={handleNext}
									className="flex-1 bg-red-600 hover:bg-red-700"
								>
									Continuar
								</Button>
							</div>
						</>
					)}

					{step === "confirm" && selectedReason && (
						<>
							{/* Confirmation */}
							<div className="space-y-4">
								<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
									<div className="flex gap-2">
										<AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
										<div className="text-sm">
											<p className="font-medium text-red-800">
												Confirme a rejeição
											</p>
											<p className="text-red-700 mt-1">
												Você está prestes a rejeitar esta proposta. Esta ação
												não pode ser desfeita.
											</p>
										</div>
									</div>
								</div>

								<div className="space-y-3">
									<div>
										<p className="text-sm font-medium text-gray-700">
											Motivo selecionado:
										</p>
										<p className="text-sm text-gray-600 mt-1">
											{selectedReason.Nome}
										</p>
									</div>

									{additionalComments && (
										<div>
											<p className="text-sm font-medium text-gray-700">
												Descrição:
											</p>
											<p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
												{additionalComments}
											</p>
										</div>
									)}
								</div>
							</div>

							{/* Actions */}
							<div className="flex gap-3">
								<Button
									variant="outline"
									onClick={() => {
										setStep("reason");
									}}
									className="flex-1"
									disabled={rejectMutation.isPending}
								>
									Voltar
								</Button>
								<Button
									onClick={handleReject}
									disabled={rejectMutation.isPending}
									className="flex-1 bg-red-600 hover:bg-red-700 flex items-center gap-2"
								>
									{rejectMutation.isPending ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											Processando...
										</>
									) : (
										<>
											<XCircle className="w-4 h-4" />
											Confirmar Rejeição
										</>
									)}
								</Button>
							</div>
						</>
					)}

					{step === "success" && (
						<>
							<div className="text-center space-y-4">
								<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
									<XCircle className="w-8 h-8 text-red-600" />
								</div>

								<div>
									<h3 className="text-lg font-semibold text-red-800">
										Proposta Rejeitada
									</h3>
									<p className="text-sm text-gray-600 mt-2">
										A proposta foi rejeitada com sucesso. O contratante será
										notificado sobre sua decisão.
									</p>
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
										Erro na Rejeição
									</h3>
									<p className="text-sm text-gray-600 mt-2">
										Ocorreu um erro ao rejeitar a proposta. Tente novamente ou
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
										setStep("reason");
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
