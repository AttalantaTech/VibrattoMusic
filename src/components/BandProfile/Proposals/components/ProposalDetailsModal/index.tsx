import {
	AlertCircle,
	CheckCircle,
	DollarSign,
	File,
	FileText,
	Loader2,
	PenLine,
	XCircle,
} from "lucide-react";
import type { ProposalResponse } from "../../../../../api/types";
import { formatDate } from "../../../../../utils/validation";
import { Button } from "../../../../ui/Button/Button";
import type { unifiedStatusConfig } from "@/components/BandProfile/Sales/types/SalesTypes";
import { useAuthStore } from "@/store/authStore";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { ProposalStatusCard } from "@/components/BandProfile/Proposals/components/ProposalStatusCard";
import { useProposalPDF } from "@/hooks/useProposals";
import { Accordion } from "@/components/ui/Accordion";
import { useState } from "react";
import { useContractPDF } from "@/hooks/useContracts";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ProposalDetailsModalProps {
	mode: "Contracted" | "Contractor";
	proposal: ProposalResponse | null;
	isOpen: boolean;
	onClose: () => void;
	onSeeContract: (proposalId: string) => void;
	onAccept?: (proposalId: number) => Promise<void>;
	onReject?: (proposal: ProposalResponse) => void;
	onCancel?: (proposalId: number | null) => Promise<void>;
	onPaidSign?: (proposalId: number) => Promise<void>;
	isLoadingAccept?: boolean;
	isLoadingCancel?: boolean;
	isLoadingPaidSign?: boolean;
}

export const ProposalDetailsModal = ({
	proposal,
	isOpen,
	onClose,
	onSeeContract,
	onAccept,
	onPaidSign,
	onReject,
	onCancel,
	isLoadingAccept = false,
	isLoadingCancel = false,
	isLoadingPaidSign = false,
	mode,
}: ProposalDetailsModalProps) => {
	const { data: proposalPdfUrl, isLoading: proposalPdfLoading } =
		useProposalPDF(proposal?.identificadorUnico || "");
	const { data: contractPdfUrl, isLoading: contractPdfLoading } =
		useContractPDF(proposal?.identificadorUnico || "");

	const { user } = useAuthStore();
	const { activeProduct } = useMusicalProductStore();

	// Accordion sections state
	const [expandedSections, setExpandedSections] = useState({
		proposalFile: true,
		contractFile: false,
	});

	const toggleSection = (section: keyof typeof expandedSections) => {
		setExpandedSections((previous) => ({
			...previous,
			[section]: !previous[section],
		}));
	};

	if (!proposal) {
		onClose();
		return null;
	}

	const statusKey = (
		typeof proposal.status === "object" ? proposal.status.nome : proposal.status
	) as keyof typeof unifiedStatusConfig;

	const isContractor = user?.id === proposal.contratante.id;
	const isClient = activeProduct?.id === proposal.produtoMusical.id;
	const isWaitingForResponse = statusKey === "Pendente";
	const isAcceptedStatus = statusKey === "Aceita";
	const isPaidSignStatus = statusKey === "SinalPago";

	const needsContractorSignature =
		isPaidSignStatus && !proposal.assinaturaContratante;

	const needsContractedSignature =
		isPaidSignStatus && !proposal.assinaturaContratado;

	const needsContractorPaidSign =
		!isContractor && isAcceptedStatus && !proposal.assinaturaContratado;

	if (!isOpen) return null;

	return (
		// Shared dialog: bottom sheet on phones, Esc/outside click close it and
		// the page behind doesn't scroll
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent
				aria-describedby={undefined}
				className="block max-w-2xl gap-0 p-0"
			>
				<div className="p-6">
					{/* Header (the dialog's own X closes it) */}
					<div className="mb-6 pr-8">
						<DialogTitle className="text-2xl font-bold text-gray-900">
							Detalhes da Proposta
						</DialogTitle>
					</div>

					{/* Status Badge */}
					<div className="mb-6 flex flex-col gap-2">
						<ProposalStatusCard name={proposal.status.nome} />

						{proposal.status.nome === "Rejeitada" && (
							<div className="flex text-xs gap-1">
								<span className="text-gray flex">Motivo:</span>
								<span className="text-gray-500">
									{proposal.motivoRejeicao?.nome}
								</span>
							</div>
						)}
					</div>

					<div className="mt-6">
						<Accordion
							title="Proposta"
							description=""
							icon={<File className="h-5 w-5 text-gray-600" />}
							isComplete={false}
							isExpanded={expandedSections.proposalFile}
							onToggle={() => {
								toggleSection("proposalFile");
							}}
						>
							<>
								{proposalPdfUrl ? (
									<div className="border-y-2 border-gray-100">
										<iframe
											src={`${proposalPdfUrl}`}
											className="w-full h-[60dvh] sm:h-[700px] border-0"
											title="PDF da Proposta"
										/>
									</div>
								) : proposalPdfLoading ? (
									<div className="flex items-center justify-center h-[400px]">
										<div className="text-center">
											<FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
											<h4 className="text-lg font-semibold text-gray-900 mb-2">
												Carregando proposta...
											</h4>
											<p className="text-gray-600">
												O PDF da proposta está sendo carregado.
											</p>
										</div>
									</div>
								) : null}
							</>
						</Accordion>
					</div>

					<div className="mt-6">
						<Accordion
							title="Contrato"
							description=""
							icon={<File className="h-5 w-5 text-gray-600" />}
							isComplete={false}
							isExpanded={expandedSections.contractFile}
							onToggle={() => {
								toggleSection("contractFile");
							}}
						>
							<>
								{contractPdfUrl ? (
									<div className="border-y-2 border-gray-100">
										<iframe
											src={`${contractPdfUrl}`}
											className="w-full h-[60dvh] sm:h-[700px] border-0"
											title="PDF da Proposta"
										/>
									</div>
								) : contractPdfLoading ? (
									<div className="flex items-center justify-center h-[400px]">
										<div className="text-center">
											<FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
											<h4 className="text-lg font-semibold text-gray-900 mb-2">
												Carregando proposta...
											</h4>
											<p className="text-gray-600">
												O PDF da proposta está sendo carregado.
											</p>
										</div>
									</div>
								) : null}
							</>
						</Accordion>
					</div>

					{/* Creation Date */}
					<div className="text-sm text-gray-500 pt-4">
						Proposta criada em {formatDate(proposal.dataCriacao)}
					</div>

					{mode === "Contractor" && proposal.status.nome === "Aceita" && (
						<div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
							<div className="flex gap-3">
								<AlertCircle className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
								<div className="text-sm text-primary-800">
									<p className="font-medium mb-2">Importante:</p>
									<span className="block mb-4">
										Efetue o pagamento do sinal e aguarde{" "}
										<span className="font-semibold">
											{proposal.produtoMusical.nome}
										</span>{" "}
										confirmar o recebimento na plataforma. Após a confirmação,
										você receberá um email para prosseguir com a assinatura
										digital do contrato.
									</span>
								</div>
							</div>
						</div>
					)}

					{proposal.status.nome === "AguardandoAssinatura" && (
						<div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
							<div className="flex gap-3">
								<AlertCircle className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
								<div className="text-sm text-primary-800">
									<p className="font-medium mb-2">Importante:</p>
									<span className="block mb-4">
										Em instantes, você receberá um e-mail com as instruções para
										realizar a assinatura eletrônica do contrato.
									</span>

									<span className="block mb-4">
										Caso não encontre a mensagem na sua caixa de entrada,
										verifique também as pastas de Spam, Lixo Eletrônico,
										Promoções ou Atualizações.
									</span>

									<span className="block mb-4">
										Se mesmo assim o e-mail não for localizado após alguns
										minutos, entre em contato com nosso suporte para que
										possamos ajudá-lo.
									</span>
								</div>
							</div>
						</div>
					)}

					{/* Actions */}
					<div className="mt-6 flex justify-end gap-3">
						{/* Band actions when proposal is pending */}
						{mode === "Contractor" ? (
							<>
								{isWaitingForResponse && (
									<Button
										className="bg-green-600 hover:bg-green-700 border-green-600 disabled:hover:bg-green-600 disabled:opacity-50"
										disabled={isLoadingAccept}
										onClick={async () => {
											await onAccept?.(proposal.id);
											onClose();
										}}
									>
										{isLoadingAccept ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<CheckCircle className="h-4 w-4 mr-2" />
										)}
										Aceitar
									</Button>
								)}

								{/* Reject button - available for both contractor and band */}
								{isWaitingForResponse && (
									<Button
										className="text-red-600 hover:text-white hover:bg-red-500 border-red-300"
										variant="outline"
										onClick={() => {
											if (isContractor) {
												onReject?.(proposal);
												onClose();
											}
										}}
									>
										<XCircle className="h-4 w-4 mr-2" />
										Rejeitar Proposta
									</Button>
								)}

								{/* Band (contracted) signature button */}
								{needsContractedSignature && (
									<Button
										className="bg-primary-600 hover:bg-primary-700 transition-all"
										onClick={() => {
											onSeeContract(proposal.identificadorUnico);
											onClose();
										}}
									>
										<PenLine className="h-4 w-4 mr-2" />
										Ver Contrato
									</Button>
								)}
							</>
						) : (
							<>
								{/* Contractor paid sign button */}
								{needsContractorPaidSign && (
									<Button
										className="bg-green-600 hover:bg-green-700 border-green-600 disabled:hover:bg-green-600 disabled:opacity-50"
										disabled={isLoadingPaidSign}
										onClick={async () => {
											await onPaidSign?.(proposal.id);
											onClose();
										}}
									>
										{isLoadingPaidSign ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<DollarSign className="h-4 w-4 mr-2" />
										)}
										confirmar pagamento
									</Button>
								)}
								{(isWaitingForResponse || isAcceptedStatus) && (
									<Button
										className="text-red-600 hover:text-white hover:bg-red-500 border-red-300"
										variant="outline"
										disabled={isLoadingCancel}
										onClick={async () => {
											if (isClient) {
												await onCancel?.(proposal.id);
												onClose();
											}
										}}
									>
										{isLoadingCancel ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<XCircle className="h-4 w-4 mr-2" />
										)}
										Cancelar Proposta
									</Button>
								)}
								{/* Contractor signature button */}
								{needsContractorSignature && (
									<Button
										className="bg-primary-600 hover:bg-primary-700"
										onClick={() => {
											onSeeContract(proposal.identificadorUnico);
											onClose();
										}}
									>
										<PenLine className="h-4 w-4 mr-2" />
										Ver o Contrato
									</Button>
								)}
							</>
						)}

						<Button variant="secondary" onClick={onClose}>
							Fechar
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
