import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
	FileText,
	Download,
	PenLine,
	CheckCircle,
	AlertCircle,
	ArrowLeft,
	Loader2,
} from "lucide-react";
import { Button } from "../../components/ui/Button/Button";
import { Badge } from "../../components/ui/Badge/Badge";
import { useContract } from "../../hooks/useContracts";
import { toast } from "sonner";

interface ContractSignaturePageProps {
	identificadorUnico: string;
}

const getStatusColor = (status: string) => {
	switch (status) {
		case "Pendente":
			return "bg-yellow-100 text-yellow-800";
		case "Aceita":
			return "bg-blue-100 text-blue-800";
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

export const ContractSignaturePage = ({
	identificadorUnico,
}: ContractSignaturePageProps) => {
	const navigate = useNavigate();
	const [downloading, setDownloading] = useState(false);
	const [signing, setSigning] = useState(false);

	const {
		data: contract,
		isLoading,
		error,
	} = useContract(identificadorUnico || "");

	const handleDownload = () => {
		if (!contract) return;

		setDownloading(true);
		try {
			// Create contract text representation
			const contractText = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS ARTÍSTICOS

Contrato ID: ${contract.id}
Proposta ID: ${contract.idProposta}
Título: ${contract.titulo}
Status: ${getStatusLabel(contract.status?.nome || "")}
Valor Total: R$ ${contract.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
Data de Criação: ${new Date(contract.dataCriacao).toLocaleDateString("pt-BR")}

${contract.secoes?.map((section) => `${section.numero}. ${section.titulo}\n\n${section.texto}\n\n`).join("") || "Nenhuma seção disponível."}
			`;

			const blob = new Blob([contractText], {
				type: "text/plain;charset=utf-8",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `contrato-${contract.id}.txt`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			toast.success("Contrato baixado com sucesso!");
		} catch (error) {
			console.error("Erro ao baixar contrato:", error);
			toast.error("Erro ao baixar contrato");
		} finally {
			setDownloading(false);
		}
	};

	const handleSign = async () => {
		if (!contract) return;

		setSigning(true);
		try {
			// // Check if there's a D4Sign URL
			// if (contract.urlAssinaturaD4Sign) {
			// 	// Open D4Sign signature page in new tab
			// 	window.open(contract.urlAssinaturaD4Sign, "_blank");
			// 	toast.success("Abrindo página de assinatura...");
			// } else {
			// 	// TODO: Generate D4Sign signature URL if not available
			// 	toast.error(
			// 		"URL de assinatura não disponível. Aguarde a geração do contrato."
			// 	);
			// }
		} catch (error) {
			console.error("Erro ao iniciar assinatura:", error);
			toast.error("Erro ao iniciar processo de assinatura");
		} finally {
			setSigning(false);
		}
	};

	const handleBack = () => {
		navigate({ to: "/band/me", search: { tab: "sales" } });
	};

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
					<p className="mt-4 text-gray-600">Carregando contrato...</p>
				</div>
			</div>
		);
	}

	if (error || contract?.identificadorUnico === undefined) {
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

	if (!contract) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<FileText className="h-12 w-12 text-gray-400 mx-auto" />
					<h2 className="mt-4 text-xl font-semibold text-gray-900">
						Contrato não encontrado
					</h2>
					<Button onClick={handleBack} className="mt-6">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar
					</Button>
				</div>
			</div>
		);
	}

	const canSign =
		contract.status?.nome === "Aceita" || contract.status?.nome === "Pendente";

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white border-b border-gray-200 shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
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
								<FileText className="h-6 w-6 text-blue-600" />
								<div>
									<h1 className="text-xl font-bold text-gray-900">
										Contrato #{contract.id}
									</h1>
									<p className="text-sm text-gray-600">
										Proposta #{contract.idProposta}
									</p>
								</div>
							</div>
						</div>
						<Badge className={getStatusColor(contract.status?.nome || "")}>
							{getStatusLabel(contract.status?.nome || "")}
						</Badge>
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
								{new Date(contract.dataCriacao).toLocaleDateString("pt-BR")}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-600">Valor Total</p>
							<p className="text-lg font-semibold text-gray-900">
								R${" "}
								{contract.valor.toLocaleString("pt-BR", {
									minimumFractionDigits: 2,
								})}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-600">Título</p>
							<p className="text-lg font-semibold text-gray-900">
								{contract.titulo}
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
						{contract.secoes && contract.secoes.length > 0 ? (
							<div className="space-y-6 max-h-[60vh] overflow-y-auto">
								{contract.secoes.map((section) => (
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

						{canSign ? (
							<Button
								onClick={handleSign}
								disabled={signing}
								className="w-full sm:w-auto bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
							>
								{signing ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Processando...
									</>
								) : (
									<>
										<PenLine className="h-4 w-4" />
										Assinar via D4Sign
									</>
								)}
							</Button>
						) : (
							<div className="flex items-center gap-2 text-green-600">
								<CheckCircle className="h-5 w-5" />
								<span className="font-medium">Contrato Assinado</span>
							</div>
						)}
					</div>

					{canSign && (
						<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
							<div className="flex gap-3">
								<AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
								<div className="text-sm text-blue-800">
									<p className="font-medium mb-1">Importante:</p>
									<p>
										Ao clicar em "Assinar via D4Sign", você será redirecionado
										para a plataforma de assinatura digital. Certifique-se de
										ler todo o contrato antes de assinar.
									</p>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
