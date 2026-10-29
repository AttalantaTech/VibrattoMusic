import { ExternalLink, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/Button/Button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PdfViewer } from "@/components/PdfViewer/PdfViewer";
import { ProposalStatusCard } from "@/components/BandProfile/Proposals/components/ProposalStatusCard";
import { useProposalByNumber, useProposalPDF } from "@/hooks/useProposals";

interface ProposalPreviewDialogProps {
	/** Proposal number from the chat link; null keeps it closed */
	proposalId: number | null;
	/** The band (seller) acts on it in Vendas, the contractor in Contratações */
	isSeller: boolean;
	onClose: () => void;
}

// "Ver proposta" in the chat: shows the proposal over the conversation, so
// the user can read it and ask about it without leaving. Actions (accept,
// reject, confirm the down payment) stay in Vendas/Contratações
export const ProposalPreviewDialog = ({
	proposalId,
	isSeller,
	onClose,
}: ProposalPreviewDialogProps) => {
	const navigate = useNavigate();
	const {
		data: proposal,
		isLoading,
		isError,
	} = useProposalByNumber(proposalId);
	const { data: pdfUrl, isLoading: pdfLoading } = useProposalPDF(
		proposal?.identificadorUnico || ""
	);

	const tab = isSeller ? "sales" : "hires";

	return (
		<Dialog
			open={!!proposalId}
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
					<div className="mb-4 pr-8">
						<DialogTitle className="text-2xl font-bold text-gray-900">
							Proposta
						</DialogTitle>
					</div>

					{isLoading ? (
						<div className="flex h-[300px] items-center justify-center">
							<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
						</div>
					) : isError || !proposal ? (
						<p className="py-10 text-center text-gray-600">
							Não foi possível carregar esta proposta.
						</p>
					) : (
						<>
							<div className="mb-4 flex flex-col gap-2">
								<ProposalStatusCard name={proposal.status.nome} />
								{proposal.status.nome === "Substituida" ? (
									<p className="text-sm text-gray-600">
										Esta proposta foi substituída por uma versão mais recente.
										Abra em {isSeller ? "Vendas" : "Contratações"} para ver a
										atual.
									</p>
								) : null}
							</div>

							{pdfUrl ? (
								<div className="border-y-2 border-gray-100">
									<PdfViewer
										src={pdfUrl}
										className="w-full h-[60dvh] sm:h-[700px] border-0"
										title="PDF da Proposta"
									/>
								</div>
							) : pdfLoading ? (
								<div className="flex h-[400px] items-center justify-center">
									<div className="text-center">
										<FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
										<p className="text-gray-600">Carregando proposta...</p>
									</div>
								</div>
							) : null}
						</>
					)}

					{/* Phones: pinned to the bottom so they stay reachable past the PDF */}
					<div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex flex-col-reverse gap-3 border-t border-gray-200 bg-white px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] [&>*]:w-full [&>*]:h-[38px] [&>*]:px-4 [&>*]:text-sm sm:static sm:mx-0 sm:mb-0 sm:flex-row sm:justify-end sm:border-0 sm:p-0 sm:[&>*]:w-auto">
						<Button variant="secondary" onClick={onClose}>
							Fechar
						</Button>
						{proposal ? (
							<Button
								onClick={() => {
									onClose();
									void navigate({
										to: "/band/me",
										search: { tab, id: proposal.id },
									});
								}}
							>
								<ExternalLink className="mr-2 h-4 w-4" />
								Abrir em {isSeller ? "Vendas" : "Contratações"}
							</Button>
						) : null}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
