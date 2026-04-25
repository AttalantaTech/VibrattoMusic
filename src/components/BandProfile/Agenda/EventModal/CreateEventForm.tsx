import { Calendar, MapPin, Clock } from "lucide-react";
import { Button } from "../../../ui/Button/Button";
import { Input } from "../../../ui/Input/Input";
import { Label } from "../../../ui/Label/Label";
import { Textarea } from "../../../ui/Textarea/Textarea";
import { Checkbox } from "../../../ui/Checkbox/Checkbox";
// import {
// 	Select,
// 	SelectContent,
// 	SelectItem,
// 	SelectTrigger,
// 	SelectValue,
// } from "../../../ui/Select/Select";
import type { UseFormReturn } from "react-hook-form";
import type { AgendaEvent } from "../types";
import type { EventForm } from "./useEventForm";
import {
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";

// Quick time options
const quickTimeOptions = [
	{ label: "30 min", duration: 30 },
	{ label: "1h", duration: 60 },
	{ label: "1h30", duration: 90 },
	{ label: "2h", duration: 120 },
	{ label: "3h", duration: 180 },
	{ label: "4h", duration: 240 },
];

interface CreateEventFormProps {
	form: UseFormReturn<EventForm>;
	onSubmit: (event: EventForm) => void;
	setQuickDuration: (minutes: number) => void;
	onCancel: () => void;
	onClose: () => void;
	currentEvent: AgendaEvent | null;
}

export const CreateEventForm = ({
	form,
	onSubmit,
	setQuickDuration,
	onCancel,
	onClose,
	currentEvent,
}: CreateEventFormProps) => {
	const { register, handleSubmit, watch, setValue } = form;

	const errors = form.formState.errors;

	const [hasDefineEventTime, setHasDefineEventTime] = useState(false);

	useEffect(() => {
		if (currentEvent && currentEvent?.startTime && currentEvent?.endTime) {
			setHasDefineEventTime(true);
		}
	}, [currentEvent]);

	const handleHasDefineEventTime = (state: boolean) => {
		setHasDefineEventTime(state);

		if (hasDefineEventTime) {
			setValue("startTime", "");
			setValue("endTime", "");
		} else {
			const hourPtBR = new Date().toLocaleString("pt-BR", {
				timeZone: "America/Sao_Paulo",
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			});

			const startTime = currentEvent?.startTime || hourPtBR;

			const [hours = 0, minutes = 0] = startTime.split(":").map(Number);

			const startDate = new Date();
			startDate.setHours(hours, minutes, 0, 0);
			const endDate =
				currentEvent?.endTime || new Date(startDate.getTime() + 120 * 60000);

			setValue("startTime", format(startDate, "HH:mm"));
			setValue("endTime", format(endDate, "HH:mm"));
		}
	};

	return (
		<>
			<div className="px-6 py-5 border-b border-gray-200">
				<DialogHeader>
					<DialogTitle className="text-xl font-semibold text-gray-900">
						{currentEvent ? "Edição de Evento" : "Novo Evento"}
					</DialogTitle>

					<DialogDescription />
				</DialogHeader>
			</div>

			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="px-6 py-5 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
					{/* TITLE */}
					<div>
						<Label
							htmlFor="title"
							className="text-sm font-medium text-gray-700 mb-2 block"
						>
							Título do evento <span className="text-red-500">*</span>
						</Label>
						<Input
							id="title"
							type="text"
							placeholder="Ex: Show no Teatro Municipal"
							className={errors["title"] ? "border-red-500" : ""}
							autoFocus
							{...register("title")}
						/>
						{errors.title && (
							<p className="mt-1 text-sm text-red-600">
								{errors.title.message}
							</p>
						)}
					</div>

					{/* Date and Time */}
					<div className="grid grid-cols-1 gap-4">
						<div>
							<Label
								htmlFor="date"
								className="text-sm font-medium text-gray-700 mb-2 block"
							>
								Data <span className="text-red-500">*</span>
							</Label>
							<div className="relative">
								<Calendar
									className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
									size={18}
								/>
								<Input
									id="date"
									type="date"
									disabled
									{...register("date")}
									className={`pl-10 ${errors.date ? "border-red-500" : ""}`}
								/>
							</div>
							{errors.date && (
								<p className="mt-1 text-sm text-red-600">
									{errors.date.message}
								</p>
							)}
						</div>

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
										Definir horário do Evento
									</Label>
								</div>

								{hasDefineEventTime && (
									<div className="flex items-center gap-2">
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
												className={`pl-10 ${errors.startTime ? "border-red-500" : ""}`}
											/>
										</div>
										<span className="text-gray-500">até</span>
										<Input
											type="time"
											{...register("endTime")}
											className={`flex-1 ${errors["endTime"] ? "border-red-500" : ""}`}
										/>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Quick duration buttons */}
					{hasDefineEventTime && (
						<div className="flex items-center gap-2 flex-wrap">
							<span className="text-sm text-gray-600">Duração:</span>
							{quickTimeOptions.map((option) => (
								<button
									key={option.duration}
									type="button"
									onClick={() => {
										setQuickDuration(option.duration);
									}}
									className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-colors"
								>
									{option.label}
								</button>
							))}
						</div>
					)}

					{/* Location */}
					<div>
						<Label
							htmlFor="location"
							className="text-sm font-medium text-gray-700 mb-2 block"
						>
							Local
						</Label>
						<div className="relative">
							<MapPin
								className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
								size={18}
							/>
							<Input
								id="location"
								type="text"
								placeholder="Ex: Teatro Municipal de São Paulo"
								{...register("location")}
								className="pl-10"
							/>
						</div>
					</div>

					{/* Description */}
					<div>
						<Label
							htmlFor="description"
							className="text-sm font-medium text-gray-700 mb-2 block"
						>
							Descrição
						</Label>
						<Textarea
							id="description"
							placeholder="Adicione detalhes sobre o evento..."
							{...register("description")}
							value={watch("description")}
							onChange={(event) => {
								setValue("description", event.target.value);
							}}
							rows={3}
							className="resize-none"
						/>
					</div>

					{/* Advanced Options */}
					<div className="border-t pt-4">
						<div className="grid grid-cols-1 md:grid-cols-1 gap-4">
							{/* Availability Other Events toggle */}
							<div className="flex flex-col gap-3">
								<label>
									<input
										className="cursor-pointer"
										type="radio"
										value="availability-other-events"
										{...register("availabilityOtherEvents")}
									/>
									<span className="pl-2 cursor-pointer">
										Disponibilidade para outros eventos neste dia
									</span>
								</label>

								<label>
									<input
										className="cursor-pointer"
										type="radio"
										value="no-availability-other-events"
										{...register("availabilityOtherEvents")}
									/>
									<span className="pl-2 cursor-pointer">
										Sem disponibilidade para outros eventos neste dia
									</span>
								</label>
							</div>

							{/* Reminder */}
							{/* <div>
								<Label
									htmlFor="reminder"
									className="text-sm font-medium text-gray-700 mb-2 block"
								>
									Lembrete
								</Label>
								<Select
									value={watch("reminder")}
									onValueChange={(value) => {
										setValue("reminder", value);
									}}
								>
									<SelectTrigger className="w-full">
										<div className="flex items-center gap-2">
											<Bell className="text-gray-400" size={18} />
											<SelectValue placeholder="Escolha um lembrete" />
										</div>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="0">Sem lembrete</SelectItem>
										<SelectItem value="15">15 minutos antes</SelectItem>
										<SelectItem value="30">30 minutos antes</SelectItem>
										<SelectItem value="60">1 hora antes</SelectItem>
										<SelectItem value="1440">1 dia antes</SelectItem>
									</SelectContent>
								</Select>
							</div> */}
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
					<div className="text-sm text-gray-500">
						{form.getValues().date && (
							<span>
								{format(parseISO(form.getValues().date), "EEEE, d 'de' MMMM", {
									locale: ptBR,
								})}
							</span>
						)}
					</div>
					<div className="flex gap-3">
						<Button
							type="button"
							variant="secondary"
							onClick={() => {
								if (currentEvent) {
									onCancel();
								} else {
									onClose();
								}
							}}
							className="px-4 py-2"
						>
							Cancelar
						</Button>
						<Button type="submit" variant="primary" className="px-4 py-2">
							{currentEvent ? "Salvar" : "Criar Evento"}
						</Button>
					</div>
				</div>
			</form>
		</>
	);
};
