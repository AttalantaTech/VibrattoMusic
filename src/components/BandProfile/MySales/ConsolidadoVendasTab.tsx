import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { formatCurrency, formatDate } from "../../../utils/validation";
import {
	ChartLineIcon,
	Plus,
	Filter,
	ArrowUpDown,
	Calendar,
	Clock,
	MapPin,
	DollarSign,
	User,
	CheckCircle,
	XCircle,
	Clock3,
	FileText,
	Search,
	ChevronDown,
	PenLine,
} from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { Reports } from "./Reports";
import { FilterSelector } from "../../ui/FilterSelector/FilterSelector";
import { LineChartComponent } from "../../charts/line/LineChart";
import { SendProposalModal } from "../Messages/components/SendProposalModal";
import { ProposalRejectionModal } from "../Proposals/ProposalRejectionModal";
import {
	useFilteredProposals,
	useUpdateProposalStatus,
} from "../../../hooks/useProposals";
import { useFormattedChartData } from "../../../hooks/useSales";
import { Badge } from "../../ui/Badge/Badge";
import type { ProposalResponse, ChartPeriod } from "../../../api/types";
import { Input } from "../../ui/Input/Input";
import { Dropdown } from "../../ui/Dropdown/Dropdown";
import { cn } from "../../../lib/utils/cn";
import { TableSkeleton, ErrorState, EmptyState } from "../../ui/LoadingStates";
import { useAuthStore } from "../../../store/authStore";
import { toast } from "sonner";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

const isAcceptedStatus = (statusKey: string) => {
	return statusKey === "aceito" || statusKey === "aceita";
};

const unifiedStatusConfig = {
	pendente: {
		label: "Aguardando Assinatura",
		icon: Clock3,
		variant: "warning" as const,
		color: "text-yellow-600",
		bgColor: "bg-yellow-50",
	},
	// eslint-disable-next-line camelcase
	aguardando_pagamento: {
		label: "Aguardando Pagamento",
		icon: Clock,
		variant: "secondary" as const,
		color: "text-primary-600",
		bgColor: "bg-primary-50",
	},
	aceito: {
		label: "Agendado",
		icon: Calendar,
		variant: "secondary" as const,
		color: "text-primary-600",
		bgColor: "bg-primary-50",
	},
	aceita: {
		label: "Agendado",
		icon: Calendar,
		variant: "secondary" as const,
		color: "text-primary-600",
		bgColor: "bg-primary-50",
	},
	concluido: {
		label: "Concluído",
		icon: CheckCircle,
		variant: "success" as const,
		color: "text-green-600",
		bgColor: "bg-green-50",
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
		status: "aceito" | "rejeitado" | "cancelado"
	) => void;
	currentUserId?: number;
	onSignContract: (proposal: ProposalResponse) => void;
	onAccept: (proposal: ProposalResponse) => void;
	onReject: (proposal: ProposalResponse) => void;
}

const ProposalDetailsModal = ({
	proposal,
	isOpen,
	onClose,
	onStatusUpdate,
	currentUserId,
	onSignContract,
	onAccept,
	onReject,
}: ProposalDetailsModalProps) => {
	const isContractor = currentUserId === proposal.contratante.id;
	const statusKey = (
		typeof proposal.status === "object" ? proposal.status.nome : proposal.status
	)?.toLowerCase() as keyof typeof unifiedStatusConfig;

	const isWaitingForResponse = statusKey === "pendente";

	const showSignaturePending =
		isAcceptedStatus(statusKey) &&
		((isContractor && !proposal.assinaturaContratante) ||
			(!isContractor && !proposal.assinaturaContratado));

	const needsContractorSignature =
		isContractor &&
		isAcceptedStatus(statusKey) &&
		!proposal.assinaturaContratante;

	const needsContractedSignature =
		!isContractor &&
		isAcceptedStatus(statusKey) &&
		!proposal.assinaturaContratado;

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
									<StatusIcon className="h-4 w-4" />
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

								{proposal.horaInicio && proposal.horaFim && (
									<div className="flex items-start gap-3">
										<Clock className="h-5 w-5 text-gray-400 mt-0.5" />
										<div>
											<p className="text-sm font-medium text-gray-700">
												Horário
											</p>
											<p className="text-gray-900">
												{formatTime(proposal.horaInicio)} -{" "}
												{formatTime(proposal.horaFim)}
											</p>
										</div>
									</div>
								)}
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
							<>
								<Button
									variant="outline"
									className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
									onClick={() => {
										onReject(proposal);
										onClose();
									}}
								>
									<XCircle className="h-4 w-4 mr-2" />
									Rejeitar
								</Button>
								<Button
									className="bg-green-600 hover:bg-green-700"
									onClick={() => {
										onAccept(proposal);
										onClose();
									}}
								>
									<CheckCircle className="h-4 w-4 mr-2" />
									Aceitar
								</Button>
							</>
						)}

						{/* Contractor signature button */}
						{needsContractorSignature && (
							<Button
								className="bg-primary-600 hover:bg-blue-700"
								onClick={() => {
									onSignContract(proposal);
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
								className="bg-primary-600 hover:bg-blue-700"
								onClick={() => {
									onSignContract(proposal);
									onClose();
								}}
							>
								<PenLine className="h-4 w-4 mr-2" />
								Ver e Assinar Contrato
							</Button>
						)}

						{/* Cancel/Reject button - available for both contractor and band */}
						{(statusKey === "pendente" || isAcceptedStatus(statusKey)) && (
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

type SortField = "date" | "value" | "status" | "eventType" | "client";
type SortOrder = "asc" | "desc";
type UnifiedStatusFilter =
	| "all"
	| "pendente"
	| "aguardando_pagamento"
	| "aceito"
	| "concluido"
	| "rejeitado"
	| "cancelado";

interface ConsolidadoVendasTabProps {
	productId?: number;
}

export const ConsolidadoVendasTab = ({
	productId,
}: ConsolidadoVendasTabProps) => {
	const navigate = useNavigate();
	const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
	const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
	const [selectedProposal, setSelectedProposal] =
		useState<ProposalResponse | null>(null);
	const [proposalToReject, setProposalToReject] =
		useState<ProposalResponse | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<UnifiedStatusFilter>("all");
	const [sortField, setSortField] = useState<SortField>("date");
	const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
	const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("30d");

	const { activeProduct } = useMusicalProductStore();
	const currentProductId =
		productId || (activeProduct?.id ? Number(activeProduct.id) : undefined);

	const currentUser = useAuthStore((state) => state.user);

	const advancedFilters = useMemo<
		Parameters<typeof useFilteredProposals>[0]
	>(() => {
		const filters: Parameters<typeof useFilteredProposals>[0] = {
			IdProdutoMusical: currentProductId,
		};

		if (statusFilter !== "all") {
			filters.status = [statusFilter as any];
		}

		if (searchTerm && searchTerm.length > 2) {
			filters.searchTerm = searchTerm;
		}

		filters.ordenacao = {
			campo: ((): "data" | "valor" | "status" | "cliente" | "evento" => {
				switch (sortField) {
					case "date":
						return "data";
					case "value":
						return "valor";
					case "status":
						return "status";
					case "eventType":
						return "evento";
					case "client":
						return "cliente";
				}
			})(),
			direcao: sortOrder,
		};

		return filters;
	}, [statusFilter, searchTerm, sortField, sortOrder, currentProductId]);

	const {
		data: filteredProposalsData,
		isLoading,
		error,
	} = useFilteredProposals(advancedFilters);
	const updateStatusMutation = useUpdateProposalStatus();

	const {
		data: chartData,
		isLoading: chartLoading,
		error: chartError,
		hasData: chartHasData,
	} = useFormattedChartData(chartPeriod);

	const handleStatusUpdate = async (
		proposalId: number,
		status: "aceito" | "rejeitado" | "cancelado"
	) => {
		try {
			await updateStatusMutation.mutateAsync({ proposalId, status });
		} catch (error) {
			console.error("Error updating proposal status:", error);
		}
	};

	const handleAcceptProposal = async (proposal: ProposalResponse) => {
		try {
			await updateStatusMutation.mutateAsync({
				proposalId: proposal.id,
				status: "aceito",
			});
		} catch (error) {
			console.error("Error accepting proposal:", error);
			toast.error("Erro ao aceitar a proposta. Tente novamente.");
		}
	};

	const handleRejectProposal = (proposal: ProposalResponse) => {
		setProposalToReject(proposal);
		setIsRejectionModalOpen(true);
	};

	const handleSignContract = (proposal: ProposalResponse) => {
		if (proposal.identificadorUnico) {
			void navigate({
				to: "/band/contract/$id",
				params: { id: proposal.identificadorUnico },
			});
		} else {
			toast.error(
				"Não foi possível acessar o contrato. Identificador da proposta não encontrado."
			);
		}
	};

	const formatTime = (timeString: string) => {
		try {
			const [hours, minutes] = timeString.split(":");
			return `${hours}:${minutes}`;
		} catch {
			return timeString;
		}
	};

	const proposals = (filteredProposalsData?.data || []).sort((a, b) => {
		const dateA = new Date(a.dataCriacao).getTime();
		const dateB = new Date(b.dataCriacao).getTime();
		return dateB - dateA;
	});
	const totalCount = filteredProposalsData?.pagination?.total || 0;

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

	return (
		<div className="w-full h-full flex flex-col gap-6">
			<div className="flex w-full items-center justify-between">
				<h1 className="font-bold text-2xl">Vendas</h1>
				<Button
					onClick={() => {
						setIsProposalModalOpen(true);
					}}
				>
					<Plus className="h-4 w-4 mr-2" />
					Nova Proposta
				</Button>
			</div>
			<hr className="w-full" />

			{/* Filters and Search */}
			<div className="flex flex-col lg:flex-row gap-4">
				{/* Search */}
				<div className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							type="text"
							placeholder="Buscar vendas/propostas..."
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
									: unifiedStatusConfig[statusFilter]?.label}
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
							"aguardando_pagamento",
							"aceito",
							"concluido",
							"rejeitado",
							"cancelado",
						].map((status) => (
							<button
								key={status}
								onClick={() => {
									setStatusFilter(status as UnifiedStatusFilter);
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
											{unifiedStatusConfig[
												status as keyof typeof unifiedStatusConfig
											] && (
												<span
													className={cn(
														"inline-block w-2 h-2 rounded-full",
														status === "pendente" && "bg-yellow-500",
														status === "aguardando_pagamento" &&
															"bg-primary-500",
														status === "aceito" && "bg-primary-500",
														status === "concluido" && "bg-green-500",
														status === "rejeitado" && "bg-red-500",
														status === "cancelado" && "bg-gray-500"
													)}
												/>
											)}
											{
												unifiedStatusConfig[
													status as keyof typeof unifiedStatusConfig
												]?.label
											}
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
							{ field: "client" as SortField, label: "Cliente" },
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
					<div className="text-sm text-gray-600">
						Mostrando {proposals.length} de {totalCount} vendas/propostas
					</div>
				)}

			{/* Loading state */}
			{isLoading && <TableSkeleton />}

			{/* Error state */}
			{error && !isLoading && (
				<ErrorState
					message="Erro ao carregar vendas e propostas"
					onRetry={() => {
						window.location.reload();
					}}
				/>
			)}

			{/* Empty state */}
			{!isLoading && !error && proposals.length === 0 && (
				<EmptyState
					icon={<FileText className="h-12 w-12 text-gray-400" />}
					title={
						searchTerm || statusFilter !== "all"
							? "Nenhuma venda encontrada"
							: "Nenhuma venda encontrada"
					}
					message={
						searchTerm || statusFilter !== "all"
							? "Tente ajustar os filtros ou realizar uma nova busca."
							: "Você ainda não tem vendas. Crie sua primeira proposta para começar."
					}
					action={
						!(searchTerm || statusFilter !== "all") ? (
							<Button
								onClick={() => {
									setIsProposalModalOpen(true);
								}}
								className="flex items-center gap-2 bg-primary-600 hover:bg-blue-700"
							>
								<Plus className="h-4 w-4" />
								Criar Primeira Proposta
							</Button>
						) : undefined
					}
				/>
			)}

			{/* Unified Table */}
			{!isLoading && !error && proposals.length > 0 && (
				<div className="space-y-4">
					{proposals.map((proposal) => {
						const isContractor = currentUser?.id === proposal.contratante.id;
						const statusKey = (
							typeof proposal.status === "object"
								? proposal.status.nome
								: proposal.status
						)?.toLowerCase() as keyof typeof unifiedStatusConfig;

						// User (contractor or band) waiting for response (proposal is pending)
						const isWaitingForResponse = statusKey === "pendente";

						// Show "Assinatura Pendente" when:
						// 1. Proposal is accepted AND user is contractor and hasn't signed
						// 2. Proposal is accepted AND user is NOT contractor (is the band)
						const showSignaturePending =
							isAcceptedStatus(statusKey) &&
							((isContractor && !proposal.assinaturaContratante) ||
								(!isContractor && !proposal.assinaturaContratado));

						// Only show sign button for contractor who hasn't signed
						const needsContractorSignature =
							isContractor &&
							isAcceptedStatus(statusKey) &&
							!proposal.assinaturaContratante;

						// Only show sign button for band (contracted) who hasn't signed
						const needsContractedSignature =
							!isContractor &&
							isAcceptedStatus(statusKey) &&
							!proposal.assinaturaContratado;

						const status =
							unifiedStatusConfig[statusKey] || unifiedStatusConfig.pendente;
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
										{/* Header with Event Type, Client and Status */}
										<div className="flex items-start justify-between gap-4">
											<Badge
												variant={
													isWaitingForResponse
														? "warning"
														: showSignaturePending
															? "secondary"
															: status.variant
												}
												className="flex items-center gap-1"
											>
												{isWaitingForResponse ? (
													<>
														<Clock3 className="h-3 w-3" />
														Aguardando Resposta
													</>
												) : showSignaturePending ? (
													<>
														<PenLine className="h-3 w-3" />
														Assinatura Pendente
													</>
												) : (
													<>
														<StatusIcon className="h-3 w-3" />
														{status.label}
													</>
												)}
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
											{proposal.horaInicio && proposal.horaFim && (
												<div className="flex items-center gap-2 text-gray-600">
													<Clock className="h-4 w-4 text-gray-400" />
													<span>
														{formatTime(proposal.horaInicio)} -{" "}
														{formatTime(proposal.horaFim)}
													</span>
												</div>
											)}

											{/* Location */}
											<div className="flex items-center gap-2 text-gray-600 lg:col-span-1">
												<MapPin className="h-4 w-4 text-gray-400" />
												<span className="truncate">{proposal.local}</span>
											</div>
										</div>

										{/* Creation Date and ID */}
										<div className="flex items-center gap-4 text-xs text-gray-500">
											<span className="font-medium">ID: #{proposal.id}</span>
											<span>Criado em {formatDate(proposal.dataCriacao)}</span>
										</div>
									</div>

									{/* Actions */}
									<div className="flex flex-row lg:flex-col gap-2 lg:justify-center">
										{(needsContractorSignature || needsContractedSignature) && (
											<Button
												size="sm"
												className="bg-primary-600 hover:bg-blue-700"
												onClick={(event) => {
													event.stopPropagation();
													handleSignContract(proposal);
												}}
											>
												<PenLine className="h-4 w-4 mr-1" />
												Assinar
											</Button>
										)}
										{/* Cancel/Reject button - available for both contractor and band */}
										{(statusKey === "pendente" ||
											isAcceptedStatus(statusKey)) && (
											<Button
												size="sm"
												variant="outline"
												className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
												onClick={(event) => {
													event.stopPropagation();
													if (isContractor) {
														// Contractor cancels their own proposal
														void handleStatusUpdate(proposal.id, "rejeitado");
													} else {
														// Band rejects the proposal
														handleRejectProposal(proposal);
													}
												}}
											>
												<XCircle className="h-4 w-4 mr-1" />
												{isContractor ? "Cancelar" : "Rejeitar"}
											</Button>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Reports Section */}
			<hr className="w-full" />
			<h1 className="font-bold text-2xl">Relatórios</h1>
			<hr className="w-full" />

			<Reports />

			{/* Chart Section */}
			<div className="flex flex-col w-full bg-gray-50 border border-gray-200 gap-6 p-6 rounded-lg">
				<div className="w-full flex items-center justify-between">
					<div className="flex gap-3 items-center">
						<div className="bg-white border border-gray-300 rounded-lg p-2 text-gray-600">
							<ChartLineIcon size={14} />
						</div>
						<FilterSelector
							filters={[
								{ id: "7d", label: "7 dias" },
								{ id: "30d", label: "30 dias" },
								{ id: "90d", label: "90 dias" },
								{ id: "1y", label: "1 ano" },
							]}
							selectedFilters={[chartPeriod]}
							onFilterChange={(selectedIds) => {
								const periodId = selectedIds[0];
								if (periodId) {
									const periodMap: Record<string, ChartPeriod> = {
										"7d": "7d",
										"30d": "30d",
										"90d": "90d",
										"1y": "1y",
									};
									setChartPeriod(periodMap[periodId] || "30d");
								}
							}}
						/>
					</div>
					<Button variant="outline" size="sm">
						Atualizar
					</Button>
				</div>

				{/* Chart Loading/Error States */}
				{chartLoading && (
					<div className="h-80 bg-gray-100 rounded animate-pulse flex items-center justify-center">
						<div className="text-gray-500">Carregando gráfico...</div>
					</div>
				)}

				{chartError && (
					<div className="h-80 bg-red-50 rounded border border-red-200 flex items-center justify-center">
						<div className="text-red-600 text-center">
							<div className="font-semibold">Erro ao carregar gráfico</div>
							<div className="text-sm">Dados históricos não disponíveis</div>
						</div>
					</div>
				)}

				{/* Chart Component */}
				{!chartLoading && !chartError && chartData && (
					<LineChartComponent
						dates={chartData.labels}
						values={chartData.values}
						title={chartData.title}
					/>
				)}

				{/* Empty Chart State */}
				{!chartLoading && !chartError && (!chartData || !chartHasData) && (
					<div className="h-80 bg-gray-50 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
						<div className="text-gray-500 text-center">
							<div className="font-semibold">Nenhum dado disponível</div>
							<div className="text-sm">
								Não há vendas no período selecionado
							</div>
						</div>
					</div>
				)}
			</div>

			{/* SendProposalModal */}
			<SendProposalModal
				isOpen={isProposalModalOpen}
				onClose={() => {
					setIsProposalModalOpen(false);
				}}
				recipientId={currentProductId}
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
					currentUserId={currentUser?.id}
					onSignContract={handleSignContract}
					onAccept={handleAcceptProposal}
					onReject={handleRejectProposal}
				/>
			)}

			{/* Proposal Rejection Modal */}
			<ProposalRejectionModal
				isOpen={isRejectionModalOpen}
				onClose={() => {
					setIsRejectionModalOpen(false);
					setProposalToReject(null);
				}}
				proposal={proposalToReject}
			/>
		</div>
	);
};
