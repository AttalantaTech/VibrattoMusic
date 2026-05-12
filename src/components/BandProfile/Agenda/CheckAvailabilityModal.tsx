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
import { Calendar, Clock, MapPin } from "lucide-react";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import type { FilterOption, MusicalProduct } from "@/api/types";
import { filterService } from "@/api";
import { toast } from "sonner";
import { useSchedule } from "@/hooks/useMusicalProducts";
import { useStartConversation } from "@/hooks/useMessaging";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { useNavigate } from "@tanstack/react-router";
import { TIME_ZONE, toBR } from "@/utils";
import { formatInTimeZone } from "date-fns-tz";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";

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
	const [currentMonth, setCurrentMonth] = useState(toBR(new Date()));
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
	const { mutate: startConversation, isPending } = useStartConversation();

	const [hasDefineEventTime, setHasDefineEventTime] = useState(false);

	const checkAvailabilityValidationSchema = z
		.object({
			date: z.string().min(1, "Selecione uma data disponível"),
			eventType: z.array(z.number()).min(1, "Selecione um tipo de evento"),
			startTime: z.string().min(4, "Preencha a data de início do evento"),
			location: z.string().trim().min(3, "Informe a localização"),
		})
		.superRefine((data, context) => {
			const requiredFields = [
				{ key: "startTime", label: "Horário inicial" },
			] as const;

			requiredFields.forEach(({ key, label }) => {
				if (!data[key] || data[key]?.trim() === "" || data[key]?.length < 4) {
					context.addIssue({
						path: [key],
						message: `${label} é obrigatório`,
						code: z.ZodIssueCode.custom,
					});
				}
			});
		});

	type CheckAvailabilityForm = z.infer<
		typeof checkAvailabilityValidationSchema
	>;

	const handleDefaultTime = (): { startTime: string } => {
		const startTime = new Date().toLocaleString("pt-BR", {
			timeZone: "America/Sao_Paulo",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});

		const [hours = 0, minutes = 0] = startTime.split(":").map(Number);

		const startDate = new Date();
		startDate.setHours(hours, minutes, 0, 0);

		return {
			startTime: format(startDate, "HH:mm"),
		};
	};

	const { startTime } = handleDefaultTime();

	const defaultValues: CheckAvailabilityForm = {
		date: "",
		eventType: [],
		startTime,
		location: "",
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
		 🎈 Local: ${formData.location ?? ""} 
     ⏰ Horário: ${hasDefineEventTime ? `${formData.startTime}` : `Sem horário definido`} 
    `;

		startConversation(
			{
				participanteId: musicalProduct.id,
				conteudo: message,
				senderType: activeProduct?.id ? 2 : 1,
				produtoMusicalContratanteId: activeProduct?.id || null,
			},
			{
				// onSuccess: (data: Conversation) => {
				onSuccess: () => {
					toast.success("Orçamento Solicitado.");
					// Navigate to band me messages tab
					void navigate({ to: "/band/me", search: { tab: "messages" } });
					handleClose();
				},
				onError: () => {
					toast.error("Erro ao solicitar orçamento");
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

	const handleHasDefineEventTime = (state: boolean) => {
		setHasDefineEventTime(state);

		if (hasDefineEventTime) {
			setValue("startTime", "");
		} else {
			const hourPtBR = new Date().toLocaleString("pt-BR", {
				timeZone: "America/Sao_Paulo",
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			});

			const startTime = hourPtBR;

			const [hours = 0, minutes = 0] = startTime.split(":").map(Number);

			const startDate = new Date();
			startDate.setHours(hours, minutes, 0, 0);

			setValue("startTime", format(startDate, "HH:mm"));
		}
	};

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

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
									<Label
										htmlFor="location"
										className="text-sm font-medium text-gray-700 mb-2 block"
									>
										Local
									</Label>

									<div className="relative flex-1">
										<MapPin
											className="absolute left-3 top-1/3 transform -translate-y-1/2 text-gray-400"
											size={18}
										/>
										<Input
											id="location"
											type="text"
											placeholder="Ex: Teatro Municipal de São Paulo"
											{...register("location")}
											className={`pl-10 ${errors.location ? "border-red-500" : ""}`}
										/>

										{errors.location && (
											<p className="mt-1 text-sm text-red-600">
												{errors.location.message}
											</p>
										)}
									</div>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-4">
								<div>
									<Label className="text-sm font-medium text-gray-700 mb-2 block">
										Horário
									</Label>

									<div className="grid grid-cols-1 md:grid-cols-1 gap-4">
										<div className="flex items-center gap-3">
											<Checkbox
												id="hasDefineEventTime"
												checked={hasDefineEventTime}
												onCheckedChange={(checked) => {
													handleHasDefineEventTime(Boolean(checked));
												}}
											/>
											<Label
												htmlFor="availabilityOtherEvents"
												className="text-sm font-medium text-gray-700 cursor-pointer"
											>
												Definir horário do inicio do show
											</Label>
										</div>
									</div>
								</div>
							</div>

							{hasDefineEventTime && (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

												setValue("startTime", format(startDate, "HH:mm"));
											}}
											className={`pl-10 ${errors.startTime ? "border-red-500" : ""}`}
										/>

										{errors.startTime && (
											<div className="text-red-500 text-sm">
												{errors.startTime.message}
											</div>
										)}
									</div>
								</div>
							)}

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
									disabled={selectedDate === null || isPending}
									className="px-4 py-2 w-full max-w-[400px]:w-[50%] md:w-[30%]"
								>
									{isPending ? "Carregando..." : "Verificar"}
								</Button>
							</div>
						</>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
};
