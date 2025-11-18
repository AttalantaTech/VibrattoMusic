import { useState } from "react";
import {
	Calendar,
	Clock,
	MapPin,
	User,
	Phone,
	Mail,
	DollarSign,
	MessageCircle,
	CheckCircle,
	X,
	FileText,
	Star,
} from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { Modal } from "../../ui/Modal/Modal";
import { TextAreaField } from "../../forms/TextAreaField/TextAreaField";
import {
	useSendBookingMessage,
	useUpdateBookingStatus,
} from "../../../hooks/useBookings";
import { BookingStatus, type Booking } from "../../../api/types";

interface BookingDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	booking: Booking | null;
}

export const BookingDetailsModal = ({
	isOpen,
	onClose,
	booking,
}: BookingDetailsModalProps) => {
	const [message, setMessage] = useState("");
	const [showMessageInput, setShowMessageInput] = useState(false);

	const sendMessageMutation = useSendBookingMessage();
	const updateStatusMutation = useUpdateBookingStatus();

	if (!booking) return null;

	const handleSendMessage = async () => {
		if (!message.trim()) return;

		try {
			await sendMessageMutation.mutateAsync({
				bookingId: booking.id,
				conteudo: message.trim(),
			});
			setMessage("");
			setShowMessageInput(false);
			alert("Mensagem enviada com sucesso!");
		} catch (error) {
			console.error("Error sending message:", error);
			alert("Erro ao enviar mensagem");
		}
	};

	const handleStatusUpdate = async (status: BookingStatus) => {
		try {
			// Fix status mutation type
			await updateStatusMutation.mutateAsync({
				bookingId: booking.id,
				status: status as any,
			});
			alert("Status atualizado com sucesso!");
		} catch (error) {
			console.error("Error updating status:", error);
			alert("Erro ao atualizar status");
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "pendente":
				return "bg-yellow-100 text-yellow-800";
			case "confirmado":
				return "bg-green-100 text-green-800";
			case "cancelado":
				return "bg-red-100 text-red-800";
			case "concluido":
				return "bg-blue-100 text-blue-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-start justify-between border-b pb-4">
					<div className="flex items-center gap-4">
						{booking.produtoMusical?.fotoPerfil && (
							<img
								src={booking.produtoMusical.fotoPerfil}
								alt={booking.produtoMusical.nome}
								className="w-16 h-16 rounded-full object-cover"
							/>
						)}
						<div>
							<h2 className="text-xl font-bold text-gray-900">
								{booking.produtoMusical?.nome ?? "Produto Musical"}
							</h2>
							<div className="flex items-center gap-2 text-gray-600 mt-1">
								<Star className="w-4 h-4 text-yellow-500" />
								<span>4.8 (124 avaliações)</span>
							</div>
							<div className="flex items-center gap-2 text-gray-600">
								<MapPin className="w-4 h-4" />
								<span>
									{typeof booking.produtoMusical?.cidade === "string"
										? booking.produtoMusical.cidade
										: (booking.produtoMusical?.cidade?.Nome ??
											"Cidade não informada")}
								</span>
							</div>
						</div>
					</div>
					<span
						className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(typeof booking.status === "string" ? booking.status : "")}`}
					>
						{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
					</span>
				</div>

				{/* Event Details */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
							<Calendar className="w-5 h-5" />
							Detalhes do Evento
						</h3>

						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<Calendar className="w-4 h-4 text-gray-500" />
								<span className="font-medium">Data:</span>
								<span>
									{booking.dataEvento
										? new Date(booking.dataEvento).toLocaleDateString("pt-BR")
										: ""}
								</span>
							</div>

							<div className="flex items-center gap-2">
								<Clock className="w-4 h-4 text-gray-500" />
								<span className="font-medium">Horário:</span>
								<span>
									{booking.horaInicio} - {booking.horaFim}
								</span>
							</div>

							<div className="flex items-center gap-2">
								<MapPin className="w-4 h-4 text-gray-500" />
								<span className="font-medium">Local:</span>
								<span>{booking.local}</span>
							</div>

							<div className="flex items-center gap-2">
								<DollarSign className="w-4 h-4 text-gray-500" />
								<span className="font-medium">Valor:</span>
								<span className="text-green-600 font-semibold">
									R$ {booking.valor.toFixed(2)}
								</span>
							</div>
						</div>
					</div>

					{/* Contact Info */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
							<User className="w-5 h-5" />
							Informações de Contato
						</h3>

						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<User className="w-4 h-4 text-gray-500" />
								<span className="font-medium">Cliente:</span>
								<span>{booking.usuario?.nome ?? "Nome não informado"}</span>
							</div>

							{booking.usuario?.email && (
								<div className="flex items-center gap-2">
									<Mail className="w-4 h-4 text-gray-500" />
									<span className="font-medium">Email:</span>
									<span>{booking.usuario.email}</span>
								</div>
							)}

							{booking.usuario?.telefoneWhatsApp && (
								<div className="flex items-center gap-2">
									<Phone className="w-4 h-4 text-gray-500" />
									<span className="font-medium">Telefone:</span>
									<span>{booking.usuario.telefoneWhatsApp}</span>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Address */}
				{booking.endereco && (
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
							<MapPin className="w-5 h-5" />
							Endereço do Evento
						</h3>

						<div className="bg-gray-50 p-4 rounded-lg">
							<p className="text-gray-700">
								{booking.endereco.logradouro}, {booking.endereco.numero}
								{booking.endereco.complemento &&
									`, ${booking.endereco.complemento}`}
							</p>
							<p className="text-gray-700">
								{booking.endereco.bairro}, {booking.endereco.cidade} -{" "}
								{booking.endereco.estado}
							</p>
							<p className="text-gray-700">CEP: {booking.endereco.cep}</p>
						</div>
					</div>
				)}

				{/* Observations */}
				{booking.observacoes && (
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
							<FileText className="w-5 h-5" />
							Observações
						</h3>

						<div className="bg-gray-50 p-4 rounded-lg">
							<p className="text-gray-700">{booking.observacoes}</p>
						</div>
					</div>
				)}

				{/* Message Input */}
				{showMessageInput && (
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
							<MessageCircle className="w-5 h-5" />
							Enviar Mensagem
						</h3>

						<TextAreaField
							name="booking-message"
							value={message}
							onChange={(event_) => {
								setMessage(event_.target.value);
							}}
							placeholder="Digite sua mensagem..."
							rows={4}
						/>

						<div className="flex gap-2">
							<Button
								onClick={handleSendMessage}
								disabled={!message.trim() || sendMessageMutation.isPending}
								className="flex items-center gap-2"
							>
								<MessageCircle className="w-4 h-4" />
								{sendMessageMutation.isPending
									? "Enviando..."
									: "Enviar Mensagem"}
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									setShowMessageInput(false);
									setMessage("");
								}}
							>
								Cancelar
							</Button>
						</div>
					</div>
				)}

				{/* Actions */}
				<div className="flex flex-wrap gap-3 pt-4 border-t">
					{!showMessageInput && (
						<Button
							variant="outline"
							onClick={() => {
								setShowMessageInput(true);
							}}
							className="flex items-center gap-2"
						>
							<MessageCircle className="w-4 h-4" />
							Enviar Mensagem
						</Button>
					)}

					{booking.status === BookingStatus.PENDING && (
						<>
							<Button
								onClick={() => handleStatusUpdate(BookingStatus.CONFIRMED)}
								disabled={updateStatusMutation.isPending}
								className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
							>
								<CheckCircle className="w-4 h-4" />
								Confirmar
							</Button>
							<Button
								onClick={() => handleStatusUpdate(BookingStatus.CANCELLED)}
								disabled={updateStatusMutation.isPending}
								className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
							>
								<X className="w-4 h-4" />
								Cancelar
							</Button>
						</>
					)}

					{booking.status === BookingStatus.CONFIRMED && (
						<Button
							onClick={() => handleStatusUpdate(BookingStatus.COMPLETED)}
							disabled={updateStatusMutation.isPending}
							className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
						>
							<CheckCircle className="w-4 h-4" />
							Concluir
						</Button>
					)}

					<Button variant="outline" onClick={onClose} className="ml-auto">
						Fechar
					</Button>
				</div>
			</div>
		</Modal>
	);
};
