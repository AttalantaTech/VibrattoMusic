import { useCallback, useEffect, useRef, useState } from "react";
import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { handleCurrencyFormatting } from "@/utils";
import {
	FileText,
	Download,
	CheckCircle,
	AlertCircle,
	ArrowLeft,
	Loader2,
	XCircle,
	DollarSign,
} from "lucide-react";
import { Button } from "../../components/ui/Button/Button";
import { useContractPDF, useContractSections } from "../../hooks/useContracts";
import { useProposalById } from "../../hooks/useProposals";
import { ProposalStatusCard } from "@/components/BandProfile/Proposals/components/ProposalStatusCard";
import { proposalRoles } from "@/components/BandProfile/Proposals/utils/proposalRoles";
import { useProposalActions } from "@/components/BandProfile/Proposals/hooks/useProposalActions";
import { descriptionComplement } from "@/components/BandProfile/Proposals/utils/handleStandardProposalDescription";
import { SignatureProgress } from "@/components/BandProfile/Proposals/components/SignatureProgress";
import { DownPaymentNotice } from "@/components/BandProfile/Proposals/components/DownPaymentNotice";
import { ConfirmDownPaymentDialog } from "@/components/BandProfile/Proposals/components/ConfirmDownPaymentDialog";
import { useAuthStore } from "@/store/authStore";
import { showApiError } from "@/utils/showApiError";
import type { ProposalResponse } from "@/api/types";
import { ProposalRejectionModal } from "@/components/BandProfile/Proposals/components/ProposalRejectionModal";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { PdfViewer } from "@/components/PdfViewer/PdfViewer";

// Day only: a bare date would shift a day back in UTC-3
const formatDay = (date: string | null | undefined) =>
	date ? format(parseISO(date.slice(0, 10)), "dd/MM/yyyy") : "-";

interface ContractSignaturePageProps {
	identificadorUnico: string;
}

export const ContractSignaturePage = ({
	identificadorUnico,
}: ContractSignaturePageProps) => {
	const navigate = useNavigate();
	const router = useRouter();
	const canGoBack = useCanGoBack();

	const { activeProduct } = useMusicalProductStore();
	const { user } = useAuthStore();

	const {
		data: proposal,
		isLoading,
		error,
	} = useProposalById(identificadorUnico || "");

	const {
		accept,
		cancel,
		confirmPaidSign,
		isLoadingAccept,
		isLoadingCancel,
		isLoadingPaidSign,
	} = useProposalActions();

	const { data: pdfUrl } = useContractPDF(identificadorUnico || "");
	const { data: contractSections } = useContractSections(proposal?.id || 0);
	const { data: contractPdfUrl, isLoading: pdfLoading } = useContractPDF(
		proposal?.identificadorUnico || ""
	);

	const [downloading, setDownloading] = useState(false);
	const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
	// "Ver mais" only when the 3 lines actually cut the text (depends on width)
	const descriptionRef = useRef<HTMLParagraphElement>(null);
	const [isDescriptionClamped, setIsDescriptionClamped] = useState(false);

	useEffect(() => {
		const element = descriptionRef.current;
		if (!element || isDescriptionOpen) return;

		const measure = () => {
			setIsDescriptionClamped(element.scrollHeight > element.clientHeight + 1);
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => {
			observer.disconnect();
		};
	}, [proposal?.descricao, isDescriptionOpen]);

	// Only what the professional typed: the parties and their documents (the
	// standard text) are in the contract itself, right below
	const descriptionComplementText = descriptionComplement(proposal?.descricao);
	const [isConfirmPaymentOpen, setIsConfirmPaymentOpen] = useState(false);
	const [proposalToReject, setProposalToReject] =
		useState<ProposalResponse | null>(null);
	const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);

	const {
		isWaitingForResponse,
		isContractor,
		isAcceptedStatus,
		needsContractorPaidSign,
		signedContract,
	} = proposalRoles({
		proposal,
		user,
		productContractorId: activeProduct ? activeProduct.id : null,
	});

	const handleDownload = () => {
		if (!proposal) return;

		setDownloading(true);
		try {
			const link = document.createElement("a");
			link.href = pdfUrl || "";
			link.download = "contrato.pdf";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			URL.revokeObjectURL(pdfUrl || "");
		} catch (error) {
			showApiError(error, "Erro ao baixar contrato");
		} finally {
			setDownloading(false);
		}
	};

	const handleRejectProposal = useCallback((proposal: ProposalResponse) => {
		if (!proposal) return;
		setProposalToReject(proposal);

		setIsRejectionModalOpen(true);
	}, []);

	// Back to where the user came from (Contratações, Vendas or the chat). It
	// always went to Vendas, even for the contractor; a page opened straight
	// from a link has no history, so it falls back to the viewer's own tab
	const handleBack = () => {
		if (canGoBack) {
			router.history.back();
			return;
		}
		void navigate({
			to: "/band/me",
			search: { tab: isContractor ? "hires" : "sales" },
		});
	};

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto" />
					<p className="mt-4 text-gray-600">Carregando contrato...</p>
				</div>
			</div>
		);
	}

	if (error || proposal?.identificadorUnico === undefined) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center flex flex-col items-center">
					<AlertCircle className="h-12 w-12 text-red-600" />
					<h2 className="mt-4 text-xl font-semibold text-gray-900">
						Erro ao carregar contrato
					</h2>
					<p className="mt-2 text-gray-600">
						{error?.message ?? "Contrato não encontrado."}
					</p>
					<Button onClick={handleBack} className="mt-6">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white border-b border-gray-200 shadow-sm">
				<div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
					<Button
						variant="outline"
						size="sm"
						onClick={handleBack}
						className="flex items-center gap-2"
					>
						<ArrowLeft className="h-4 w-4" />
						Voltar
					</Button>
					<ProposalStatusCard name={proposal.status?.nome || ""} />
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				{/* Summary: the description used to fill the "Título" field in
				    large bold type; it's now a short, expandable paragraph */}
				<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
					<div className="flex items-start gap-3">
						<div className="shrink-0 rounded-lg bg-primary-50 p-2">
							<FileText className="h-5 w-5 text-primary-600" />
						</div>
						<div className="min-w-0">
							<h1 className="text-lg font-bold text-gray-900 sm:text-xl">
								Contrato
							</h1>
							<p className="text-sm text-gray-500">
								Proposta #{proposal.id}
								{proposal.tipoEvento?.nome
									? ` · ${proposal.tipoEvento.nome}`
									: ""}
							</p>
						</div>
					</div>

					<dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gray-100 pt-4 sm:grid-cols-4">
						<div>
							<dt className="text-xs text-gray-500">Data do evento</dt>
							<dd className="text-sm font-semibold text-gray-900">
								{formatDay(proposal.dataInicio)}
								{proposal.horaInicio
									? ` às ${proposal.horaInicio.slice(0, 5)}`
									: ""}
							</dd>
						</div>
						<div>
							<dt className="text-xs text-gray-500">Valor total</dt>
							<dd className="text-sm font-semibold text-gray-900">
								R$ {handleCurrencyFormatting(proposal.valor)}
							</dd>
						</div>
						<div className="col-span-2 sm:col-span-1">
							<dt className="text-xs text-gray-500">Local</dt>
							<dd className="break-words text-sm font-semibold text-gray-900">
								{proposal.local || "-"}
							</dd>
						</div>
						<div>
							<dt className="text-xs text-gray-500">Criada em</dt>
							<dd className="text-sm font-semibold text-gray-900">
								{formatDay(proposal.dataCriacao)}
							</dd>
						</div>
					</dl>

					{descriptionComplementText ? (
						<div className="mt-4 border-t border-gray-100 pt-4">
							<p className="text-xs text-gray-500">Descrição</p>
							<p
								ref={descriptionRef}
								className={`mt-1 whitespace-pre-line text-sm text-gray-700 ${
									isDescriptionOpen ? "" : "line-clamp-3"
								}`}
							>
								{descriptionComplementText}
							</p>
							{isDescriptionClamped || isDescriptionOpen ? (
								<button
									type="button"
									className="mt-1 text-sm font-medium text-primary-600 hover:text-primary-700"
									onClick={() => {
										setIsDescriptionOpen((open) => !open);
									}}
								>
									{isDescriptionOpen ? "Ver menos" : "Ver mais"}
								</button>
							) : null}
						</div>
					) : null}
				</div>

				{/* What the user has to do now goes above the contract; below it (a
				    long text) it was easy to miss */}
				{/* Who has signed and who is missing, while the contract is signed */}
				<SignatureProgress proposal={proposal} isContractor={!!isContractor} />

				{/* Contractor only; shown until the down payment is confirmed */}
				{isContractor ? <DownPaymentNotice proposal={proposal} /> : null}

				{/* PDF Viewer Section */}
				<div className="bg-white rounded-lg shadow-sm mb-6">
					<div className="border-b border-gray-200 px-6 py-4">
						<h2 className="text-lg font-semibold text-gray-900">
							Visualizar Contrato
						</h2>
					</div>
					<div className="p-6">
						{/* Contract Sections */}
						{contractSections && contractSections.length > 0 ? (
							<div className="space-y-6 max-h-[60vh] overflow-y-auto">
								{contractSections.map((section) => (
									<div
										key={section.numero}
										className="border rounded-lg p-6 bg-gray-50"
									>
										<h3 className="text-md font-semibold mb-3 text-gray-900">
											{section.numero}. {section.titulo}
										</h3>
										<div className="prose prose-sm max-w-none">
											<pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
												{section.texto}
											</pre>
										</div>
									</div>
								))}
							</div>
						) : contractPdfUrl ? (
							<div className="border-y-2 border-gray-100">
								<PdfViewer
									src={`${contractPdfUrl}#toolbar=0`}
									className="w-full h-[70dvh] sm:h-[800px] border-0"
									title="Contrato PDF"
								/>
							</div>
						) : pdfLoading ? (
							<div className="flex items-center justify-center h-[400px]">
								<div className="text-center">
									<FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
									<h4 className="text-lg font-semibold text-gray-900 mb-2">
										Carregando contrato...
									</h4>
									<p className="text-gray-600">
										O PDF do contrato está sendo carregado.
									</p>
								</div>
							</div>
						) : (
							<div className="py-12 text-center text-gray-500">
								<FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
								<p>Nenhuma seção disponível para este contrato.</p>
							</div>
						)}
					</div>
				</div>

				{/* Action Buttons */}
				<div className="bg-white rounded-lg shadow-sm p-6">
					<div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
						<Button
							variant="outline"
							size="sm"
							onClick={handleDownload}
							disabled={downloading}
							className="w-full sm:w-auto flex items-center justify-center gap-2"
						>
							{downloading ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Baixando...
								</>
							) : (
								<>
									<Download className="h-4 w-4" />
									Baixar Contrato
								</>
							)}
						</Button>

						{/* Phones: stacked full width (in one row they ran off the screen);
						    hidden when there's no action, it left a blank gap */}
						<div className="flex w-full flex-col gap-3 empty:hidden [&>*]:w-full [&>*]:h-[38px] [&>*]:px-4 [&>*]:text-sm sm:w-auto sm:flex-row sm:justify-end sm:[&>*]:w-auto">
							{/* Band actions when proposal is pending */}
							{isContractor ? (
								<>
									{isWaitingForResponse && (
										<Button
											className="bg-green-600 hover:bg-green-700 border-green-600 disabled:hover:bg-green-600 disabled:opacity-50"
											disabled={isLoadingAccept}
											onClick={async () => {
												await accept(proposal);
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
													handleRejectProposal(proposal);
												}
											}}
										>
											<XCircle className="h-4 w-4 mr-2" />
											Rejeitar Proposta
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
											onClick={() => {
												setIsConfirmPaymentOpen(true);
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
												await cancel(proposal);
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
								</>
							)}
						</div>

						{signedContract && (
							<div className="flex items-center gap-2 text-green-600">
								<CheckCircle className="h-5 w-5" />
								<span className="font-medium">Contratação Concluída</span>
							</div>
						)}
					</div>
				</div>
			</div>

			<ProposalRejectionModal
				isOpen={isRejectionModalOpen}
				onClose={() => {
					setIsRejectionModalOpen(false);
					setProposalToReject(null);
				}}
				proposal={proposalToReject}
			/>
			<ConfirmDownPaymentDialog
				proposal={isConfirmPaymentOpen ? proposal : null}
				isLoading={isLoadingPaidSign}
				onConfirm={async (confirmed) => {
					if (await confirmPaidSign(confirmed)) {
						setIsConfirmPaymentOpen(false);
					}
				}}
				onClose={() => {
					setIsConfirmPaymentOpen(false);
				}}
			/>
		</div>
	);
};
