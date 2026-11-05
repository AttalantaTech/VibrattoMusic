import type { ReactNode } from "react";
import { useState } from "react";
import { DollarSign, Download, FileText, Loader2, XCircle } from "lucide-react";
import type { ProposalResponse } from "@/api/types";
import { Button } from "@/components/ui/Button/Button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PdfViewer } from "@/components/PdfViewer/PdfViewer";
import { useContractPDF, useContractSections } from "@/hooks/useContracts";
import { showApiError } from "@/utils/showApiError";
import { ProposalStatusCard } from "../ProposalStatusCard";
import { SignatureProgress } from "../SignatureProgress";
import { DownPaymentNotice } from "../DownPaymentNotice";
import { awaitsDownPayment } from "../../utils/proposalRoles";

interface ContractDetailsModalProps {
	proposal: ProposalResponse | null;
	/** The band (seller) gets the professional's actions */
	isSeller: boolean;
	onClose: () => void;
	/** Tabs to the progress and the proposal, under the title */
	navigation?: ReactNode;
	onCancel?: (proposal: ProposalResponse) => Promise<void>;
	onPaidSign?: (proposal: ProposalResponse) => void;
	isLoadingCancel?: boolean;
	isLoadingPaidSign?: boolean;
}

/**
 * The contract over the current screen (chat, Vendas, Contratações), the same
 * content as its page: who has signed, the down payment, the document and the
 * actions. Closing it leaves the user where they were
 */
export const ContractDetailsModal = ({
	proposal,
	isSeller,
	onClose,
	navigation,
	onCancel,
	onPaidSign,
	isLoadingCancel = false,
	isLoadingPaidSign = false,
}: ContractDetailsModalProps) => {
	const identificadorUnico = proposal?.identificadorUnico ?? "";
	const { data: contractPdfUrl, isLoading: pdfLoading } =
		useContractPDF(identificadorUnico);
	const { data: contractSections } = useContractSections(proposal?.id ?? 0);
	const [downloading, setDownloading] = useState(false);

	if (!proposal) return null;

	const status = proposal.status.nome;
	const canConfirmDownPayment =
		isSeller && awaitsDownPayment(proposal) && !!onPaidSign;
	// While the hiring isn't done the professional can still call it off
	const canCancel = isSeller && status === "Aceita" && !!onCancel;

	const handleDownload = () => {
		if (!contractPdfUrl) return;
		setDownloading(true);
		try {
			const link = document.createElement("a");
			link.href = contractPdfUrl;
			link.download = "contrato.pdf";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (error) {
			showApiError(error, "Erro ao baixar contrato");
		} finally {
			setDownloading(false);
		}
	};

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent
				aria-describedby={undefined}
				// The action bar carries the bottom safe area itself (pinned there)
				className="block max-w-4xl gap-0 p-0 max-sm:pb-0"
			>
				<div className="p-6">
					<div className="mb-4 pr-8">
						<DialogTitle className="text-2xl font-bold text-gray-900">
							Contrato
						</DialogTitle>
					</div>
					{navigation}

					<div className="mb-2">
						<ProposalStatusCard name={status} />
					</div>

					<SignatureProgress proposal={proposal} isContractor={!isSeller} />
					<DownPaymentNotice proposal={proposal} isContractor={!isSeller} />

					<div className="mt-6 rounded-lg border border-gray-200">
						{contractSections && contractSections.length > 0 ? (
							<div className="max-h-[60vh] space-y-4 overflow-y-auto p-4">
								{contractSections.map((section) => (
									<div
										key={section.numero}
										className="rounded-lg border bg-gray-50 p-4"
									>
										<h3 className="mb-2 font-semibold text-gray-900">
											{section.numero}. {section.titulo}
										</h3>
										<pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">
											{section.texto}
										</pre>
									</div>
								))}
							</div>
						) : contractPdfUrl ? (
							<PdfViewer
								src={`${contractPdfUrl}#toolbar=0`}
								className="h-[60dvh] w-full border-0 sm:h-[700px]"
								title="Contrato PDF"
							/>
						) : (
							<div className="py-12 text-center text-gray-500">
								<FileText className="mx-auto mb-3 h-10 w-10 text-gray-400" />
								<p>
									{pdfLoading
										? "Carregando contrato..."
										: "O contrato ainda não está disponível."}
								</p>
							</div>
						)}
					</div>

					{/* Actions pinned to the bottom so they stay in view while the
					    contract scrolls. Phones: stacked full width */}
					<div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex flex-col gap-3 border-t border-gray-200 bg-white px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] [&>*]:h-[38px] [&>*]:w-full [&>*]:whitespace-nowrap [&>*]:px-4 [&>*]:text-sm sm:flex-row sm:flex-wrap sm:justify-end sm:pb-4 sm:[&>*]:w-auto">
						{canConfirmDownPayment ? (
							<Button
								className="border-green-600 bg-green-600 hover:bg-green-700 disabled:opacity-50"
								disabled={isLoadingPaidSign}
								onClick={() => {
									onPaidSign?.(proposal);
								}}
							>
								{isLoadingPaidSign ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<DollarSign className="mr-2 h-4 w-4" />
								)}
								Confirmar Recebimento do Sinal
							</Button>
						) : null}
						{canCancel ? (
							<Button
								className="border-red-300 text-red-600 hover:bg-red-500 hover:text-white"
								variant="outline"
								disabled={isLoadingCancel}
								onClick={async () => {
									await onCancel?.(proposal);
									onClose();
								}}
							>
								{isLoadingCancel ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<XCircle className="mr-2 h-4 w-4" />
								)}
								Cancelar Proposta
							</Button>
						) : null}
						<Button
							variant="outline"
							disabled={!contractPdfUrl || downloading}
							onClick={handleDownload}
						>
							<Download className="mr-2 h-4 w-4" />
							Baixar Contrato
						</Button>
						<Button variant="secondary" onClick={onClose}>
							Fechar
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
