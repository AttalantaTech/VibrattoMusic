import { useState, useMemo } from "react";
import { FileText, Edit, Eye, Plus, PenLine, Download } from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { ContractViewer } from "./ContractViewer";
import { ContractEditor } from "./ContractEditor";
import { useProductProposals } from "../../../hooks/useProposals";
import { useContract, useContractPDF } from "../../../hooks/useContracts";
import { useNavigate } from "@tanstack/react-router";
import { formatCurrency, formatDate } from "../../../utils/validation";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { useAuthStore } from "@/store/authStore";
import { ProposalStatusCard } from "@/components/BandProfile/Proposals/components/ProposalStatusCard";
import { PdfViewer } from "@/components/PdfViewer/PdfViewer";

export const ContractsTab = () => {
	const [isViewerOpen, setIsViewerOpen] = useState(false);
	const [isEditorOpen, setIsEditorOpen] = useState(false);

	const navigate = useNavigate();
	const { activeProduct } = useMusicalProductStore();
	const activeProductId = activeProduct?.id
		? Number(activeProduct.id)
		: undefined;

	const { user } = useAuthStore();

	const {
		data: proposals,
		isLoading: proposalsLoading,
		error: proposalsError,
	} = useProductProposals({
		productId: activeProductId || null,
		IdContratante: user?.id ?? null,
	});

	const contractProposal = useMemo(() => {
		if (!proposals) return null;

		const acceptedProposals = proposals.filter(
			(p) =>
				p.status.nome === "Aceita" ||
				p.status.nome === "AguardandoPagamento" ||
				p.status.nome === "ContratacaoConcluida"
		);

		return acceptedProposals[0] || null;
	}, [proposals]);

	const {
		data: contract,
		isLoading: contractLoading,
		error: contractError,
	} = useContract(contractProposal?.identificadorUnico || "");

	const {
		data: contractPdfUrl,
		isLoading: pdfLoading,
		error: pdfError,
	} = useContractPDF(contractProposal?.identificadorUnico || "");

	const isLoading = proposalsLoading || contractLoading || pdfLoading;
	const error = proposalsError || contractError || pdfError;

	const handleViewContract = () => {
		setIsViewerOpen(true);
	};

	const handleEditContract = () => {
		setIsEditorOpen(true);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="animate-pulse space-y-4 w-full max-w-2xl">
					<div className="h-8 bg-gray-200 rounded w-48"></div>
					<div className="h-32 bg-gray-200 rounded w-full"></div>
				</div>
			</div>
		);
	}

	if (error) {
		console.error("Error loading contract data:", error);

		return (
			<div className="flex flex-col items-center justify-center min-h-[400px] text-center">
				<FileText className="h-12 w-12 text-red-500 mb-4" />
				<h3 className="text-lg font-semibold text-gray-900 mb-2">
					Erro ao Carregar Contratos
				</h3>
				<p className="text-gray-600 max-w-md mb-4">
					Não foi possível carregar informações do contrato. Tente recarregar a
					página.
				</p>
				<Button
					onClick={() => {
						window.location.reload();
					}}
					variant="outline"
				>
					Recarregar Página
				</Button>
			</div>
		);
	}

	return (
		<div className="w-full max-w-4xl mx-auto">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">Contratos</h2>
					<p className="text-gray-600 mt-1">
						Visualize o contrato do seu produto musical
					</p>
				</div>

				{!contract && activeProduct && (
					<Button
						onClick={() => {
							void navigate({ to: "/band/contract/create" });
						}}
						className="flex items-center gap-2"
					>
						<Plus className="h-4 w-4" />
						Criar Modelo de Contrato
					</Button>
				)}
			</div>
			{!contractProposal ? (
				<div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
					<FileText className="h-12 w-12 text-gray-400 mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Nenhum contrato encontrado
					</h3>
					<p className="text-gray-600 text-center max-w-md mb-4">
						Você ainda não possui um contrato ativo. Os contratos são criados
						automaticamente quando uma proposta é aceita.
					</p>
				</div>
			) : (
				<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
					<div className="p-6 border-b border-gray-200">
						<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
							<div>
								<h3 className="text-lg font-semibold text-gray-900">
									{contractProposal.descricao ||
										`Contrato - ${contractProposal.tipoEvento.nome || "Evento"}`}
								</h3>
								<div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
									<span>Cliente: {contractProposal?.contratante?.nome}</span>
									<span>•</span>
									<span>{formatCurrency(contractProposal?.valor || 0)}</span>
									<span>•</span>
									<span>{formatDate(contractProposal?.dataInicio)}</span>
								</div>
							</div>

							<ProposalStatusCard name={contractProposal.status.nome} />
						</div>
					</div>

					<div className="bg-gray-50">
						{contractPdfUrl ? (
							<PdfViewer
								src={contractPdfUrl}
								className="w-full h-[70dvh] sm:h-[800px] border-0"
								title="Contrato PDF"
							/>
						) : (
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
						)}
					</div>

					<div className="p-4 border-t border-gray-200 bg-gray-50">
						<div className="flex justify-end flex-wrap gap-3">
							<Button
								variant="outline"
								className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 border-primary-300"
								onClick={handleViewContract}
							>
								<Eye className="h-4 w-4 mr-1" />
								Visualizar em Tela Cheia
							</Button>
							{contractProposal.status.nome === "Aceita" && (
								<>
									<Button
										variant="outline"
										className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300"
										onClick={handleEditContract}
									>
										<Edit className="h-4 w-4 mr-1" />
										Editar
									</Button>
									<Button
										className="bg-green-600 hover:bg-green-700 text-white"
										onClick={() => {
											if (contractProposal?.identificadorUnico) {
												// eslint-disable-next-line @typescript-eslint/no-floating-promises
												navigate({
													to: `/band/contract/${contractProposal.identificadorUnico}`,
												});
											}
										}}
									>
										<PenLine className="h-4 w-4 mr-1" />
										Ver e Assinar Contrato
									</Button>
								</>
							)}

							{contractPdfUrl && (
								<Button
									variant="outline"
									onClick={() => {
										const link = document.createElement("a");
										link.href = contractPdfUrl;
										link.download = `contrato-${contractProposal.id}.pdf`;
										document.body.appendChild(link);
										link.click();
										document.body.removeChild(link);
									}}
								>
									<Download className="h-4 w-4" />
									Download PDF
								</Button>
							)}
						</div>
					</div>
				</div>
			)}
			<ContractViewer
				isOpen={isViewerOpen}
				onClose={() => {
					setIsViewerOpen(false);
				}}
				identificadorUnico={contractProposal?.identificadorUnico ?? null}
			/>
			<ContractEditor
				isOpen={isEditorOpen}
				onClose={() => {
					setIsEditorOpen(false);
				}}
				identificadorUnico={contractProposal?.identificadorUnico ?? null}
			/>
		</div>
	);
};
