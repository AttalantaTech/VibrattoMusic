import { useState } from "react";
import { formatDate } from "../../../utils/validation";
import {
	Calendar,
	Clock,
	MapPin,
	DollarSign,
	MessageCircle,
	CheckCircle,
	XCircle,
	MoreVertical,
} from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { Badge } from "../../ui/Badge/Badge";
import { Dropdown } from "../../ui/Dropdown/Dropdown";
import {
	useMyBookings,
	useProductBookings,
	useCancelBooking,
	useConfirmBooking,
	useCompleteBooking,
} from "../../../hooks/useBookings";
import { BookingStatus, type Booking } from "../../../api/types";

interface BookingsListProps {
	type: "client" | "provider";
	productId?: number;
	status?: string;
}

export const BookingsList = ({
	type,
	productId,
	status,
}: BookingsListProps) => {
	const [, setSelectedBooking] = useState<Booking | null>(null);

	// Hooks for different booking views
	const clientBookings = useMyBookings(
		{ status, page: 1, limit: 10 },
		type === "client"
	);

	const providerBookings = useProductBookings(
		productId,
		{ status, page: 1, limit: 10 },
		type === "provider"
	);

	// Mutation hooks
	const cancelBookingMutation = useCancelBooking();
	const confirmBookingMutation = useConfirmBooking();
	const completeBookingMutation = useCompleteBooking();

	const bookings =
		type === "client" ? clientBookings.data?.data : providerBookings.data?.data;
	const isLoading =
		type === "client" ? clientBookings.isLoading : providerBookings.isLoading;

	const getStatusBadge = (status: string) => {
		const statusConfig = {
			pendente: { variant: "warning" as const, label: "Pendente" },
			confirmado: { variant: "success" as const, label: "Confirmado" },
			cancelado: { variant: "error" as const, label: "Cancelado" },
			concluido: { variant: "secondary" as const, label: "Concluído" },
		};

		return (
			statusConfig[status as keyof typeof statusConfig] || {
				variant: "secondary" as const,
				label: status,
			}
		);
	};

	const handleStatusUpdate = async (
		bookingId: number,
		newStatus: "confirmado" | "cancelado" | "concluido"
	) => {
		try {
			if (newStatus === "cancelado") {
				await cancelBookingMutation.mutateAsync({ bookingId });
			} else if (newStatus === "confirmado") {
				await confirmBookingMutation.mutateAsync(bookingId);
			} else if (newStatus === "concluido") {
				await completeBookingMutation.mutateAsync(bookingId);
			}
		} catch (error) {
			console.error("Error updating booking status:", error);
		}
	};


	const formatTime = (timeString: string) => {
		return timeString.slice(0, 5); // Remove seconds if present
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	if (!bookings || bookings.length === 0) {
		return (
			<div className="text-center p-8 text-gray-500">
				<Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
				<h3 className="text-lg font-medium mb-2">
					Nenhuma contratação encontrada
				</h3>
				<p className="text-sm">
					{type === "client"
						? "Você ainda não fez nenhuma contratação."
						: "Você ainda não recebeu nenhuma contratação."}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{bookings.map((booking) => {
				const statusBadge = getStatusBadge(booking.status);
				const isProvider = type === "provider";
				const canUpdateStatus = isProvider && BookingStatus.COMPLETED;

				return (
					<div
						key={booking.id}
						className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
					>
						<div className="flex items-start justify-between">
							<div className="flex-1 space-y-3">
								{/* Header */}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										{booking.produtoMusical?.fotoPerfil && (
											<img
												src={booking.produtoMusical.fotoPerfil}
												alt={booking.produtoMusical.nome}
												className="w-12 h-12 rounded-full object-cover"
											/>
										)}
										<div>
											<h3 className="font-semibold text-gray-900">
												{isProvider
													? booking.usuario?.nome || "Cliente"
													: booking.produtoMusical?.nome || "Evento"}
											</h3>
											<p className="text-sm text-gray-600">
												{isProvider
													? booking.produtoMusical?.nome
													: `Cliente: ${booking.usuario?.nome}`}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Badge variant={statusBadge.variant}>
											{statusBadge.label}
										</Badge>
										{canUpdateStatus && (
											<Dropdown
												trigger={
													<Button variant="secondary" size="sm">
														<MoreVertical className="w-4 h-4" />
													</Button>
												}
											>
												<div className="py-1">
													<button
														className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
														onClick={() =>
															handleStatusUpdate(booking.id, "confirmado")
														}
													>
														<CheckCircle className="w-4 h-4" />
														Confirmar
													</button>
													<button
														className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
														onClick={() =>
															handleStatusUpdate(booking.id, "cancelado")
														}
													>
														<XCircle className="w-4 h-4" />
														Cancelar
													</button>
												</div>
											</Dropdown>
										)}
									</div>
								</div>

								{/* Event Details */}
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
									<div className="flex items-center gap-2 text-gray-600">
										<Calendar className="w-4 h-4" />
										<span>{formatDate(booking.dataEvento)}</span>
									</div>
									<div className="flex items-center gap-2 text-gray-600">
										<Clock className="w-4 h-4" />
										<span>
											{formatTime(booking.horaInicio)} -{" "}
											{formatTime(booking.horaFim)}
										</span>
									</div>
									<div className="flex items-center gap-2 text-gray-600">
										<MapPin className="w-4 h-4" />
										<span className="truncate">{booking.local}</span>
									</div>
									<div className="flex items-center gap-2 text-gray-600">
										<DollarSign className="w-4 h-4" />
										<span className="font-medium">
											R$ {booking.valor.toFixed(2)}
										</span>
									</div>
								</div>

								{/* Address */}
								{booking.endereco && (
									<div className="text-sm text-gray-600">
										<MapPin className="w-4 h-4 inline mr-1" />
										{booking.endereco.logradouro}, {booking.endereco.numero} -{" "}
										{booking.endereco.bairro}, {booking.endereco.cidade}/
										{booking.endereco.estado}
									</div>
								)}

								{/* Observations */}
								{booking.observacoes && (
									<div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
										<strong>Observações:</strong> {booking.observacoes}
									</div>
								)}
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3 mt-4 pt-4 border-t">
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setSelectedBooking(booking);
								}}
							>
								<MessageCircle className="w-4 h-4 mr-2" />
								Mensagem
							</Button>

							{booking.status == BookingStatus.CONFIRMED && isProvider && (
								<Button
									size="sm"
									onClick={() => handleStatusUpdate(booking.id, "concluido")}
									disabled={completeBookingMutation.isPending}
								>
									<CheckCircle className="w-4 h-4 mr-2" />
									{completeBookingMutation.isPending
										? "Marcando..."
										: "Marcar como Concluído"}
								</Button>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
};
