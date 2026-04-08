import {
	ChartLineIcon,
	Check,
	ChevronDown,
	FileText,
	Plus,
} from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { FilterSelector } from "../../ui/FilterSelector/FilterSelector";
import { useCallback, useMemo, useState } from "react";
import { UpdateButton } from "../../ui/UpdateButton/UpdateButton";
import { Reports } from "./Reports";
import { EventsTable } from "./components/EventsTable";
import { PaymentStatusCard } from "./components/EventsTable/components/PaymentStatusCard";
import type { EventsTableData } from "./components/EventsTable/types";
import { Dropdown } from "../../ui/Dropdown/Dropdown";
import {
	useFilteredProposals,
	useUpdateProposalStatus,
} from "../../../hooks/useProposals";
import { EmptyState, ErrorState, TableSkeleton } from "../../ui/LoadingStates";
import { LineChartComponent } from "../../charts/line/LineChart";
import { useAuthStore } from "../../../store/authStore";
import { splitOnUppercase } from "../../../utils/labels";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { ProposalResponse } from "../../../api/types";
import { ProposalDetailsModal } from "./components/ProposalDetailsModal";
import { ProposalRejectionModal } from "../Proposals/ProposalRejectionModal";
import { SendProposalModal } from "../Messages/components/SendProposalModal";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

interface AbaVendasProps {
	productId?: number;
}

export const SalesTab = ({ productId }: AbaVendasProps) => {
	const navigate = useNavigate();
	const [selectedChartFilters, setSelectedChartFilters] = useState<
		Array<string>
	>([]);
	const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
	const [isProposalDetailsModalOpen, setIsProposalDetailsModalOpen] =
		useState(false);
	const [proposalDetails, setProposalDetails] =
		useState<ProposalResponse | null>(null);
	const [proposalToReject, setProposalToReject] =
		useState<ProposalResponse | null>(null);
	const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
	const chartFilters = [{ id: "sales", label: "Vendas" }];

	const { activeProduct } = useMusicalProductStore();

	const currentUser = useAuthStore((state) => state.user);

	const currentProductId =
		productId || (activeProduct?.id ? Number(activeProduct.id) : undefined);

	const [statusFilter, setStatusFilter] = useState<string>("Todos os status");

	const {
		data: filteredProposals,
		isLoading,
		error,
	} = useFilteredProposals({
		status: statusFilter === "Todos os status" ? undefined : [statusFilter],
	});

	const updateStatusMutation = useUpdateProposalStatus();

	const possibleStatusFilters = [
		"Todos os status",
		"Pendente",
		"Aceita",
		"Rejeitada",
		"SinalPago",
		"EnvioDocumento",
		"EnvioSignatarios",
		"EnvioAssinatura",
		"AguardandoAssinatura",
		"ContratoAssinado",
	];

	const handleSignContract = useCallback(
		async (proposalId: string) => {
			if (proposalId) {
				await navigate({
					to: "/band/contract/$id",
					params: { id: proposalId },
				});
			} else {
				toast.error(
					"Não foi possível acessar o contrato. Identificador da proposta não encontrado."
				);
			}
		},
		[navigate]
	);

	const handleEditContract = useCallback(
		async (proposalId: string) => {
			if (proposalId) {
				await navigate({
					to: "/band/contract/$id",
					params: { id: proposalId },
				});
			} else {
				toast.error(
					"Não foi possível acessar o contrato. Identificador da proposta não encontrado."
				);
			}
		},
		[navigate]
	);

	const handleSeeContract = useCallback(
		(proposalId: string) => {
			setProposalDetails(
				filteredProposals?.data.find(
					(p) => p.identificadorUnico === proposalId
				) || null
			);
			setIsProposalDetailsModalOpen(true);
		},
		[filteredProposals?.data]
	);

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

	const handleAcceptProposal = async (proposalId: number) => {
		try {
			await updateStatusMutation.mutateAsync({
				proposalId: proposalId,
				status: "aceito",
			});
			toast.success("Proposta aceita! O contrato será gerado.");
		} catch (error) {
			console.error("Error accepting proposal:", error);
			toast.error("Erro ao aceitar a proposta. Tente novamente.");
		}
	};

	const handleRejectProposal = useCallback(
		(proposal: ProposalResponse | string) => {
			if (typeof proposal === "string") {
				const foundProposal = filteredProposals?.data.find(
					(p) => p.identificadorUnico === proposal
				);
				if (!foundProposal) return;
				setProposalToReject(foundProposal);
			} else {
				setProposalToReject(proposal);
			}
			setIsRejectionModalOpen(true);
		},
		[filteredProposals?.data]
	);

	const tableData: EventsTableData =
		useMemo(
			() =>
				filteredProposals?.data.map((event) => {
					const isContractor = event.idContratante === currentUser?.id;

					return {
						event: {
							id: event.identificadorUnico,
							title: event.descricao,
							date: event.dataCriacao,
						},
						paymentStatus: event.status.nome,
						paymentStatusComponent: (
							<PaymentStatusCard name={event.status.nome} />
						),
						clientName: event.contratante.nome,
						productName: event.produtoMusical.nome,
						value: event.valor,
						canSign:
							event.status.nome === "AguardandoAssinatura" &&
							((!event.assinaturaContratante && isContractor) ||
								(!event.assinaturaContratado && !isContractor)),
						onSign: handleSignContract,
						onSeeContract: handleSeeContract,
						onEditContract: handleEditContract,
						onReject: handleRejectProposal,
					};
				}),
			[
				filteredProposals?.data,
				currentUser?.id,
				handleSignContract,
				handleSeeContract,
				handleEditContract,
				handleRejectProposal,
			]
		) || [];

	return (
		<div className="w-full h-full flex flex-col gap-4">
			<div className="flex w-full items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl">Minhas Vendas</h1>
					<p className="text-gray-600 mt-1">
						Gerencie suas vendas e propostas enviadas aos clientes
					</p>
				</div>
				<Button
					className="gap-3"
					onClick={() => {
						setIsProposalModalOpen(true);
					}}
				>
					<Plus />
					Nova proposta
				</Button>
			</div>
			<hr className="w-full" />

			<div className="flex justify-between">
				<div className="text-black mt-1 flex items-center gap-4">
					<p className="font-bold">Filtrar por status:</p>
					<Dropdown
						align="left"
						className="p-0.5"
						trigger={
							<Button
								variant="outline"
								className="min-w-[180px] justify-between"
							>
								{splitOnUppercase(statusFilter)}
								<ChevronDown className="h-4 w-4 ml-2" />
							</Button>
						}
					>
						{possibleStatusFilters.map((item) => (
							<div className="flex w-full" key={item}>
								<button
									className="flex justify-between items-center rounded-md px-4 py-2 text-left hover:bg-gray-100 w-full"
									onClick={() => {
										setStatusFilter(item);
									}}
								>
									{splitOnUppercase(item)}
									{item === statusFilter && <Check color="gray" size={16} />}
								</button>
							</div>
						))}
					</Dropdown>
				</div>
				<p className="text-gray-600 text-sm">
					{filteredProposals?.data.length} de{" "}
					{filteredProposals?.pagination.total} vendas
				</p>
			</div>

			{isLoading && <TableSkeleton />}
			{error && !isLoading && (
				<ErrorState
					message="Erro ao carregar vendas e propostas"
					onRetry={() => {
						window.location.reload();
					}}
				/>
			)}
			{!isLoading && !error && tableData.length === 0 && (
				<EmptyState
					icon={<FileText className="h-12 w-12 text-gray-400" />}
					title={"Nenhuma venda encontrada"}
					message={
						filteredProposals && filteredProposals?.pagination.total > 0
							? "Tente ajustar os filtros."
							: "Você ainda não tem vendas. Crie sua primeira proposta para começar."
					}
					action={
						filteredProposals &&
						filteredProposals?.pagination.total === 0 && (
							<Button
								onClick={() => {
									setIsProposalModalOpen(true);
								}}
								className="flex items-center gap-2 bg-primary-600 hover:bg-blue-700"
							>
								<Plus className="h-4 w-4" />
								Criar Primeira Proposta
							</Button>
						)
					}
				/>
			)}
			{tableData.length > 0 && <EventsTable data={tableData} />}

			<h1 className="font-bold text-2xl">Relatórios</h1>
			<hr className="w-full" />

			<Reports />

			<div className="flex flex-col w-full bg-gray-50 border border-gray-200 gap-6 p-6 rounded-lg">
				<div className="w-full flex items-center justify-between">
					<div className="flex gap-3 items-center">
						<div className="bg-white border border-gay-300 rounded-lg p-2 text-gray-600">
							<ChartLineIcon size={14} />
						</div>
						<FilterSelector
							filters={chartFilters}
							selectedFilters={selectedChartFilters}
							onFilterChange={setSelectedChartFilters}
						/>
					</div>
					<UpdateButton
						onClick={() => {
							// Handle update
						}}
					/>
				</div>
				<LineChartComponent
					dates={
						filteredProposals?.data.map((event) =>
							new Date(event.dataCriacao).toLocaleDateString("pt-BR")
						) || []
					}
					values={filteredProposals?.data.map((event) => event.valor) || []}
				/>
			</div>

			<SendProposalModal
				isOpen={isProposalModalOpen}
				onClose={() => {
					setIsProposalModalOpen(false);
				}}
				recipientId={currentProductId}
			/>

			<ProposalDetailsModal
				isOpen={isProposalDetailsModalOpen}
				onClose={() => {
					setIsProposalDetailsModalOpen(false);
				}}
				proposal={proposalDetails!}
				onStatusUpdate={handleStatusUpdate}
				onAccept={handleAcceptProposal}
				onReject={handleRejectProposal}
				onSignContract={handleSignContract}
			/>

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
