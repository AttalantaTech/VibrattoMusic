import {
	Calendar,
	CheckCircle,
	Clock,
	Clock3,
	DollarSign,
	FileText,
	MapPin,
	PenLine,
	User,
	XCircle,
} from "lucide-react";
import type { ProposalResponse } from "../../../../../api/types";
import { Badge } from "../../../../ui/Badge/Badge";
import { formatCurrency, formatDate } from "../../../../../utils/validation";
import { Button } from "../../../../ui/Button/Button";
import { unifiedStatusConfig } from "../../types/SalesTypes";

interface ProposalDetailsModalProps {
	proposal: ProposalResponse;
	isOpen: boolean;
	onClose: () => void;
	onStatusUpdate: (
		proposalId: number,
		status: "aceito" | "rejeitado" | "cancelado"
	) => void;
	currentUserId?: number;
	onSignContract: (proposalId: string) => void;
	onAccept: (proposalId: number) => void;
	onReject: (proposal: ProposalResponse) => void;
}

export const ProposalDetailsModal = ({
	proposal,
	isOpen,
	onClose,
	onStatusUpdate,
	currentUserId,
	onSignContract,
	onAccept,
	onReject,
}: ProposalDetailsModalProps) => {
	if (!proposal) {
		onClose();
		return null;
	}
	const isContractor = currentUserId === proposal.contratante.id;
	const statusKey = (
		typeof proposal.status === "object" ? proposal.status.nome : proposal.status
	)?.toLowerCase() as keyof typeof unifiedStatusConfig;

	const isWaitingForResponse = statusKey === "pendente";
	const isAcceptedStatus = statusKey === "aceita";

	const showSignaturePending =
		isAcceptedStatus &&
		((isContractor && !proposal.assinaturaContratante) ||
			(!isContractor && !proposal.assinaturaContratado));

	const needsContractorSignature =
		isContractor && isAcceptedStatus && !proposal.assinaturaContratante;

	const needsContractedSignature =
		!isContractor && isAcceptedStatus && !proposal.assinaturaContratado;

	const status = unifiedStatusConfig[statusKey] || unifiedStatusConfig.pendente;
	const StatusIcon = status.icon;

	const formatTime = (timeString: string) => {
		try {
			const [hours, minutes] = timeString.split(":");
			return `${hours}:${minutes}`;
		} catch {
			return timeString;
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				<div className="p-6">
					{/* Header */}
					<div className="flex justify-between items-start mb-6">
						<div>
							<h2 className="text-2xl font-bold text-gray-900">
								Detalhes da Proposta
							</h2>
							<p className="text-sm text-gray-600 mt-1">ID: #{proposal.id}</p>
						</div>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-gray-600"
						>
							<XCircle className="h-6 w-6" />
						</button>
					</div>

					{/* Status Badge */}
					<div className="mb-6">
						<Badge
							variant={
								isWaitingForResponse
									? "warning"
									: showSignaturePending
										? "secondary"
										: status.variant
							}
							className="inline-flex items-center gap-1"
						>
							{isWaitingForResponse ? (
								<>
									<Clock3 className="h-4 w-4" />
									Aguardando Resposta
								</>
							) : showSignaturePending ? (
								<>
									<PenLine className="h-4 w-4" />
									Assinatura Pendente
								</>
							) : (
								<>
									{StatusIcon && <StatusIcon className="h-4 w-4" />}
									{status.label}
								</>
							)}
						</Badge>
					</div>

					{/* Details */}
					<div className="space-y-6">
						{/* Event Information */}
						<div>
							<h3 className="text-lg font-semibold text-gray-900 mb-3">
								Informações do Evento
							</h3>
							<div className="space-y-3">
								<div className="flex items-start gap-3">
									<FileText className="h-5 w-5 text-gray-400 mt-0.5" />
									<div>
										<p className="text-sm font-medium text-gray-700">
											Tipo de Evento
										</p>
										<p className="text-gray-900">
											{proposal.nomeTipoEvento || `${proposal.tipoEvento.nome}`}
										</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<User className="h-5 w-5 text-gray-400 mt-0.5" />
									<div>
										<p className="text-sm font-medium text-gray-700">Cliente</p>
										<p className="text-gray-900">{proposal.contratante.nome}</p>
									</div>
								</div>
							</div>
						</div>

						{/* Description */}
						<div>
							<h3 className="text-lg font-semibold text-gray-900 mb-3">
								Descrição
							</h3>
							<p className="text-gray-700 whitespace-pre-wrap">
								{proposal.descricao}
							</p>
						</div>

						{/* Event Details */}
						<div>
							<h3 className="text-lg font-semibold text-gray-900 mb-3">
								Detalhes do Evento
							</h3>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="flex items-start gap-3">
									<DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
									<div>
										<p className="text-sm font-medium text-gray-700">Valor</p>
										<p className="text-gray-900 font-semibold">
											{formatCurrency(proposal.valor)}
										</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
									<div>
										<p className="text-sm font-medium text-gray-700">Data</p>
										<p className="text-gray-900">
											{proposal.dataInicio === proposal.dataFim
												? formatDate(proposal.dataInicio)
												: `${formatDate(proposal.dataInicio)} até ${formatDate(proposal.dataFim)}`}
										</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<Clock className="h-5 w-5 text-gray-400 mt-0.5" />
									<div>
										<p className="text-sm font-medium text-gray-700">Horário</p>
										<p className="text-gray-900">
											{formatTime(proposal.horaInicio)} -{" "}
											{formatTime(proposal.horaFim)}
										</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
									<div>
										<p className="text-sm font-medium text-gray-700">Local</p>
										<p className="text-gray-900">{proposal.local}</p>
									</div>
								</div>
							</div>
						</div>

						{/* Creation Date */}
						<div className="text-sm text-gray-500 border-t pt-4">
							Proposta criada em {formatDate(proposal.dataCriacao)}
						</div>
					</div>

					{/* Actions */}
					<div className="mt-6 flex justify-end gap-3">
						{/* Band actions when proposal is pending */}
						{isWaitingForResponse && !isContractor && (
							<Button
								className="bg-green-600 hover:bg-green-700"
								onClick={() => {
									onAccept(proposal.id);
									onClose();
								}}
							>
								<CheckCircle className="h-4 w-4 mr-2" />
								Aceitar
							</Button>
						)}

						{/* Contractor signature button */}
						{needsContractorSignature && (
							<Button
								className="bg-blue-600 hover:bg-blue-700"
								onClick={() => {
									onSignContract(proposal.identificadorUnico);
									onClose();
								}}
							>
								<PenLine className="h-4 w-4 mr-2" />
								Ver e Assinar Contrato
							</Button>
						)}

						{/* Band (contracted) signature button */}
						{needsContractedSignature && (
							<Button
								className="bg-blue-600 hover:bg-blue-700"
								onClick={() => {
									onSignContract(proposal.identificadorUnico);
									onClose();
								}}
							>
								<PenLine className="h-4 w-4 mr-2" />
								Ver e Assinar Contrato
							</Button>
						)}

						{/* Cancel/Reject button - available for both contractor and band */}
						{(statusKey === "pendente" || isAcceptedStatus) && (
							<Button
								variant="outline"
								className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
								onClick={() => {
									if (isContractor) {
										onStatusUpdate(proposal.id, "rejeitado");
									} else {
										onReject(proposal);
									}
									onClose();
								}}
							>
								<XCircle className="h-4 w-4 mr-2" />
								{isContractor ? "Cancelar Proposta" : "Rejeitar Proposta"}
							</Button>
						)}

						<Button variant="outline" onClick={onClose}>
							Fechar
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
