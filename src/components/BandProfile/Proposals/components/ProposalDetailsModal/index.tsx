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
import type { ProposalResponse, User } from "../../../../../api/types";
import { formatDate } from "../../../../../utils/validation";
import { Button } from "../../../../ui/Button/Button";
import { useAuthStore } from "@/store/authStore";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { ProposalStatusCard } from "@/components/BandProfile/Proposals/components/ProposalStatusCard";
import { DownPaymentNotice } from "@/components/BandProfile/Proposals/components/DownPaymentNotice";
import { useProposalPDF } from "@/hooks/useProposals";
import { Accordion } from "@/components/ui/Accordion";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PdfViewer } from "@/components/PdfViewer/PdfViewer";

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

const handleStatus = ({
	productContractorId,
	proposal,
	user,
}: {
	productContractorId: number | null;
	proposal: ProposalResponse | undefined;
	user: User | null;
}) => {
	const isWaitingForResponse = proposal?.status.nome === "Pendente";

	const isContractor =
		proposal?.produtoMusicalContratante.id === productContractorId ||
		user?.id === proposal?.contratante.id;

	const isAcceptedStatus = proposal?.status.nome === "Aceita";
	const needsContractorPaidSign =
		!isContractor && proposal?.status.nome === "AguardandoPagamento";

	const signedContract = proposal?.status.nome === "ContratacaoConcluida";

	return {
		isWaitingForResponse,
		isContractor,
		isAcceptedStatus,
		needsContractorPaidSign,
		signedContract,
	};
};

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

	const { user } = useAuthStore();
	const { activeProduct } = useMusicalProductStore();

	// Accordion sections state
	const [expandedSections, setExpandedSections] = useState({
		proposalFile: true,
	});

	const toggleSection = (section: keyof typeof expandedSections) => {
		setExpandedSections((previous) => ({
			...previous,
			[section]: !previous[section],
		}));
	};

	// Nothing to show yet. It used to call onClose() here, during render: a
	// stale render without the proposal then closed a dialog that had just
	// been opened (the "Ver proposta" link never showed it)
	if (!proposal) return null;

	const {
		isWaitingForResponse,
		isContractor,
		isAcceptedStatus,
		needsContractorPaidSign,
		signedContract,
	} = handleStatus({
		proposal,
		user,
		productContractorId: activeProduct ? activeProduct.id : null,
	});

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
				// The action bar carries the bottom safe area itself (pinned there)
				className="block max-w-2xl gap-0 p-0 max-sm:pb-0"
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

					{/* Only the proposal; the contract opens from the menu (Visualizar Contrato) */}
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
										<PdfViewer
											src={proposalPdfUrl}
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

					{/* Creation Date */}
					<div className="text-sm text-gray-500 pt-4">
						Proposta criada em {formatDate(proposal.dataCriacao)}
					</div>

					{proposal.status.nome === "Aceita" ? (
						<div className="my-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
							<div className="flex gap-3">
								<AlertCircle className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
								<div className="text-sm text-primary-800">
									<p className="font-medium mb-2">Importante:</p>

									<span className="block mb-4">
										O contrato precisa ser assinado eletronicamente pelas duas
										partes (contratante e contratado). O processo só avança para
										a próxima etapa depois que ambos assinarem.
									</span>
									<span className="block mb-4">
										Cada parte receberá um e-mail com as instruções para
										assinar. Caso não encontre a mensagem na caixa de entrada,
										verifique também as pastas de Spam, Lixo Eletrônico,
										Promoções ou Atualizações. Se você já assinou, aguarde a
										assinatura da outra parte.
									</span>
									<span className="block mb-4">
										Se o e-mail não chegar após alguns minutos, entre em contato
										com nosso suporte.
									</span>
								</div>
							</div>
						</div>
					) : null}

					{/* Contractor only; shown until the down payment is confirmed */}
					{isContractor ? <DownPaymentNotice proposal={proposal} /> : null}

					{/* Actions pinned to the bottom so they stay in view while the PDF
					    (often several pages) scrolls. Phones: stacked full width; in
					    one row they ran off the left edge */}
					<div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex flex-col gap-3 border-t border-gray-200 bg-white px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] [&>*]:w-full [&>*]:h-[38px] [&>*]:px-4 [&>*]:text-sm sm:flex-row sm:justify-end sm:pb-4 sm:[&>*]:w-auto">
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
								{isAcceptedStatus && (
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
										Confirmar Recebimento do Sinal
									</Button>
								)}
								{(isWaitingForResponse || isAcceptedStatus) && (
									<Button
										className="text-red-600 hover:text-white hover:bg-red-500 border-red-300"
										variant="outline"
										disabled={isLoadingCancel}
										onClick={async () => {
											await onCancel?.(proposal.id);
											onClose();
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
								{isAcceptedStatus && (
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

						{signedContract && (
							<div className="flex items-center gap-2 text-green-600">
								<CheckCircle className="h-5 w-5" />
								<span className="font-medium">Contratação Concluída</span>
							</div>
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
