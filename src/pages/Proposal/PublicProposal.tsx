import { useNavigate, useParams } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button/Button";
import { useProposalPDF } from "@/hooks/useProposals";

export const PublicProposal = () => {
	const { id } = useParams({ from: "/proposta/$id" });
	const navigate = useNavigate();
	const { data: pdfUrl, isLoading, isError } = useProposalPDF(id);

	const downloadPdf = () => {
		if (!pdfUrl) return;

		const link = document.createElement("a");
		link.href = pdfUrl;
		link.download = "proposta-vibratto.pdf";
		link.click();
	};

	if (isLoading) {
		return (
			<MainLayout>
				<div className="flex items-center justify-center min-h-[60vh]">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
						<p className="text-gray-600">Carregando proposta...</p>
					</div>
				</div>
			</MainLayout>
		);
	}

	if (isError || !pdfUrl) {
		return (
			<MainLayout>
				<div className="flex items-center justify-center min-h-[60vh] px-4">
					<div className="flex flex-col text-center">
						<h2 className="text-2xl font-bold text-gray-900 mb-2">
							Proposta não encontrada
						</h2>
						<p className="text-gray-600 mb-4">
							O link pode estar incorreto ou a proposta não está mais
							disponível.
						</p>
						<Button onClick={() => navigate({ to: "/" })}>
							Voltar para a página inicial
						</Button>
					</div>
				</div>
			</MainLayout>
		);
	}

	return (
		<MainLayout>
			<div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-3">
						<FileText className="h-8 w-8 shrink-0 text-primary-600" />
						<div>
							<h1 className="text-2xl font-bold text-gray-900">Proposta</h1>
							<p className="text-sm text-gray-600">
								Confira os detalhes da proposta enviada pelo artista.
							</p>
						</div>
					</div>
					{/* Phones may show only the first page of an embedded PDF, so
					    downloading is always available */}
					<Button className="gap-2 sm:w-auto" onClick={downloadPdf}>
						<Download className="h-4 w-4" />
						Baixar PDF
					</Button>
				</div>

				<iframe
					src={pdfUrl}
					className="w-full h-[75vh] rounded-lg border border-gray-200"
					title="PDF da Proposta"
				/>
			</div>
		</MainLayout>
	);
};
