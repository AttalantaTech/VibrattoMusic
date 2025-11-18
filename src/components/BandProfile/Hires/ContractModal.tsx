import { useState } from "react";
import { X, Download, FileText, Calendar, User } from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";

interface ContractModalProps {
	isOpen: boolean;
	onClose: () => void;
	contract: {
		id: string;
		content: string;
		status: string;
		createdAt: string;
		signedAt?: string;
	} | null;
	loading?: boolean;
}

export const ContractModal = ({ isOpen, onClose, contract, loading }: ContractModalProps) => {
	const [downloading, setDownloading] = useState(false);

	const handleDownload = async () => {
		if (!contract) return;

		setDownloading(true);
		try {
			// Simular download do contrato
			const blob = new Blob([contract.content], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `contrato-${contract.id}.txt`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Erro ao baixar contrato:', error);
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
							<FileText className="w-6 h-6 text-blue-600" />
							<DialogTitle className="text-xl font-semibold">
								Contrato #{contract?.id}
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
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					</div>
				) : contract ? (
					<div className="space-y-6">
						{/* Informações do contrato */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
							<div className="flex items-center gap-2">
								<Calendar className="w-4 h-4 text-gray-500" />
								<div>
									<p className="text-sm text-gray-500">Criado em</p>
									<p className="font-medium">
										{new Date(contract.createdAt).toLocaleDateString('pt-BR')}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<User className="w-4 h-4 text-gray-500" />
								<div>
									<p className="text-sm text-gray-500">Status</p>
									<p className="font-medium capitalize">{contract.status}</p>
								</div>
							</div>

							{contract.signedAt && (
								<div className="flex items-center gap-2">
									<FileText className="w-4 h-4 text-green-500" />
									<div>
										<p className="text-sm text-gray-500">Assinado em</p>
										<p className="font-medium">
											{new Date(contract.signedAt).toLocaleDateString('pt-BR')}
										</p>
									</div>
								</div>
							)}
						</div>

						{/* Conteúdo do contrato */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Conteúdo do Contrato</h3>
							<div className="border rounded-lg p-6 bg-white max-h-96 overflow-y-auto">
								<pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
									{contract.content}
								</pre>
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
								{downloading ? 'Baixando...' : 'Baixar Contrato'}
							</Button>

							<div className="flex gap-3">
								<Button variant="outline" onClick={onClose}>
									Fechar
								</Button>
								{contract.status === 'pendente' && (
									<Button className="bg-green-600 hover:bg-green-700">
										Assinar Contrato
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
