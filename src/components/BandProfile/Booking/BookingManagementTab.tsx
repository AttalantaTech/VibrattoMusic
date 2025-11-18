import { useState } from "react";
import {
	Calendar,
	Clock,
	MapPin,
	DollarSign,
	MessageCircle,
	Eye,
	CheckCircle,
	X,
	AlertCircle,
} from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { TabNavigation } from "../../ui/TabNavigation/TabNavigation";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../ui/dialog";
import { Label } from "../../ui/Label/Label";
import { Textarea } from "../../ui/Textarea/Textarea";
import {
	useMyBookings,
	useProductBookings,
	useUpdateBookingStatus,
	useCancelBooking,
	useConfirmBooking,
	useCompleteBooking,
} from "../../../hooks/useBookings";
import { CreateBookingModal } from "./CreateBookingModal";
import { BookingDetailsModal } from "./BookingDetailsModal";
import {
	type Booking,
	type MusicalProduct,
	BookingStatus,
} from "../../../api/types";

const tabs = [
	{ label: "Minhas Contratações", value: "client" },
	{ label: "Solicitações Recebidas", value: "provider" },
];

const statusColors = {
	pendente: "bg-yellow-100 text-yellow-800",
	confirmado: "bg-green-100 text-green-800",
	cancelado: "bg-red-100 text-red-800",
	concluido: "bg-blue-100 text-blue-800",
};

interface BookingCardProps {
	booking: Booking;
	isProvider: boolean;
	onViewDetails: (booking: Booking) => void;
	onUpdateStatus: (
		bookingId: number,
		status: "confirmado" | "cancelado" | "concluido"
	) => void;
	onCancel: (bookingId: number, motivo?: string) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({
	booking,
	isProvider,
	onViewDetails,
	onUpdateStatus,
	onCancel,
}) => {
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [cancelReason, setCancelReason] = useState("");

	const handleCancel = () => {
		onCancel(booking.id, cancelReason);
		setShowCancelDialog(false);
		setCancelReason("");
	};

	return (
		<div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
			<div className="flex justify-between items-start mb-4">
				<div className="flex items-center gap-3">
					{booking.produtoMusical?.fotoPerfil && (
						<img
							src={booking.produtoMusical.fotoPerfil}
							alt={booking.produtoMusical.nome}
							className="w-12 h-12 rounded-full object-cover"
						/>
					)}
					<div>
						<h3 className="font-semibold text-lg text-gray-900">
							{isProvider
								? booking.usuario?.nome
								: booking.produtoMusical?.nome}
						</h3>
						<div className="flex items-center gap-2 text-sm text-gray-600">
							<Calendar className="w-4 h-4" />
							<span>
								{new Date(booking.dataEvento).toLocaleDateString("pt-BR")}
							</span>
							<Clock className="w-4 h-4 ml-2" />
							<span>
								{booking.horaInicio} - {booking.horaFim}
							</span>
						</div>
					</div>
				</div>
				<span
					className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[booking.status as unknown as keyof typeof statusColors]}`}
				>
					{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
				</span>
			</div>

			<div className="space-y-2 mb-4">
				<div className="flex items-center gap-2 text-sm text-gray-600">
					<MapPin className="w-4 h-4" />
					<span>{booking.local}</span>
				</div>
				<div className="flex items-center gap-2 text-sm text-gray-600">
					<DollarSign className="w-4 h-4" />
					<span>R$ {booking.valor.toFixed(2)}</span>
				</div>
				{booking.observacoes && (
					<p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
						{booking.observacoes}
					</p>
				)}
			</div>

			<div className="flex gap-2 flex-wrap">
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						onViewDetails(booking);
					}}
					className="flex items-center gap-1"
				>
					<Eye className="w-4 h-4" />
					Ver Detalhes
				</Button>

				{booking.status === BookingStatus?.PENDING && isProvider && (
					<>
						<Button
							size="sm"
							onClick={() => {
								onUpdateStatus(booking.id, "confirmado");
							}}
							className="flex items-center gap-1"
							variant="primary"
						>
							<CheckCircle className="w-4 h-4" />
							Confirmar
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setShowCancelDialog(true);
							}}
							className="flex items-center gap-1 text-red-600 hover:text-red-700"
						>
							<X className="w-4 h-4" />
							Recusar
						</Button>
					</>
				)}

				{booking.status === (BookingStatus?.CONFIRMED ?? "confirmado") && (
					<>
						{isProvider && (
							<Button
								size="sm"
								onClick={() => {
									onUpdateStatus(booking.id, "concluido");
								}}
								className="flex items-center gap-1"
								variant="primary"
							>
								<CheckCircle className="w-4 h-4" />
								Marcar como Concluído
							</Button>
						)}
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setShowCancelDialog(true);
							}}
							className="flex items-center gap-1 text-red-600 hover:text-red-700"
						>
							<X className="w-4 h-4" />
							Cancelar
						</Button>
					</>
				)}

				<Button variant="outline" size="sm" className="flex items-center gap-1">
					<MessageCircle className="w-4 h-4" />
					Conversar
				</Button>
			</div>

			{/* Cancel Dialog */}
			<Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<AlertCircle className="w-5 h-5 text-red-500" />
							Cancelar Contratação
						</DialogTitle>
						<DialogDescription>
							Tem certeza que deseja cancelar esta contratação? Esta ação não
							pode ser desfeita.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="cancel-reason">
								Motivo do cancelamento (opcional)
							</Label>
							<Textarea
								id="cancel-reason"
								value={cancelReason}
								onChange={(e) => {
									setCancelReason(e.target.value);
								}}
								rows={3}
								placeholder="Descreva o motivo do cancelamento..."
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setShowCancelDialog(false);
							}}
						>
							Voltar
						</Button>
						<Button onClick={handleCancel} variant="danger">
							Confirmar Cancelamento
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export const BookingManagementTab = () => {
	const [currentTab, setCurrentTab] = useState("client");
	const [statusFilter, setStatusFilter] = useState("");
	const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);

	// Mock musical product for create modal (in real app, this would come from context or props)
	const mockMusicalProduct: MusicalProduct = {
		id: 1,
		nome: "Exemplo Band",
		valorServico: 500,
		fotoPerfil: "",
		cidade: "São Paulo",
		// Add other required fields as needed
	} as unknown as MusicalProduct;

	const isProvider = currentTab === "provider";

	// Fetch bookings based on current tab
	const { data: clientBookings, isLoading: clientLoading } = useMyBookings(
		{ status: statusFilter || undefined },
		currentTab === "client"
	);

	const { data: providerBookings, isLoading: providerLoading } =
		useProductBookings(
			undefined, // Get all products bookings
			{ status: statusFilter || undefined },
			currentTab === "provider"
		);

	const updateStatusMutation = useUpdateBookingStatus();
	const cancelMutation = useCancelBooking();
	const confirmMutation = useConfirmBooking();
	const completeMutation = useCompleteBooking();

	const currentBookings = isProvider
		? providerBookings?.data || []
		: clientBookings?.data || [];
	const isLoading = isProvider ? providerLoading : clientLoading;

	const handleUpdateStatus = async (
		bookingId: number,
		status: "confirmado" | "cancelado" | "concluido"
	) => {
		try {
			if (status === "confirmado") {
				await confirmMutation.mutateAsync(bookingId);
			} else if (status === "concluido") {
				await completeMutation.mutateAsync(bookingId);
			} else {
				await updateStatusMutation.mutateAsync({ bookingId, status });
			}
		} catch (error) {
			console.error("Error updating booking status:", error);
			alert("Erro ao atualizar status da contratação");
		}
	};

	const handleCancel = async (bookingId: number, motivo?: string) => {
		try {
			await cancelMutation.mutateAsync({ bookingId, motivo });
		} catch (error) {
			console.error("Error canceling booking:", error);
			alert("Erro ao cancelar contratação");
		}
	};

	const handleViewDetails = (booking: Booking) => {
		setSelectedBooking(booking);
	};

	return (
		<div className="w-full h-full flex flex-col gap-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-gray-900">
						Gerenciar Contratações
					</h1>
					<p className="text-gray-600 text-sm mt-1">
						Acompanhe suas contratações e solicitações recebidas
					</p>
				</div>
				{!isProvider && (
					<Button
						onClick={() => {
							setShowCreateModal(true);
						}}
						className="flex items-center gap-2"
					>
						<Calendar className="w-4 h-4" />
						Nova Contratação
					</Button>
				)}
			</div>

			{/* Tabs and Filters */}
			<div className="flex items-center justify-between">
				<TabNavigation
					currentTab={currentTab}
					tabs={tabs}
					onChange={setCurrentTab}
					variant="underline"
				/>

				<div className="flex items-center gap-4">
					<select
						value={statusFilter}
						onChange={(e) => {
							setStatusFilter(e.target.value);
						}}
						className="px-3 py-2 border border-gray-300 rounded-md text-sm"
					>
						<option value="">Todos os status</option>
						<option value="pendente">Pendente</option>
						<option value="confirmado">Confirmado</option>
						<option value="cancelado">Cancelado</option>
						<option value="concluido">Concluído</option>
					</select>
				</div>
			</div>

			{/* Bookings List */}
			<div className="flex-1 overflow-y-auto">
				{isLoading ? (
					<div className="flex items-center justify-center h-64">
						<div className="text-gray-500">Carregando contratações...</div>
					</div>
				) : currentBookings.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-64 text-gray-500">
						<Calendar className="w-12 h-12 mb-4 text-gray-300" />
						<h3 className="text-lg font-medium mb-2">
							{isProvider
								? "Nenhuma solicitação encontrada"
								: "Nenhuma contratação encontrada"}
						</h3>
						<p className="text-sm">
							{isProvider
								? "Quando recebermos solicitações de contratação, elas aparecerão aqui."
								: "Suas contratações aparecerão aqui quando você fizer uma solicitação."}
						</p>
					</div>
				) : (
					<div className="grid gap-4">
						{currentBookings.map((booking) => (
							<BookingCard
								key={booking.id}
								booking={booking}
								isProvider={isProvider}
								onViewDetails={handleViewDetails}
								onUpdateStatus={handleUpdateStatus}
								onCancel={handleCancel}
							/>
						))}
					</div>
				)}
			</div>

			{/* Modals */}
			<CreateBookingModal
				isOpen={showCreateModal}
				onClose={() => {
					setShowCreateModal(false);
				}}
				musicalProduct={mockMusicalProduct}
			/>

			<BookingDetailsModal
				isOpen={selectedBooking !== null}
				onClose={() => {
					setSelectedBooking(null);
				}}
				booking={selectedBooking}
			/>
		</div>
	);
};
