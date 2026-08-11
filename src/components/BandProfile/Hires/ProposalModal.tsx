import { useState } from "react";
import { X, Download, Eye, Calendar, DollarSign, Clock } from "lucide-react";
import { Button } from "../../ui/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../../ui/dialog";

interface ProposalModalProps {
	isOpen: boolean;
	onClose: () => void;
	proposal: {
		id: string;
		content: string;
		status: string;
		createdAt: string;
		services: Array<{
			name: string;
			description: string;
			value: number;
		}>;
	} | null;
	loading?: boolean;
	onAccept?: (proposalId: string) => void;
	onReject?: (proposalId: string) => void;
}

export const ProposalModal = ({
	isOpen,
	onClose,
	proposal,
	loading,
	onAccept,
	onReject,
}: ProposalModalProps) => {
	const [downloading, setDownloading] = useState(false);

	const handleDownload = () => {
		if (!proposal) return;

		setDownloading(true);
		try {
			const content = `
PROPOSTA #${proposal.id}

Data de Criação: ${new Date(proposal.createdAt).toLocaleDateString("pt-BR")}

SERVIÇOS PROPOSTOS:
${proposal.services
	.map(
		(service) =>
			`- ${service.name}: ${service.description} - R$ ${service.value.toFixed(2)}`
	)
	.join("\n")}

DESCRIÇÃO DETALHADA:
${proposal.content}

Valor Total: R$ ${proposal.services.reduce((total, service) => total + service.value, 0).toFixed(2)}
			`;

			const blob = new Blob([content], { type: "text/plain" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `proposta-${proposal.id}.txt`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Erro ao baixar proposta:", error);
		} finally {
			setDownloading(false);
		}
	};

	const totalValue =
		proposal?.services.reduce((total, service) => total + service.value, 0) ||
		0;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Eye className="w-6 h-6 text-primary-600" />
							<DialogTitle className="text-xl font-semibold">
								Proposta #{proposal?.id}
							</DialogTitle>
						</div>
						<Button
							variant="transparent"
							size="sm"
							onClick={onClose}
							className="p-2"
						>
							<X className="w-4 h-4" />
						</Button>
					</div>
				</DialogHeader>

				{loading ? (
					<div className="flex items-center justify-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
					</div>
				) : proposal ? (
					<div className="space-y-6">
						{/* Informações da proposta */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
							<div className="flex items-center gap-2">
								<Calendar className="w-4 h-4 text-gray-500" />
								<div>
									<p className="text-sm text-gray-500">Criada em</p>
									<p className="font-medium">
										{new Date(proposal.createdAt).toLocaleDateString("pt-BR")}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<DollarSign className="w-4 h-4 text-green-500" />
								<div>
									<p className="text-sm text-gray-500">Valor Total</p>
									<p className="font-medium text-green-600">
										R$ {totalValue.toFixed(2)}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<Clock className="w-4 h-4 text-gray-500" />
								<div>
									<p className="text-sm text-gray-500">Status</p>
									<p className="font-medium capitalize">{proposal.status}</p>
								</div>
							</div>
						</div>

						{/* Serviços */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Serviços Propostos</h3>
							<div className="space-y-3">
								{proposal.services.map((service, index) => (
									<div key={index} className="border rounded-lg p-4 bg-white">
										<div className="flex justify-between items-start">
											<div className="flex-1">
												<h4 className="font-medium text-gray-900">
													{service.name}
												</h4>
												<p className="text-sm text-gray-600 mt-1">
													{service.description}
												</p>
											</div>
											<div className="text-right ml-4">
												<p className="font-semibold text-green-600">
													R$ {service.value.toFixed(2)}
												</p>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Descrição detalhada */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Descrição Detalhada</h3>
							<div className="border rounded-lg p-6 bg-white max-h-48 overflow-y-auto">
								<p className="text-sm text-gray-700 whitespace-pre-wrap">
									{proposal.content}
								</p>
							</div>
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
								{downloading ? "Baixando..." : "Baixar Proposta"}
							</Button>

							<div className="flex gap-3">
								<Button variant="outline" onClick={onClose}>
									Fechar
								</Button>
								{proposal.status === "recebida" && (
									<>
										<Button
											variant="outline"
											className="text-red-600 border-red-600 hover:bg-red-50"
											onClick={() => onReject?.(proposal.id)}
										>
											Recusar
										</Button>
										<Button
											className="bg-green-600 hover:bg-green-700"
											onClick={() => onAccept?.(proposal.id)}
										>
											Aceitar Proposta
										</Button>
									</>
								)}
							</div>
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-8 text-gray-500">
						<Eye className="w-12 h-12 mb-4" />
						<p>Proposta não encontrada</p>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};
