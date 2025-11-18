import { useState, useEffect } from "react";
import type { EventDetailsModalProps, AgendaEvent } from "./types";
import { eventTypeConfig } from "./types";
import { Switch } from "../../ui/switch";
import { Button } from "../../ui/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "../../ui/dialog";
import {
	Clock,
	MapPin,
	Edit3,
	Trash2,
	X,
	Save,
	AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const EventDetailsModal = ({
	event,
	isOpen,
	onClose,
	onUpdate,
	onDelete,
	readOnly = false,
}: EventDetailsModalProps) => {
	const [isEditing, setIsEditing] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [editedEvent, setEditedEvent] = useState<AgendaEvent | null>(null);
	const [availableForSameDay, setAvailableForSameDay] = useState(false);

	useEffect(() => {
		if (event) {
			setEditedEvent({ ...event });
			setIsEditing(false);
			setShowDeleteConfirm(false);
		}
	}, [event]);

	if (!event || !editedEvent) return null;

	const eventConfig = eventTypeConfig[event.type];

	const handleSave = () => {
		if (onUpdate && editedEvent) {
			onUpdate(editedEvent);
			setIsEditing(false);
		}
	};

	const handleDelete = () => {
		if (onDelete) {
			onDelete(event.id);
			onClose();
		}
	};

	const handleCancel = () => {
		setEditedEvent({ ...event });
		setIsEditing(false);
	};

	const formatEventDate = () => {
		return format(event.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<div className="flex items-start justify-between">
						<div className="flex items-start gap-3">
							<div
								className="w-4 h-4 rounded mt-1"
								style={{ backgroundColor: eventConfig.color }}
							/>
							<div className="flex-1">
								{isEditing ? (
									<input
										type="text"
										value={editedEvent.title}
										onChange={(event) => {
											setEditedEvent({
												...editedEvent,
												title: event.target.value,
											});
										}}
										className="text-xl font-semibold w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
										autoFocus
									/>
								) : (
									<DialogTitle className="text-xl font-semibold text-gray-900">
										{event.title}
									</DialogTitle>
								)}
								<p className="text-sm text-gray-500 mt-1">
									{eventConfig.label}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							{!readOnly && (
								<>
									{!isEditing ? (
										<button
											onClick={() => {
												setIsEditing(true);
											}}
											className="p-2 hover:bg-gray-100 rounded-full transition-colors"
											title="Editar evento"
										>
											<Edit3 className="w-4 h-4 text-gray-600" />
										</button>
									) : (
										<button
											onClick={handleCancel}
											className="p-2 hover:bg-gray-100 rounded-full transition-colors"
											title="Cancelar edição"
										>
											<X className="w-4 h-4 text-gray-600" />
										</button>
									)}
									<button
										onClick={() => {
											setShowDeleteConfirm(true);
										}}
										className="p-2 hover:bg-gray-100 rounded-full transition-colors"
										title="Excluir evento"
									>
										<Trash2 className="w-4 h-4 text-gray-600" />
									</button>
								</>
							)}
						</div>
					</div>
				</DialogHeader>

				{/* Delete Confirmation */}
				{showDeleteConfirm && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
						<div className="flex items-start gap-3">
							<AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
							<div className="flex-1">
								<p className="text-sm font-medium text-red-800">
									Tem certeza que deseja excluir este evento?
								</p>
								<p className="text-sm text-red-600 mt-1">
									Esta ação não pode ser desfeita.
								</p>
								<div className="flex gap-2 mt-3">
									<button
										onClick={handleDelete}
										className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
									>
										Excluir
									</button>
									<button
										onClick={() => {
											setShowDeleteConfirm(false);
										}}
										className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded border hover:bg-gray-50 transition-colors"
									>
										Cancelar
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Event Details */}
				<div className="py-4 space-y-4">
					{/* Date and Time */}
					<div className="flex items-start gap-3">
						<Clock className="w-5 h-5 text-gray-400 mt-0.5" />
						<div className="flex-1">
							<p className="text-sm font-medium text-gray-900">
								{formatEventDate()}
							</p>
							{isEditing ? (
								<div className="flex gap-2 mt-2">
									<input
										type="time"
										value={editedEvent.startTime}
										onChange={(event) => {
											setEditedEvent({
												...editedEvent,
												startTime: event.target.value,
											});
										}}
										className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
									/>
									<span className="text-sm text-gray-500 self-center">até</span>
									<input
										type="time"
										value={editedEvent.endTime}
										onChange={(event) => {
											setEditedEvent({
												...editedEvent,
												endTime: event.target.value,
											});
										}}
										className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
									/>
								</div>
							) : (
								<p className="text-sm text-gray-600">
									{event.startTime} - {event.endTime}
								</p>
							)}
						</div>
					</div>

					{/* Location */}
					{(event.location || isEditing) && (
						<div className="flex items-start gap-3">
							<MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
							<div className="flex-1">
								{isEditing ? (
									<input
										type="text"
										value={editedEvent.location || ""}
										onChange={(event) => {
											setEditedEvent({
												...editedEvent,
												location: event.target.value,
											});
										}}
										placeholder="Adicionar local"
										className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
									/>
								) : (
									<p className="text-sm text-gray-600">{event.location}</p>
								)}
							</div>
						</div>
					)}

					{/* Description */}
					{(event.description || isEditing) && (
						<div className="pt-2">
							{isEditing ? (
								<textarea
									value={editedEvent.description || ""}
									onChange={(event) => {
										setEditedEvent({
											...editedEvent,
											description: event.target.value,
										});
									}}
									placeholder="Adicionar descrição"
									rows={3}
									className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
								/>
							) : (
								<p className="text-sm text-gray-600">{event.description}</p>
							)}
						</div>
					)}

					{/* Toggle for availability */}
					<div className="pt-2 border-t">
						<div className="flex items-center space-x-2">
							<Switch
								id="available-same-day"
								checked={availableForSameDay}
								onCheckedChange={setAvailableForSameDay}
							/>
							<label
								htmlFor="available-same-day"
								className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								Disponível para negociação de shows com agendamento no mesmo dia
							</label>
						</div>
					</div>
				</div>

				{/* Footer Actions */}
				{isEditing && (
					<DialogFooter>
						<Button variant="outline" onClick={handleCancel}>
							Cancelar
						</Button>
						<Button
							variant="primary"
							onClick={handleSave}
							className="flex items-center gap-2"
						>
							<Save className="w-4 h-4" />
							Salvar alterações
						</Button>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
};
