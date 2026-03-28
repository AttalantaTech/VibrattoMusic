import { useState, useEffect, useMemo } from "react";
import {
	Calendar,
	Clock,
	MapPin,
	Bell,
	Users,
	Music,
	Briefcase,
} from "lucide-react";
import { Button } from "../../ui/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../../ui/dialog";
import { Label } from "../../ui/Label/Label";
import { Input } from "../../ui/Input/Input";
import { Textarea } from "../../ui/Textarea/Textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../ui/Select/Select";
import { Checkbox } from "../../ui/Checkbox/Checkbox";
import type { CreateEventModalProps, AgendaEvent } from "./types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const CreateEventModal = ({
	isOpen,
	onClose,
	onSubmit,
	initialDate,
	initialType,
	initialStartTime,
	initialEndTime,
}: CreateEventModalProps) => {
	// Initialize with smart defaults
	const getDefaultTimes = () => {
		if (initialStartTime && initialEndTime) {
			return { startTime: initialStartTime, endTime: initialEndTime };
		}

		const now = new Date();
		const currentHour = now.getHours();

		// If clicking on a specific time slot
		if (initialStartTime) {
			const [hour = 0] = initialStartTime.split(":").map(Number);
			return {
				startTime: initialStartTime,
				endTime: `${String(hour + 1).padStart(2, "0")}:00`,
			};
		}

		// Smart time suggestion based on current time
		let suggestedStart = currentHour + 1;
		if (suggestedStart < 8) suggestedStart = 9; // Default to 9 AM if too early
		if (suggestedStart > 20) suggestedStart = 19; // Default to 7 PM if too late

		return {
			startTime: `${String(suggestedStart).padStart(2, "0")}:00`,
			endTime: `${String(suggestedStart + 1).padStart(2, "0")}:00`,
		};
	};

	const defaultTimes = getDefaultTimes();

	const [formData, setFormData] = useState({
		title: "",
		description: "",
		date: initialDate
			? format(initialDate, "yyyy-MM-dd")
			: format(new Date(), "yyyy-MM-dd"),
		startTime: defaultTimes.startTime,
		endTime: defaultTimes.endTime,
		location: "",
		type: initialType || "show",
		allDay: false,
		reminder: "15", // minutes before
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	const eventTypes = [
		{
			value: "show",
			label: "Show",
			color: "bg-primary-500",
			borderColor: "border-primary-500",
			textColor: "text-primary-600",
			bgLight: "bg-primary-50",
			icon: Music,
		},
		{
			value: "rehearsal",
			label: "Ensaio",
			color: "bg-green-500",
			borderColor: "border-green-500",
			textColor: "text-green-600",
			bgLight: "bg-green-50",
			icon: Users,
		},
		{
			value: "meeting",
			label: "Reunião",
			color: "bg-purple-500",
			borderColor: "border-purple-500",
			textColor: "text-purple-600",
			bgLight: "bg-purple-50",
			icon: Briefcase,
		},
		{
			value: "personal",
			label: "Pessoal",
			color: "bg-gray-500",
			borderColor: "border-gray-500",
			textColor: "text-gray-600",
			bgLight: "bg-gray-50",
			icon: Calendar,
		},
	];

	// Quick time options
	const quickTimeOptions = [
		{ label: "30 min", duration: 30 },
		{ label: "1h", duration: 60 },
		{ label: "1h30", duration: 90 },
		{ label: "2h", duration: 120 },
		{ label: "3h", duration: 180 },
	];

	// Common event templates
	const eventTemplates = useMemo(() => {
		return {
			show: {
				duration: 120, // 2 hours
				reminder: "1440", // 1 day before
			},
			rehearsal: {
				duration: 180, // 3 hours
				reminder: "60", // 1 hour before
			},
			meeting: {
				duration: 60, // 1 hour
				reminder: "15", // 15 minutes before
			},
			personal: {
				duration: 60,
				reminder: "15",
			},
		};
	}, []);

	useEffect(() => {
		setFormData({
			title: "",
			description: "",
			date: initialDate
				? format(initialDate, "yyyy-MM-dd")
				: format(new Date(), "yyyy-MM-dd"),
			startTime: defaultTimes.startTime,
			endTime: defaultTimes.endTime,
			location: "",
			type: initialType || "show",
			allDay: false,
			reminder: "15", // minutes before})
		});
	}, [defaultTimes.endTime, defaultTimes.startTime, initialDate, initialType]);

	// Update end time automatically when type changes
	useEffect(() => {
		const template = eventTemplates[formData.type];
		if (template && formData.startTime) {
			const [hours = 0, minutes = 0] = formData.startTime
				.split(":")
				.map(Number);
			const startDate = new Date();
			startDate.setHours(hours, minutes, 0, 0);
			const endDate = new Date(startDate.getTime() + template.duration * 60000);

			setFormData((previous) => ({
				...previous,
				endTime: format(endDate, "HH:mm"),
				reminder: template.reminder,
			}));
		}
	}, [eventTemplates, formData.startTime, formData.type]);

	const handleInputChange = (field: string, value: string | boolean) => {
		setFormData((previous) => ({
			...previous,
			[field]: value,
		}));

		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((previous) => ({
				...previous,
				[field]: "",
			}));
		}

		// Auto-adjust end time when start time changes
		if (field === "startTime" && value) {
			const [hours = 0, minutes = 0] = (value as string).split(":").map(Number);
			const duration = eventTemplates[formData.type].duration;
			const startDate = new Date();
			startDate.setHours(hours, minutes, 0, 0);
			const endDate = new Date(startDate.getTime() + duration * 60000);

			setFormData((previous) => ({
				...previous,
				endTime: format(endDate, "HH:mm"),
			}));
		}
	};

	// Set quick duration
	const setQuickDuration = (minutes: number) => {
		const [hours = 0, mins = 0] = formData.startTime.split(":").map(Number);
		const startDate = new Date();
		startDate.setHours(hours, mins, 0, 0);
		const endDate = new Date(startDate.getTime() + minutes * 60000);

		handleInputChange("endTime", format(endDate, "HH:mm"));
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.title.trim()) {
			newErrors["title"] = "Título é obrigatório";
		}

		if (!formData.date) {
			newErrors["date"] = "Data é obrigatória";
		}

		if (!formData.startTime) {
			newErrors["startTime"] = "Horário de início é obrigatório";
		}

		if (!formData.endTime) {
			newErrors["endTime"] = "Horário de fim é obrigatório";
		}

		// Validate time logic
		if (formData.startTime && formData.endTime) {
			const start = new Date(`2000-01-01T${formData.startTime}`);
			const end = new Date(`2000-01-01T${formData.endTime}`);

			if (end <= start) {
				newErrors["endTime"] = "Horário de fim deve ser posterior ao início";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleClose = () => {
		const defaultTimes = getDefaultTimes();
		setFormData({
			title: "",
			description: "",
			date: initialDate
				? format(initialDate, "yyyy-MM-dd")
				: format(new Date(), "yyyy-MM-dd"),
			startTime: defaultTimes.startTime,
			endTime: defaultTimes.endTime,
			location: "",
			type: "show",
			allDay: false,
			reminder: "15",
		});
		setErrors({});
		onClose();
	};

	const handleSubmit = (event_: React.FormEvent) => {
		event_.preventDefault();

		if (!validateForm()) {
			return;
		}

		// Parse date correctly to avoid timezone issues
		const [year = 0, month = 1, day = 1] = formData.date.split("-").map(Number);
		const eventDate = new Date(year, month - 1, day);

		const eventData: Partial<AgendaEvent> = {
			title: formData.title,
			description: formData.description,
			date: eventDate,
			startTime: formData.startTime,
			endTime: formData.endTime,
			location: formData.location,
			type: formData.type,
		};

		onSubmit(eventData);
		handleClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
				{/* Header */}
				<div className="px-6 py-5 border-b border-gray-200">
					<DialogHeader>
						<DialogTitle className="text-xl font-semibold text-gray-900">
							Novo Evento
						</DialogTitle>

						<DialogDescription />
					</DialogHeader>
				</div>

				<form onSubmit={handleSubmit}>
					<div className="px-6 py-5 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
						{/* Event Type Selection */}
						<div>
							<Label className="text-sm font-medium text-gray-700 mb-3 block">
								Tipo de evento
							</Label>
							<div className="grid grid-cols-2 gap-3">
								{eventTypes.map((type) => {
									const Icon = type.icon;
									const isSelected = formData.type === type.value;
									return (
										<button
											key={type.value}
											type="button"
											onClick={() => {
												handleInputChange("type", type.value);
											}}
											className={`relative flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
												isSelected
													? `${type.borderColor} ${type.bgLight}`
													: "border-gray-200 hover:border-gray-300 bg-white"
											}`}
										>
											<Icon
												size={20}
												className={
													isSelected ? type.textColor : "text-gray-400"
												}
											/>
											<span
												className={`font-medium ${isSelected ? type.textColor : "text-gray-700"}`}
											>
												{type.label}
											</span>
											{isSelected && (
												<div
													className={`absolute top-2 right-2 w-2 h-2 rounded-full ${type.color}`}
												/>
											)}
										</button>
									);
								})}
							</div>
						</div>

						{/* Title */}
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
								value={formData.title}
								onChange={(event) => {
									handleInputChange("title", event.target.value);
								}}
								className={errors["title"] ? "border-red-500" : ""}
								autoFocus
							/>
							{errors["title"] && (
								<p className="mt-1 text-sm text-red-600">{errors["title"]}</p>
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
										value={formData.date}
										onChange={(event) => {
											handleInputChange("date", event.target.value);
										}}
										className={`pl-10 ${errors["date"] ? "border-red-500" : ""}`}
									/>
								</div>
								{errors["date"] && (
									<p className="mt-1 text-sm text-red-600">{errors["date"]}</p>
								)}
							</div>

							<div>
								<Label className="text-sm font-medium text-gray-700 mb-2 block">
									Horário <span className="text-red-500">*</span>
								</Label>
								<div className="flex items-center gap-2">
									<div className="relative flex-1">
										<Clock
											className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
											size={18}
										/>
										<Input
											type="time"
											value={formData.startTime}
											onChange={(event) => {
												handleInputChange("startTime", event.target.value);
											}}
											className={`pl-10 ${errors["startTime"] ? "border-red-500" : ""}`}
										/>
									</div>
									<span className="text-gray-500">até</span>
									<Input
										type="time"
										value={formData.endTime}
										onChange={(event) => {
											handleInputChange("endTime", event.target.value);
										}}
										className={`flex-1 ${errors["endTime"] ? "border-red-500" : ""}`}
									/>
								</div>
								{(errors["startTime"] || errors["endTime"]) && (
									<p className="mt-1 text-sm text-red-600">
										{errors["startTime"] || errors["endTime"]}
									</p>
								)}
							</div>
						</div>

						{/* Quick duration buttons */}
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
									value={formData.location}
									onChange={(event) => {
										handleInputChange("location", event.target.value);
									}}
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
								value={formData.description}
								onChange={(event) => {
									handleInputChange("description", event.target.value);
								}}
								rows={3}
								className="resize-none"
							/>
						</div>

						{/* Advanced Options */}
						<div className="border-t pt-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* All day toggle */}
								<div className="flex items-center gap-3">
									<Checkbox
										id="allDay"
										checked={formData.allDay}
										onCheckedChange={(checked) => {
											handleInputChange("allDay", checked as boolean);
										}}
									/>
									<Label
										htmlFor="allDay"
										className="text-sm font-medium text-gray-700 cursor-pointer"
									>
										Evento de dia inteiro
									</Label>
								</div>

								{/* Reminder */}
								<div>
									<Label
										htmlFor="reminder"
										className="text-sm font-medium text-gray-700 mb-2 block"
									>
										Lembrete
									</Label>
									<Select
										value={formData.reminder}
										onValueChange={(value) => {
											handleInputChange("reminder", value);
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
								</div>
							</div>
						</div>
					</div>

					{/* Footer */}
					<div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
						<div className="text-sm text-gray-500">
							{formData.date && (
								<span>
									{format(parseISO(formData.date), "EEEE, d 'de' MMMM", {
										locale: ptBR,
									})}
								</span>
							)}
						</div>
						<div className="flex gap-3">
							<Button
								type="button"
								variant="outline"
								onClick={handleClose}
								className="px-4 py-2"
							>
								Cancelar
							</Button>
							<Button type="submit" variant="primary" className="px-4 py-2">
								Criar Evento
							</Button>
						</div>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
};
