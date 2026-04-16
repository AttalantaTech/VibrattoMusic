import { Button } from "./../../ui/Button/Button";
import { Input } from "./../../ui/Input/Input";
import { Label } from "./../../ui/Label/Label";
import {
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import { Dialog, DialogContent } from "./../../ui/dialog";
import { DatePicker } from "@/components/Calendar/DatePicker";
import { format } from "date-fns";
import { Select, type Option } from "./../../forms/Select/Select";
import { Calendar, Clock } from "lucide-react";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import type { FilterOption, MusicalProduct } from "@/api/types";
import { filterService } from "@/api";
import { toast } from "sonner";
import { useSchedule } from "@/hooks/useMusicalProducts";
import { useStartConversation } from "@/hooks/useMessaging";
// import type { Conversation } from "@/api/services/messages/types";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { useNavigate } from "@tanstack/react-router";
import { TIME_ZONE } from "@/utils";
import { formatInTimeZone } from "date-fns-tz";

const checkAvailabilityValidationSchema = z.object({
	date: z.string().min(1, "Selecione uma data disponível"),
	eventType: z.array(z.number()).min(1, "Selecione um tipo de evento"),
	startTime: z.string().min(4, "Preencha a data de início do evento"),
	endTime: z.string().min(4, "Preencha a data de término evento"),
});

type CheckAvailabilityForm = z.infer<typeof checkAvailabilityValidationSchema>;

export interface CheckAvailabilityModalProps {
	isOpen: boolean;
	onClose: (value: boolean) => void;
	musicalProduct: MusicalProduct | null;
}

export const CheckAvailabilityModal = ({
	isOpen,
	onClose,
	musicalProduct,
}: CheckAvailabilityModalProps) => {
	const navigate = useNavigate();

	const [loadingEventTypes, setLoadingEventTypes] = useState(true);
	const [eventTypes, setEventTypes] = useState<Array<FilterOption>>([]);
	const [selectedEventTypes, setSelectedEventTypes] = useState<Array<Option>>(
		[]
	);
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);

	const tipoEventoOptions: Array<Option> = (eventTypes || []).map((tipo) => ({
		value: tipo.Id.toString(),
		label: tipo.Nome,
	}));

	const { data: agendaData } = useSchedule(
		musicalProduct?.id ?? 0,
		currentMonth
	);
	const { activeProduct } = useMusicalProductStore();
	const { mutate: startConversation } = useStartConversation();

	const handleDefaultTime = (): { startTime: string; endTime: string } => {
		const startTime = new Date().toLocaleString("pt-BR", {
			timeZone: "America/Sao_Paulo",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});

		const [hours = 0, minutes = 0] = startTime.split(":").map(Number);

		const startDate = new Date();
		startDate.setHours(hours, minutes, 0, 0);
		const endDate = new Date(startDate.getTime() + 120 * 60000);

		return {
			startTime: format(startDate, "HH:mm"),
			endTime: format(endDate, "HH:mm"),
		};
	};

	const { startTime, endTime } = handleDefaultTime();

	const defaultValues: CheckAvailabilityForm = {
		date: "",
		eventType: [],
		startTime,
		endTime,
	};

	const {
		register,
		setValue,
		setError,
		watch,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<CheckAvailabilityForm>({
		resolver: zodResolver(checkAvailabilityValidationSchema),
		defaultValues,
	});

	const handleClose = () => {
		onClose(false);
		reset();
		setSelectedDate(null);
	};

	const onSubmit = (formData: CheckAvailabilityForm) => {
		if (!musicalProduct) {
			toast.error(
				"Não foi possível prossegur com a verificação de disponibilidade."
			);
			return;
		}

		const selectedEventType = formData.eventType.find((event_) => event_) ?? 0;

		const eventType = tipoEventoOptions.find(
			(event) => Number(event.value) === selectedEventType
		);

		const message = `
    Olá ${musicalProduct?.nome ?? ""}, que boa notícia! Você recebeu uma solicitação de orçamento :
     🎵 Tipo de Evento: ${eventType?.label ?? ""} 📅 Data: ${formatInTimeZone(formData.date, TIME_ZONE, "dd/MM/yyyy")} 
     ⏰ Horário: ${formData.startTime} - ${formData.endTime}
    `;

		startConversation(
			{
				participanteId: musicalProduct.id,
				conteudo: message,
				produtoMusicalContratanteId: activeProduct?.id || null,
			},
			{
				// onSuccess: (data: Conversation) => {
				onSuccess: () => {
					toast.success("Conversa iniciada com sucesso!");
					// Navigate to band me messages tab
					void navigate({ to: "/band/me", search: { tab: "messages" } });
					handleClose();
				},
				onError: () => {
					toast.error("Erro ao iniciar conversa");
				},
			}
		);
	};

	const loadFilters = useCallback(async () => {
		try {
			setLoadingEventTypes(true);

			const [eventTypesResponse] = await Promise.all([
				filterService.getTiposEvento(),
			]);

			setEventTypes(eventTypesResponse ?? []);
		} catch (loadError) {
			console.error("Failed to load filters:", loadError);
			// TODO: Replace with proper toast system
			toast.error("Erro ao tentar carregar os tipos de eventos disponíveis");
		} finally {
			setLoadingEventTypes(false);
		}
	}, []);

	useEffect(() => {
		void loadFilters();
	}, [loadFilters]);

	useEffect(() => {
		if (selectedDate) {
			setValue("date", format(selectedDate, "yyyy-MM-dd"));
			setError("date", { type: "custom", message: "" });
		} else {
			setValue("date", "");
		}
	}, [selectedDate, setError, setValue]);

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-[705px] max-h-[85vh] overflow-auto">
				<div className="px-6 py-5 border-b border-gray-200">
					<DialogHeader>
						<DialogTitle className="text-xl font-semibold text-gray-900">
							Verificar disponibilidade
						</DialogTitle>

						<DialogDescription />
					</DialogHeader>
				</div>

				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="px-4 pb-5 space-y-6 max-h-[calc(100vh-200px)]">
						<div>
							<Label
								htmlFor="date"
								className="text-sm font-normal text-gray-500 block"
							>
								Selecione a data <span className="text-red-500">*</span>
							</Label>

							<DatePicker
								mode="check-availability"
								currentMonth={currentMonth}
								setCurrentMonth={setCurrentMonth}
								onSelectDate={setSelectedDate}
								events={agendaData}
							/>
						</div>

						<>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div>
									<div className="relative">
										<Calendar
											className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
											size={18}
										/>
										<Input
											type="date"
											{...register("date")}
											disabled
											className={`pl-10`}
										/>
									</div>
									{errors.date && (
										<p className="mt-1 text-sm text-red-600">
											{errors.date.message}
										</p>
									)}
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div>
									<Label className="text-sm font-medium block text-gray-700 cursor-pointer">
										Tipos de Eventos <span className="text-red-500">*</span>
									</Label>

									<Select
										label=""
										name="events"
										options={tipoEventoOptions}
										className="h-10"
										placeholder={
											loadingEventTypes ? "Carregando..." : "Selecionar evento"
										}
										disabled={selectedDate === null}
										selectedOptions={selectedEventTypes}
										setSelectedOptions={(options) => {
											setSelectedEventTypes(options);
											const values = (options || []).map((opt) =>
												Number(opt.value)
											);

											if (values.length > 0) {
												setError("eventType", { type: "custom", message: "" });
											}
											setValue("eventType", values);
										}}
									/>
									{errors.eventType && (
										<div className="text-red-500 text-sm">
											{errors.eventType.message}
										</div>
									)}
								</div>

								<div>
									<Label className="text-sm font-medium block text-gray-700 cursor-pointer pb-2">
										Início <span className="text-red-500">*</span>
									</Label>

									<div className="relative flex-1">
										<Clock
											className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
											size={18}
										/>
										<Input
											type="time"
											value={watch("startTime")}
											onChange={(event) => {
												const startTime = event.target.value;

												const [hours = 0, minutes = 0] = startTime
													.split(":")
													.map(Number);

												const startDate = new Date();
												startDate.setHours(hours, minutes, 0, 0);
												const endDate = new Date(
													startDate.getTime() + 120 * 60000
												);

												setValue("startTime", format(startDate, "HH:mm"));
												setValue("endTime", format(endDate, "HH:mm"));
											}}
											disabled={selectedDate === null}
											className={`pl-10 ${errors.startTime ? "border-red-500" : ""}`}
										/>
									</div>

									{errors.startTime && (
										<div className="text-red-500 text-sm">
											{errors.startTime.message}
										</div>
									)}
								</div>

								<div>
									<Label className="text-sm font-medium block text-gray-700 cursor-pointer pb-2">
										Fim <span className="text-red-500">*</span>
									</Label>
									<Input
										type="time"
										value={watch("endTime")}
										onChange={(event) => {
											const endTime = event.target.value;

											const [hours = 0, minutes = 0] = endTime
												.split(":")
												.map(Number);

											const endDate = new Date();
											endDate.setHours(hours, minutes, 0, 0);
											setValue("endTime", format(endDate, "HH:mm"));
										}}
										disabled={selectedDate === null}
										className={`flex-1 ${errors.endTime ? "border-red-500" : ""}`}
									/>

									{errors.endTime && (
										<div className="text-red-500 text-sm">
											{errors.endTime.message}
										</div>
									)}
								</div>
							</div>
							{/* Footer */}
							<div className="flex pb-4 max-xs:flex-col justify-center gap-2">
								<Button
									type="button"
									variant="secondary"
									onClick={() => {
										handleClose();
									}}
									className="px-4 py-2 w-full max-w-[400px]:w-[50%] md:w-[30%]"
								>
									Cancelar
								</Button>
								<Button
									type="submit"
									variant="primary"
									disabled={selectedDate === null}
									className="px-4 py-2 w-full max-w-[400px]:w-[50%] md:w-[30%]"
								>
									Verificar
								</Button>
							</div>
						</>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
};
