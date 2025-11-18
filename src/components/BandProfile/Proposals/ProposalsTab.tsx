import { useState, useMemo } from "react";
import { formatCurrency, formatDate } from "../../../utils/validation";
import {
	FileText,
	Calendar,
	Clock,
	MapPin,
	DollarSign,
	CheckCircle,
	XCircle,
	Clock3,
	Plus,
	Filter,
	ArrowUpDown,
	Search,
	ChevronDown,
	CreditCard,
	X,
} from "lucide-react";
import {
	useMyProposals,
	useUpdateProposalStatus,
} from "../../../hooks/useProposals";
import { useAuthStore } from "../../../store/authStore";
import { Button } from "../../ui/Button/Button";
import { SendProposalModal } from "../Messages/SendProposalModal";
import { Badge } from "../../ui/Badge/Badge";
import type { ProposalResponse } from "../../../api/types";
import { Input } from "../../ui/Input/Input";
import { Dropdown } from "../../ui/Dropdown/Dropdown";
import { cn } from "../../../lib/utils/cn";

const statusConfig = {
	pendente: {
		label: "Pendente",
		icon: Clock3,
		variant: "warning" as const,
		color: "text-yellow-600",
		bgColor: "bg-yellow-50",
	},
	aceito: {
		label: "Aceito",
		icon: CheckCircle,
		variant: "success" as const,
		color: "text-green-600",
		bgColor: "bg-green-50",
	},
	sinalPago: {
		label: "Sinal Pago",
		icon: CreditCard,
		variant: "success" as const,
		color: "text-blue-600",
		bgColor: "bg-blue-50",
	},
	rejeitado: {
		label: "Rejeitado",
		icon: XCircle,
		variant: "error" as const,
		color: "text-red-600",
		bgColor: "bg-red-50",
	},
	cancelado: {
		label: "Cancelado",
		icon: XCircle,
		variant: "secondary" as const,
		color: "text-gray-600",
		bgColor: "bg-gray-50",
	},
};

interface ProposalDetailsModalProps {
	proposal: ProposalResponse;
	isOpen: boolean;
	onClose: () => void;
	onStatusUpdate: (
		proposalId: number,
		status: "aceito" | "rejeitado" | "cancelado" | "sinalPago"
	) => void;
	isProposalCreator: (proposal: ProposalResponse) => boolean;
}

const ProposalDetailsModal = ({
	proposal,
	isOpen,
	onClose,
	onStatusUpdate,
	isProposalCreator,
}: ProposalDetailsModalProps) => {
	const status =
		statusConfig[proposal.status.nome as keyof typeof statusConfig] ||
		statusConfig.pendente;
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
							variant={status.variant}
							className="inline-flex items-center gap-1"
						>
							<StatusIcon className="h-4 w-4" />
							{status.label}
						</Badge>
					</div>

					{/* Details */}
					<div className="space-y-6">
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
						{/* Botão de cancelar para o criador da proposta - sempre disponível */}
						{isProposalCreator(proposal) && proposal.status.nome !== "cancelado" && proposal.status.nome !== "rejeitado" && (
							<Button
								variant="outline"
								className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
								onClick={() => {
									onStatusUpdate(proposal.id, "cancelado");
									onClose();
								}}
							>
								<X className="h-4 w-4 mr-2" />
								Cancelar Minha Proposta
							</Button>
						)}
						{proposal.status.nome === "pendente" && (
							<>
								<Button
									variant="outline"
									className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
									onClick={() => {
										onStatusUpdate(proposal.id, "cancelado");
										onClose();
									}}
								>
									<X className="h-4 w-4 mr-2" />
									Cancelar Proposta
								</Button>
								<Button
									variant="outline"
									className="text-red-600 hover:text-red-700 hover:bg-red-50"
									onClick={() => {
										onStatusUpdate(proposal.id, "rejeitado");
										onClose();
									}}
								>
									Rejeitar Proposta
								</Button>
								<Button
									className="bg-green-600 hover:bg-green-700"
									onClick={() => {
										onStatusUpdate(proposal.id, "aceito");
										onClose();
									}}
								>
									Aceitar Proposta
								</Button>
							</>
						)}
						{proposal.status.nome === "aceito" && (
							<div className="flex gap-3">
								<Button
									variant="outline"
									className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300"
									onClick={() => {
										onStatusUpdate(proposal.id, "sinalPago");
										onClose();
									}}
								>
									<CreditCard className="h-4 w-4 mr-2" />
									Marcar Sinal Pago
								</Button>
								<Button
									variant="outline"
									className="text-gray-600"
									onClick={() => {
										onStatusUpdate(proposal.id, "cancelado");
										onClose();
									}}
								>
									Cancelar Proposta
								</Button>
							</div>
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

type SortField = "date" | "value" | "status" | "eventType";
type SortOrder = "asc" | "desc";
type StatusFilter =
	| "all"
	| "pendente"
	| "aceito"
	| "sinalPago"
	| "rejeitado"
	| "cancelado";

interface ProposalsTabProps {
	productId?: number;
}

export const ProposalsTab = ({ productId }: ProposalsTabProps) => {
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [selectedProposal, setSelectedProposal] =
		useState<ProposalResponse | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [sortField, setSortField] = useState<SortField>("date");
	const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

	const { data: proposals, isLoading, error } = useMyProposals();

	const updateStatusMutation = useUpdateProposalStatus();
	const { user } = useAuthStore();

	const handleStatusUpdate = async (
		proposalId: number,
		status: "aceito" | "rejeitado" | "cancelado" | "sinalPago"
	) => {
		try {
			await updateStatusMutation.mutateAsync({ proposalId, status });
		} catch (error) {
			console.error("Error updating proposal status:", error);
		}
	};

	const isProposalCreator = (proposal: ProposalResponse) => {
		return user?.id === proposal.idContratante;
	};

	const formatTime = (timeString: string) => {
		try {
			const [hours, minutes] = timeString.split(":");
			return `${hours}:${minutes}`;
		} catch {
			return timeString;
		}
	};

	const filteredAndSortedProposals = useMemo(() => {
		let filtered = [...(proposals || [])];

		if (statusFilter !== "all") {
			filtered = filtered.filter(
				(proposal) => proposal.status.nome === statusFilter
			);
		}

		if (searchTerm) {
			const searchLower = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(proposal) =>
					proposal.descricao?.toLowerCase().includes(searchLower) ||
					proposal.local?.toLowerCase().includes(searchLower) ||
					proposal.nomeTipoEvento?.toLowerCase().includes(searchLower) ||
					proposal.nomeContratante?.toLowerCase().includes(searchLower)
			);
		}

		filtered.sort((a, b) => {
			let comparison = 0;

			switch (sortField) {
				case "date":
					comparison =
						new Date(a.dataCriacao).getTime() -
						new Date(b.dataCriacao).getTime();
					break;
				case "value":
					comparison = a.valor - b.valor;
					break;
				case "status":
					comparison = (a.status?.nome || "").localeCompare(b.status?.nome || "");
					break;
				case "eventType":
					comparison = (a.nomeTipoEvento || "").localeCompare(
						b.nomeTipoEvento || ""
					);
					break;
			}

			return sortOrder === "asc" ? comparison : -comparison;
		});

		return filtered;
	}, [proposals, statusFilter, searchTerm, sortField, sortOrder]);

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortOrder((previous) => (previous === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortOrder("desc");
		}
	};


	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-gray-200 rounded w-48"></div>
					<div className="h-24 bg-gray-200 rounded w-full"></div>
					<div className="h-24 bg-gray-200 rounded w-full"></div>
				</div>
			</div>
		);
	}

	if (error) {
		console.error("Error loading proposals:", error);

		const isApiError = error && typeof error === "object" && "message" in error;
		const errorMessage = isApiError
			? (error as { message: string }).message
			: "Erro desconhecido";

		return (
			<div className="flex flex-col items-center justify-center min-h-[400px] text-center">
				<XCircle className="h-12 w-12 text-red-500 mb-4" />
				<h3 className="text-lg font-semibold text-gray-900 mb-2">
					Erro ao Carregar Propostas
				</h3>
				<p className="text-gray-600 max-w-md mb-4">
					{errorMessage.includes("Network") || errorMessage.includes("fetch")
						? "Verifique sua conexão com a internet e tente novamente."
						: "Não foi possível carregar suas propostas. Tente recarregar a página."}
				</p>
				<Button
					onClick={() => {
						window.location.reload();
					}}
					variant="outline"
					className="flex items-center gap-2"
				>
					<ArrowUpDown className="h-4 w-4" />
					Recarregar Página
				</Button>
			</div>
		);
	}

	return (
		<div className="w-full max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">Minhas Propostas</h2>
					<p className="text-gray-600 mt-1">
						Gerencie as propostas que você enviou
					</p>
				</div>
				<Button
					onClick={() => {
						setIsCreateModalOpen(true);
					}}
					className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
				>
					<Plus className="h-4 w-4" />
					Nova Proposta
				</Button>
			</div>

			{/* Filters and Search */}
			<div className="flex flex-col lg:flex-row gap-4 mb-6">
				{/* Search */}
				<div className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							type="text"
							placeholder="Buscar propostas..."
							value={searchTerm}
							onChange={(event) => {
								setSearchTerm(event.target.value);
							}}
							className="pl-10"
						/>
					</div>
				</div>

				{/* Status Filter */}
				<Dropdown
					align="right"
					trigger={
						<Button variant="outline" className="min-w-[180px] justify-between">
							<span className="flex items-center gap-2">
								<Filter className="h-4 w-4" />
								Status:{" "}
								{statusFilter === "all"
									? "Todos"
									: statusConfig[statusFilter]?.label}
							</span>
							<ChevronDown className="h-4 w-4 ml-2" />
						</Button>
					}
				>
					<div className="p-2">
						<p className="px-2 py-1.5 text-sm font-semibold text-gray-700">
							Filtrar por Status
						</p>
						<div className="h-px bg-gray-200 my-1" />
						{[
							"all",
							"pendente",
							"aceito",
							"sinalPago",
							"rejeitado",
							"cancelado",
						].map((status) => (
							<button
								key={status}
								onClick={() => {
									setStatusFilter(status as StatusFilter);
								}}
								className={cn(
									"w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100",
									statusFilter === status && "bg-gray-100 font-medium"
								)}
							>
								<span className="flex items-center gap-2">
									{status === "all" ? (
										"Todos"
									) : (
										<>
											{statusConfig[status as keyof typeof statusConfig] && (
												<span
													className={cn(
														"inline-block w-2 h-2 rounded-full",
														status === "pendente" && "bg-yellow-500",
														status === "aceito" && "bg-green-500",
														status === "sinalPago" && "bg-blue-500",
														status === "rejeitado" && "bg-red-500",
														status === "cancelado" && "bg-gray-500"
													)}
												/>
											)}
											{statusConfig[status as keyof typeof statusConfig]?.label}
										</>
									)}
								</span>
							</button>
						))}
					</div>
				</Dropdown>

				{/* Sort Dropdown */}
				<Dropdown
					align="right"
					trigger={
						<Button variant="outline" className="min-w-[180px] justify-between">
							<span className="flex items-center gap-2">
								<ArrowUpDown className="h-4 w-4" />
								Ordenar
							</span>
							<ChevronDown className="h-4 w-4 ml-2" />
						</Button>
					}
				>
					<div className="p-2">
						<p className="px-2 py-1.5 text-sm font-semibold text-gray-700">
							Ordenar por
						</p>
						<div className="h-px bg-gray-200 my-1" />
						{[
							{ field: "date" as SortField, label: "Data" },
							{ field: "value" as SortField, label: "Valor" },
							{ field: "status" as SortField, label: "Status" },
							{ field: "eventType" as SortField, label: "Tipo de Evento" },
						].map(({ field, label }) => (
							<button
								key={field}
								onClick={() => {
									handleSort(field);
								}}
								className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center justify-between"
							>
								<span>{label}</span>
								{sortField === field && (
									<span className="text-gray-500">
										{sortOrder === "desc" ? "↓" : "↑"}
									</span>
								)}
							</button>
						))}
					</div>
				</Dropdown>
			</div>

			{/* Results count */}
			{(searchTerm || statusFilter !== "all") &&
				proposals &&
				proposals.length > 0 && (
					<div className="text-sm text-gray-600 mb-4">
						Mostrando {filteredAndSortedProposals.length} de {proposals.length}{" "}
						propostas
					</div>
				)}

			{/* Proposals List */}
			{filteredAndSortedProposals.length === 0 ? (
				<div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
					<FileText className="h-12 w-12 text-gray-400 mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						{searchTerm || statusFilter !== "all"
							? "Nenhuma proposta encontrada com os filtros aplicados"
							: "Nenhuma proposta enviada"}
					</h3>
					<p className="text-gray-600 text-center max-w-md mb-4">
						{searchTerm || statusFilter !== "all"
							? "Tente ajustar os filtros ou realizar uma nova busca."
							: "Você ainda não enviou nenhuma proposta. Use a aba 'Mensagens' para enviar propostas para artistas."}
					</p>
					{!(searchTerm || statusFilter !== "all") && (
						<Button
							onClick={() => {
								setIsCreateModalOpen(true);
							}}
							className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
						>
							<Plus className="h-4 w-4" />
							Criar Primeira Proposta
						</Button>
					)}
				</div>
			) : (
				<div className="space-y-4">
					{filteredAndSortedProposals.map((proposal) => {
						const status =
							statusConfig[proposal.status.nome as keyof typeof statusConfig] ||
							statusConfig.pendente;
						const StatusIcon = status.icon;

						return (
							<div
								key={proposal.id}
								className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
								onClick={() => {
									setSelectedProposal(proposal);
								}}
							>
								<div className="flex flex-col lg:flex-row justify-between gap-4">
									{/* Main Content */}
									<div className="flex-1 space-y-3">
										{/* Header with Event Type and Status */}
										<div className="flex items-start justify-between gap-4">
											<Badge
												variant={status.variant}
												className="flex items-center gap-1"
											>
												<StatusIcon className="h-3 w-3" />
												{status.label}
											</Badge>
										</div>

										{/* Description */}
										<p className="text-gray-700 line-clamp-2">
											{proposal.descricao}
										</p>

										{/* Details Grid */}
										<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
											{/* Value */}
											<div className="flex items-center gap-2 text-gray-600">
												<DollarSign className="h-4 w-4 text-gray-400" />
												<span className="font-medium">
													{formatCurrency(proposal.valor)}
												</span>
											</div>

											{/* Date */}
											<div className="flex items-center gap-2 text-gray-600">
												<Calendar className="h-4 w-4 text-gray-400" />
												<span>{formatDate(proposal.dataInicio)}</span>
											</div>

											{/* Time */}
											<div className="flex items-center gap-2 text-gray-600">
												<Clock className="h-4 w-4 text-gray-400" />
												<span>
													{formatTime(proposal.horaInicio)} -{" "}
													{formatTime(proposal.horaFim)}
												</span>
											</div>

											{/* Location */}
											<div className="flex items-center gap-2 text-gray-600 lg:col-span-1">
												<MapPin className="h-4 w-4 text-gray-400" />
												<span className="truncate">{proposal.local}</span>
											</div>
										</div>

										{/* Creation Date and ID */}
										<div className="flex items-center gap-4 text-xs text-gray-500">
											<span className="font-medium">ID: #{proposal.id}</span>
											<span>Criada em {formatDate(proposal.dataCriacao)}</span>
										</div>
									</div>

									{/* Actions */}
									{proposal.status.nome === "pendente" && (
										<div className="flex flex-row lg:flex-col gap-2 lg:justify-center">
											<Button
												size="sm"
												variant="outline"
												className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300"
												onClick={(event) => {
													event.stopPropagation();
													void handleStatusUpdate(proposal.id, "aceito");
												}}
											>
												<CheckCircle className="h-4 w-4 mr-1" />
												Aceitar
											</Button>
											<Button
												size="sm"
												variant="outline"
												className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
												onClick={(event) => {
													event.stopPropagation();
													void handleStatusUpdate(proposal.id, "rejeitado");
												}}
											>
												<XCircle className="h-4 w-4 mr-1" />
												Rejeitar
											</Button>
											<Button
												size="sm"
												variant="outline"
												className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 border-gray-300"
												onClick={(event) => {
													event.stopPropagation();
													void handleStatusUpdate(proposal.id, "cancelado");
												}}
											>
												<X className="h-4 w-4 mr-1" />
												Cancelar
											</Button>
										</div>
									)}
									{proposal.status.nome === "aceito" && (
										<div className="flex flex-col gap-2 lg:justify-center">
											<Button
												size="sm"
												variant="outline"
												className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300"
												onClick={(event) => {
													event.stopPropagation();
													void handleStatusUpdate(proposal.id, "sinalPago");
												}}
											>
												<CreditCard className="h-4 w-4 mr-1" />
												Marcar Sinal Pago
											</Button>
											<Button
												size="sm"
												variant="outline"
												className="text-gray-600"
												onClick={(event) => {
													event.stopPropagation();
													void handleStatusUpdate(proposal.id, "cancelado");
												}}
											>
												Cancelar Proposta
											</Button>
										</div>
									)}
									{/* Botão de cancelar para o criador da proposta - sempre visível */}
									{isProposalCreator(proposal) && proposal.status.nome !== "cancelado" && proposal.status.nome !== "rejeitado" && (
										<div className="flex lg:justify-center">
											<Button
												size="sm"
												variant="outline"
												className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 border-gray-300"
												onClick={(event) => {
													event.stopPropagation();
													void handleStatusUpdate(proposal.id, "cancelado");
												}}
											>
												<X className="h-4 w-4 mr-1" />
												Cancelar Minha Proposta
											</Button>
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Create Proposal Modal */}
			<SendProposalModal
				isOpen={isCreateModalOpen}
				onClose={() => {
					setIsCreateModalOpen(false);
				}}
				recipientId={productId || undefined}
			/>

			{/* Proposal Details Modal */}
			{selectedProposal && (
				<ProposalDetailsModal
					proposal={selectedProposal}
					isOpen={!!selectedProposal}
					onClose={() => {
						setSelectedProposal(null);
					}}
					onStatusUpdate={handleStatusUpdate}
					isProposalCreator={isProposalCreator}
				/>
			)}
		</div>
	);
};
