import { useState } from "react";
import { AgendaComponent } from "../../Agenda/AgendaComponent";
import type { AgendaEvent } from "./types";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

interface AgendaTabProps {
	productId?: number;
}

export const AgendaTab = ({ productId }: AgendaTabProps) => {
	const [events, setEvents] = useState<Array<AgendaEvent>>([]);

	// Get active product from centralized hook
	const { activeProduct } = useMusicalProductStore();

	// Use prop productId if provided, otherwise use active product
	const produtoMusicalId =
		productId || (activeProduct?.id ? Number(activeProduct.id) : null);

	// produtoMusicalId is ready for use when needed

	const handleEventClick = () => {
		// Handle event click
	};

	const handleEventCreate = (eventData: Partial<AgendaEvent>) => {
		const newEvent: AgendaEvent = {
			id: Math.max(...events.map((event) => Number(event.id)), 0) + 1,
			title: eventData.title ?? "Novo Evento",
			description: eventData.description ?? "",
			date: eventData.date ?? new Date(),
			startTime: eventData.startTime ?? "09:00",
			endTime: eventData.endTime ?? "10:00",
			location: eventData.location ?? "",
			type: eventData.type ?? "personal",
			status: eventData.status ?? "pending",
		};

		setEvents((previous) => [...previous, newEvent]);
	};

	const handleEventUpdate = (updatedEvent: AgendaEvent) => {
		setEvents((previous) =>
			previous.map((event) =>
				event.id === updatedEvent.id ? updatedEvent : event
			)
		);
	};

	const handleEventDelete = (eventId: number) => {
		setEvents((previous) => previous.filter((event) => event.id !== eventId));
	};

	return (
		<div className="w-full h-full">
			<AgendaComponent
				events={events}
				onEventsChange={setEvents}
				onEventClick={handleEventClick}
				onEventCreate={handleEventCreate}
				onEventUpdate={handleEventUpdate}
				onEventDelete={handleEventDelete}
				initialDate={new Date()}
				readOnly={false}
				allowDragAndDrop
				showCreateButton
				viewMode="week"
				simpleMode={false}
				produtoMusicalId={produtoMusicalId || undefined}
				enableApiSync
			/>
		</div>
	);
};
