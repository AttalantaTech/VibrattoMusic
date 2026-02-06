import type React from "react";
import { useState, useEffect } from "react";
import {
	Calendar,
	MapPin,
	DollarSign,
	Star,
	CheckCircle2,
	XCircle,
} from "lucide-react";
import { Button } from "../../ui/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/Input/Input";
import { Label } from "../../ui/Label/Label";
import { Textarea } from "../../ui/Textarea/Textarea";
import {
	useCreateBooking,
	useCheckAvailability,
} from "../../../hooks/useBookings";
import type { CreateBookingRequest, MusicalProduct } from "../../../api/types";
import { cn } from "../../../lib/utils/cn";

interface CreateBookingModalProps {
	isOpen: boolean;
	onClose: () => void;
	musicalProduct: MusicalProduct;
}

export const CreateBookingModal = ({
	isOpen,
	onClose,
	musicalProduct,
}: CreateBookingModalProps) => {
	const [formData, setFormData] = useState<Partial<CreateBookingRequest>>({
		produtoMusicalId: musicalProduct.id,
		dataEvento: "",
		horaInicio: "",
		horaFim: "",
		local: "",
		valor: musicalProduct.valorServico || 0,
		observacoes: "",
		endereco: {
			cep: "",
			logradouro: "",
			numero: "",
			bairro: "",
			cidade: "",
			estado: "",
		},
	});

	const [availability, setAvailability] = useState<{
		disponivel: boolean;
		conflitos?: Array<{ inicio: string; fim: string }>;
	} | null>(null);

	const createBookingMutation = useCreateBooking();
	const checkAvailabilityMutation = useCheckAvailability();

	useEffect(() => {
		if (isOpen) {
			// Reset form when modal opens
			setFormData({
				produtoMusicalId: musicalProduct.id,
				dataEvento: "",
				horaInicio: "",
				horaFim: "",
				local: "",
				valor: musicalProduct.valorServico || 0,
				observacoes: "",
				endereco: {
					cep: "",
					logradouro: "",
					numero: "",
					bairro: "",
					cidade: "",
					estado: "",
				},
			});
			setAvailability(null);
		}
	}, [isOpen, musicalProduct]);

	const handleInputChange = (field: string, value: string | number) => {
		if (field.startsWith("endereco.")) {
			const enderecoField = field.replace("endereco.", "");
			setFormData((previous) => ({
				...previous,
				endereco: {
					...previous.endereco!,
					[enderecoField]: value,
				},
			}));
		} else {
			setFormData((previous) => ({
				...previous,
				[field]: value,
			}));
		}
	};

	const handleCheckAvailability = async () => {
		if (formData.dataEvento && formData.horaInicio && formData.horaFim) {
			try {
				const result = await checkAvailabilityMutation.mutateAsync({
					productId: musicalProduct.id,
					dataEvento: formData.dataEvento,
					horaInicio: formData.horaInicio,
					horaFim: formData.horaFim,
				});
				setAvailability(result);
			} catch (error) {
				console.error("Error checking availability:", error);
			}
		}
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (!availability?.disponivel) {
			alert("Por favor, verifique a disponibilidade primeiro.");
			return;
		}

		try {
			await createBookingMutation.mutateAsync(formData as CreateBookingRequest);
			onClose();
			alert("Contratação solicitada com sucesso!");
		} catch (error) {
			console.error("Error creating booking:", error);
			alert("Erro ao criar contratação. Tente novamente.");
		}
	};

	const isFormValid = () => {
		return (
			formData.dataEvento &&
			formData.horaInicio &&
			formData.horaFim &&
			formData.local &&
			formData.endereco?.cep &&
			formData.endereco?.logradouro &&
			formData.endereco?.numero &&
			formData.endereco?.bairro &&
			formData.endereco?.cidade &&
			formData.endereco?.estado &&
			availability?.disponivel
		);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<form onSubmit={handleSubmit} className="space-y-6">
					<DialogHeader>
						<DialogTitle>Nova Contratação</DialogTitle>
						<DialogDescription>
							Solicite uma contratação para {musicalProduct.nome}
						</DialogDescription>
					</DialogHeader>

					{/* Artist Info */}
					<div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
						<img
							src={musicalProduct.fotoPerfil ?? "/placeholder-band.jpg"}
							alt={musicalProduct.nome}
							className="w-16 h-16 rounded-full object-cover"
						/>
						<div>
							<h2 className="text-xl font-bold text-gray-900">
								{musicalProduct.nome}
							</h2>
							<div className="flex items-center gap-2 text-sm text-gray-600">
								<Star className="w-4 h-4 text-yellow-500" />
								<span>4.8 (124 avaliações)</span>
							</div>
							<div className="flex items-center gap-2 text-sm text-gray-600">
								<MapPin className="w-4 h-4" />
								<span>{musicalProduct.cidade.nome}</span>
							</div>
						</div>
					</div>

					{/* Event Details */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
							<Calendar className="w-5 h-5" />
							Detalhes do Evento
						</h3>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="dataEvento">Data do Evento *</Label>
								<Input
									id="dataEvento"
									type="date"
									value={formData.dataEvento}
									onChange={(event) => {
										handleInputChange("dataEvento", event.target.value);
									}}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="local">Local do Evento *</Label>
								<Input
									id="local"
									placeholder="Ex: Salão de Festas Villa Rosa"
									value={formData.local}
									onChange={(event) => {
										handleInputChange("local", event.target.value);
									}}
									required
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="horaInicio">Hora de Início *</Label>
								<Input
									id="horaInicio"
									type="time"
									value={formData.horaInicio}
									onChange={(event) => {
										handleInputChange("horaInicio", event.target.value);
									}}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="horaFim">Hora de Término *</Label>
								<Input
									id="horaFim"
									type="time"
									value={formData.horaFim}
									onChange={(event) => {
										handleInputChange("horaFim", event.target.value);
									}}
									required
								/>
							</div>
						</div>

						{/* Availability Check */}
						{formData.dataEvento && formData.horaInicio && formData.horaFim && (
							<div className="bg-gray-50 p-4 rounded-lg">
								<Button
									type="button"
									variant="outline"
									onClick={handleCheckAvailability}
									disabled={checkAvailabilityMutation.isPending}
									className="mb-3 w-full sm:w-auto"
								>
									{checkAvailabilityMutation.isPending
										? "Verificando..."
										: "Verificar Disponibilidade"}
								</Button>

								{availability && (
									<div
										className={cn(
											"p-3 rounded-md flex items-start gap-2",
											availability.disponivel
												? "bg-green-50 text-green-800 border border-green-200"
												: "bg-red-50 text-red-800 border border-red-200"
										)}
									>
										{availability.disponivel ? (
											<>
												<CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
												<span>Horário disponível!</span>
											</>
										) : (
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-2">
													<XCircle className="w-5 h-5" />
													<span className="font-medium">
														Horário não disponível
													</span>
												</div>
												{availability.conflitos &&
													availability.conflitos.length > 0 && (
														<div className="text-sm ml-7">
															<p className="font-medium mb-1">
																Conflitos encontrados:
															</p>
															{availability.conflitos.map((conflito, index) => (
																<div key={index} className="text-red-700">
																	{conflito.inicio} - {conflito.fim}
																</div>
															))}
														</div>
													)}
											</div>
										)}
									</div>
								)}
							</div>
						)}
					</div>

					{/* Address */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
							<MapPin className="w-5 h-5" />
							Endereço do Evento
						</h3>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="cep">CEP *</Label>
								<Input
									id="cep"
									placeholder="00000-000"
									value={formData.endereco?.cep}
									onChange={(event) => {
										handleInputChange("endereco.cep", event.target.value);
									}}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="numero">Número *</Label>
								<Input
									id="numero"
									placeholder="123"
									value={formData.endereco?.numero}
									onChange={(event) => {
										handleInputChange("endereco.numero", event.target.value);
									}}
									required
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="logradouro">Logradouro *</Label>
							<Input
								id="logradouro"
								placeholder="Rua das Flores"
								value={formData.endereco?.logradouro}
								onChange={(event) => {
									handleInputChange("endereco.logradouro", event.target.value);
								}}
								required
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="bairro">Bairro *</Label>
								<Input
									id="bairro"
									placeholder="Centro"
									value={formData.endereco?.bairro}
									onChange={(event) => {
										handleInputChange("endereco.bairro", event.target.value);
									}}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="cidade">Cidade *</Label>
								<Input
									id="cidade"
									placeholder="São Paulo"
									value={formData.endereco?.cidade}
									onChange={(event) => {
										handleInputChange("endereco.cidade", event.target.value);
									}}
									required
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="estado">Estado *</Label>
							<Input
								id="estado"
								placeholder="SP"
								maxLength={2}
								value={formData.endereco?.estado}
								onChange={(event) => {
									handleInputChange(
										"endereco.estado",
										event.target.value.toUpperCase()
									);
								}}
								required
							/>
						</div>
					</div>

					{/* Pricing */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
							<DollarSign className="w-5 h-5" />
							Valor
						</h3>

						<div className="space-y-2">
							<Label htmlFor="valor">Valor Proposto (R$)</Label>
							<Input
								id="valor"
								type="number"
								step="0.01"
								min="0"
								value={formData.valor}
								onChange={(event) => {
									handleInputChange("valor", parseFloat(event.target.value));
								}}
							/>
						</div>
					</div>

					{/* Additional Notes */}
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="observacoes">Observações Adicionais</Label>
							<Textarea
								id="observacoes"
								placeholder="Adicione detalhes sobre o evento, requisitos especiais, etc."
								rows={3}
								value={formData.observacoes}
								onChange={(event) => {
									handleInputChange("observacoes", event.target.value);
								}}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancelar
						</Button>
						<Button
							type="submit"
							disabled={!isFormValid() || createBookingMutation.isPending}
						>
							{createBookingMutation.isPending
								? "Enviando..."
								: "Enviar Solicitação"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
