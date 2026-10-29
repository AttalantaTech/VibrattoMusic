import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
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
import { toast } from "sonner";
import {
	PROPOSAL_QUERY_KEYS,
	useProposalById,
	useUpdateProposalStatus,
} from "../../hooks/useProposals";
import { ProposalStatusCard } from "@/components/BandProfile/Proposals/components/ProposalStatusCard";
import { DownPaymentNotice } from "@/components/BandProfile/Proposals/components/DownPaymentNotice";
import { ConfirmDownPaymentDialog } from "@/components/BandProfile/Proposals/components/ConfirmDownPaymentDialog";
import { useAuthStore } from "@/store/authStore";
import { entityLinks } from "@/features/message/utils/messageTemplates";
import {
	proposalParties,
	resolveStatusSender,
} from "@/features/message/utils/resolveStatusSender";
import { useSendStatusMessage } from "@/features/message/hooks/useSendStatusMessage";
import { showApiError } from "@/utils/showApiError";
import type { ProposalResponse, User } from "@/api/types";
import { ProposalRejectionModal } from "@/components/BandProfile/Proposals/components/ProposalRejectionModal";
import { useQueryClient } from "@tanstack/react-query";
import type { Conversation } from "@/api/services/messages/types";
import { useConversations } from "@/hooks/useMessaging";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { PdfViewer } from "@/components/PdfViewer/PdfViewer";

interface ContractSignaturePageProps {
	identificadorUnico: string;
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

export const ContractSignaturePage = ({
	identificadorUnico,
}: ContractSignaturePageProps) => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { activeProduct } = useMusicalProductStore();
	const { user } = useAuthStore();

	const {
		data: proposal,
		isLoading,
		error,
	} = useProposalById(identificadorUnico || "");

	const { data: conversationsData } = useConversations({
		IdContratante: activeProduct?.id ? null : user?.id,
		IdProdutoMusical: activeProduct?.id || null,
	});
	const updateStatusMutation = useUpdateProposalStatus();
	const { sendStatusMessage } = useSendStatusMessage();

	const { data: pdfUrl } = useContractPDF(identificadorUnico || "");
	const { data: contractSections } = useContractSections(proposal?.id || 0);
	const { data: contractPdfUrl, isLoading: pdfLoading } = useContractPDF(
		proposal?.identificadorUnico || ""
	);

	const [downloading, setDownloading] = useState(false);
	const [isLoadingPaidSign, setIsLoadingPaidSign] = useState(false);
	const [isConfirmPaymentOpen, setIsConfirmPaymentOpen] = useState(false);
	const [isLoadingCancel, setIsLoadingCancel] = useState(false);
	const [proposalToReject, setProposalToReject] =
		useState<ProposalResponse | null>(null);
	const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
	const [isLoadingAccept, setIsLoadingAccept] = useState(false);

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

	const conversation = useMemo<Conversation | null>(() => {
		if (!proposal || !conversationsData) return null;

		const { produtoMusicalContratanteId, contratanteId } =
			proposalParties(proposal);

		return (
			conversationsData.find((c) => {
				if (c.produtoMusicalId !== proposal.produtoMusical.id) return false;

				return produtoMusicalContratanteId
					? c.produtoMusicalContratanteId === produtoMusicalContratanteId
					: !c.produtoMusicalContratanteId && c.contratanteId === contratanteId;
			}) ?? null
		);
	}, [conversationsData, proposal]);

	const handleInvalidateProposalQuery = useCallback(() => {
		void queryClient.invalidateQueries({
			queryKey: PROPOSAL_QUERY_KEYS.byId(identificadorUnico),
		});
	}, [identificadorUnico, queryClient]);

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

	const handleAcceptProposal = async (proposalId: number) => {
		try {
			setIsLoadingAccept(true);
			await updateStatusMutation.mutateAsync({
				proposalId: proposalId,
				status: "aceito",
			});

			if (proposal) {
				sendStatusMessage({
					type: "proposalAccepted",
					...resolveStatusSender(proposalParties(proposal), "contratante"),
					conversationId: conversation?.id,
					produtoMusicalName: proposal.produtoMusical.nome,
					link: entityLinks.proposalTab(proposal.id),
					errorMessage: "Erro ao enviar solicitação orçamento",
					payload: {},
					onSuccess() {
						handleInvalidateProposalQuery();
					},
				});
			}
		} catch (error) {
			showApiError(
				error,
				"Erro ao tentar aceitar a proposta. Tente novamente."
			);
		} finally {
			setIsLoadingAccept(false);
		}
	};

	const handlePaidSign = async (proposalId: number) => {
		try {
			setIsLoadingPaidSign(true);
			await updateStatusMutation.mutateAsync({
				proposalId: proposalId,
				status: "sinalPago",
			});
			setIsConfirmPaymentOpen(false);

			if (proposal) {
				sendStatusMessage({
					type: "proposalPaidSign",
					...resolveStatusSender(proposalParties(proposal), "contratado"),
					conversationId: conversation?.id,
					produtoMusicalName: proposal.produtoMusical.nome,
					link: entityLinks.proposalTab(proposal.id),
					errorMessage: "Erro ao enviar sua requisição",
					payload: {},
					onSuccess() {
						handleInvalidateProposalQuery();
					},
				});
			}
		} catch (error) {
			showApiError(error, "Erro ao confirmar o sinal. Tente novamente.");
		} finally {
			setIsLoadingPaidSign(false);
		}
	};

	const handleCancelProposal = useCallback(
		async (proposalId: number | null) => {
			try {
				setIsLoadingCancel(true);
				if (!proposalId) {
					toast.error("Proposta não encontrada.");
					return;
				}

				await updateStatusMutation.mutateAsync({
					proposalId,
					status: "cancelado",
				});

				if (proposal) {
					sendStatusMessage({
						type: "proposalCanceled",
						...resolveStatusSender(proposalParties(proposal), "contratado"),
						conversationId: conversation?.id,
						produtoMusicalName: proposal.produtoMusical.nome,
						link: entityLinks.proposalTab(proposal.id),
						errorMessage: "Erro ao enviar requisição",
						payload: {},
						onSuccess() {
							handleInvalidateProposalQuery();
						},
					});
				}
			} catch (error) {
				showApiError(error, "Error updating proposal status:");
			} finally {
				setIsLoadingCancel(false);
			}
		},
		[
			updateStatusMutation,
			sendStatusMessage,
			proposal,
			handleInvalidateProposalQuery,
			conversation,
		]
	);

	const handleRejectProposal = useCallback((proposal: ProposalResponse) => {
		if (!proposal) return;
		setProposalToReject(proposal);

		setIsRejectionModalOpen(true);
	}, []);

	const handleBack = () => {
		void navigate({ to: "/band/me", search: { tab: "sales" } });
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
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-3 sm:gap-4">
							<Button
								variant="outline"
								size="sm"
								onClick={handleBack}
								className="flex items-center gap-2"
							>
								<ArrowLeft className="h-4 w-4" />
								Voltar
							</Button>
							<div className="flex items-center gap-3">
								<FileText className="h-6 w-6 text-primary-600" />
								<div>
									<h1 className="text-xl font-bold text-gray-900">
										Contrato
										{/* #{proposal.idContrato} AQUI */}
									</h1>
									<p className="text-sm text-gray-600">
										Proposta #{proposal.id}
									</p>
								</div>
							</div>
						</div>

						<div className="self-start sm:self-auto">
							<ProposalStatusCard name={proposal.status?.nome || ""} />
						</div>
					</div>
				</div>
			</div>
			{/* Contract Info */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div>
							<p className="text-sm text-gray-600">Data de Criação</p>
							<p className="text-lg font-semibold text-gray-900">
								{new Date(proposal.dataCriacao).toLocaleDateString("pt-BR")}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-600">Valor Total</p>
							<p className="text-lg font-semibold text-gray-900">
								R${" "}
								{proposal.valor.toLocaleString("pt-BR", {
									minimumFractionDigits: 2,
								})}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-600">Título</p>
							<p className="text-lg font-semibold text-gray-900">
								{proposal.descricao}
							</p>
						</div>
					</div>
				</div>

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

				{proposal.status.nome === "Aceita" ? (
					<div className="my-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
						<div className="flex gap-3">
							<AlertCircle className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
							<div className="text-sm text-primary-800">
								<p className="font-medium mb-2">Importante:</p>

								<span className="block mb-4">
									O contrato precisa ser assinado eletronicamente pelas duas
									partes (contratante e contratado). O processo só avança para a
									próxima etapa depois que ambos assinarem.
								</span>
								<span className="block mb-4">
									Cada parte receberá um e-mail com as instruções para assinar.
									Caso não encontre a mensagem na caixa de entrada, verifique
									também as pastas de Spam, Lixo Eletrônico, Promoções ou
									Atualizações. Se você já assinou, aguarde a assinatura da
									outra parte.
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

				{/* Action Buttons */}
				<div className="bg-white rounded-lg shadow-sm p-6">
					<div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
						<Button
							variant="outline"
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

						<div className="mt-6 flex justify-end gap-3">
							{/* Band actions when proposal is pending */}
							{isContractor ? (
								<>
									{isWaitingForResponse && (
										<Button
											className="bg-green-600 hover:bg-green-700 border-green-600 disabled:hover:bg-green-600 disabled:opacity-50"
											disabled={isLoadingAccept}
											onClick={async () => {
												await handleAcceptProposal(proposal.id);
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
												await handleCancelProposal(proposal.id);
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
					await handlePaidSign(confirmed.id);
				}}
				onClose={() => {
					setIsConfirmPaymentOpen(false);
				}}
			/>
		</div>
	);
};
