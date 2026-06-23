import { useState } from "react";
import {
	Download,
	FileText,
	Calendar,
	User,
	DollarSign,
	Clock,
} from "lucide-react";
import { Button } from "../../ui/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../../ui/dialog";
import { LoadingSpinner } from "../../ui/LoadingSpinner/LoadingSpinner";
import { Badge } from "../../ui/Badge/Badge";
import { useNavigate } from "@tanstack/react-router";
import { useProposalById } from "../../../hooks/useProposals";
import { useContractSections } from "../../../hooks/useContracts";

interface ContractViewerProps {
	isOpen: boolean;
	onClose: () => void;
	identificadorUnico: string | null;
}

const getStatusColor = (status: string) => {
	switch (status) {
		case "Pendente":
			return "bg-yellow-100 text-yellow-800";
		case "Aceita":
			return "bg-primary-100 text-primary-800";
		case "Sinal Pago":
			return "bg-green-100 text-green-800";
		case "Concluído":
			return "bg-gray-100 text-gray-800";
		case "Cancelado":
			return "bg-red-100 text-red-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
};

const getStatusLabel = (status: string) => {
	switch (status) {
		case "Pendente":
			return "Pendente";
		case "Aceita":
			return "Aceita";
		case "Sinal Pago":
			return "Sinal Pago";
		case "Concluído":
			return "Concluído";
		case "Cancelado":
			return "Cancelado";
		default:
			return status;
	}
};

export const ContractViewer = ({
	isOpen,
	onClose,
	identificadorUnico,
}: ContractViewerProps) => {
	const [downloading, setDownloading] = useState(false);
	const navigate = useNavigate();

	const {
		data: proposal,
		isLoading,
		error,
	} = useProposalById(identificadorUnico || "");

	const { data: contractSections } = useContractSections(proposal?.id || 0);

	const handleDownload = () => {
		if (!proposal) return;

		setDownloading(true);
		try {
			// TODO: Implement actual contract download
			// For now, create a simple text representation
			const contractText = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS ARTÍSTICOS

Contrato ID: ${proposal.idContrato}
Proposta ID: ${proposal.id}
Título: ${proposal.descricao}
Status: ${getStatusLabel(proposal.status?.nome || "")}
Valor Total: R$ ${proposal.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
Data de Criação: ${new Date(proposal.dataCriacao).toLocaleDateString("pt-BR")}

${
	contractSections
		?.map(
			(section) =>
				`${section.numero}. ${section.titulo}\n\n${section.texto}\n\n`
		)
		.join("") || "Nenhuma seção disponível."
}
			`;

			const blob = new Blob([contractText], {
				type: "text/plain;charset=utf-8",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `contrato-${proposal.id}.txt`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Erro ao baixar contrato:", error);
		} finally {
			setDownloading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<FileText className="w-6 h-6 text-primary-600" />
							<DialogTitle className="text-xl font-semibold">
								{proposal ? `Contrato #${proposal.id}` : "Contrato"}
							</DialogTitle>
						</div>
					</div>
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<LoadingSpinner />
					</div>
				) : error ? (
					<div className="flex flex-col items-center justify-center py-8 text-gray-500">
						<FileText className="w-12 h-12 mb-4" />
						<p>Erro ao carregar contrato</p>
						<p className="text-sm text-gray-400 mt-2">{error.message}</p>
					</div>
				) : proposal ? (
					<div className="space-y-6">
						{/* Informações do contrato */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
							<div className="flex items-center gap-2">
								<Calendar className="w-4 h-4 text-gray-500" />
								<div>
									<p className="text-sm text-gray-500">Criado em</p>
									<p className="font-medium">
										{new Date(proposal.dataCriacao).toLocaleDateString("pt-BR")}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<User className="w-4 h-4 text-gray-500" />
								<div>
									<p className="text-sm text-gray-500">Status</p>
									<Badge
										className={getStatusColor(proposal.status?.nome || "")}
									>
										{getStatusLabel(proposal.status?.nome || "")}
									</Badge>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<DollarSign className="w-4 h-4 text-gray-500" />
								<div>
									<p className="text-sm text-gray-500">Valor Total</p>
									<p className="font-medium">
										R${" "}
										{proposal.valor.toLocaleString("pt-BR", {
											minimumFractionDigits: 2,
										})}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<Clock className="w-4 h-4 text-gray-500" />
								<div>
									<p className="text-sm text-gray-500">Proposta</p>
									<p className="font-medium">#{proposal.id}</p>
								</div>
							</div>
						</div>

						{/* Seções do contrato */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Conteúdo do Contrato</h3>

							{contractSections && contractSections.length > 0 ? (
								<div className="space-y-6">
									{contractSections.map((section) => (
										<div
											key={section.numero}
											className="border rounded-lg p-6 bg-white"
										>
											<h4 className="text-md font-semibold mb-3">
												{section.numero}. {section.titulo}
											</h4>
											<div className="prose prose-sm max-w-none">
												<pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
													{section.texto}
												</pre>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="border rounded-lg p-6 bg-gray-50 text-center">
									<p className="text-gray-500">
										Nenhuma seção disponível para este contrato.
									</p>
								</div>
							)}
						</div>

						{/* Ações */}
						<div className="flex justify-between items-center pt-4 border-t">
							<Button
								variant="outline"
								onClick={handleDownload}
								disabled={downloading}
								className="flex items-center gap-2"
							>
								<Download className="w-4 h-4" />
								{downloading ? "Baixando..." : "Baixar Contrato"}
							</Button>

							<div className="flex gap-3">
								<Button variant="outline" onClick={onClose}>
									Fechar
								</Button>
								{proposal.status?.nome === "Aceita" && (
									<Button
										className="bg-green-600 hover:bg-green-700"
										onClick={() => {
											if (identificadorUnico) {
												// eslint-disable-next-line @typescript-eslint/no-floating-promises
												navigate({
													to: `/band/contract/${identificadorUnico}`,
												});
												onClose();
											}
										}}
									>
										Ver e Assinar Contrato
									</Button>
								)}
							</div>
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-8 text-gray-500">
						<FileText className="w-12 h-12 mb-4" />
						<p>Contrato não encontrado</p>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};
