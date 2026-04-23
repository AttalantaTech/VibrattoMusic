import type { Dispatch, SetStateAction } from "react";
import { Dialog, DialogContent } from "../../../ui/dialog";
import { useEventForm } from "./useEventForm";
import { EventsList } from "./EventsList";
import { CreateEventForm } from "./CreateEventForm";
import type { AgendaEvent } from "../types";

type ModalMode = "list" | "create" | "edit";

export interface EventModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (event: AgendaEvent) => void;
	initialDate?: Date | null;
	initialStartTime?: string;
	initialEndTime?: string;
	selectedEventsDay?: Array<AgendaEvent> | null;
	mode: ModalMode;
	setMode: (mode: ModalMode) => void;
	onDelete?: (eventId: number) => Promise<void>;
	currentEvent?: AgendaEvent | null;
	setCurrentEvent?: Dispatch<SetStateAction<AgendaEvent | null>>;
}

export const EventModal = ({
	isOpen,
	onClose,
	onSubmit,
	selectedEventsDay,
	initialDate,
	initialStartTime,
	initialEndTime,
	mode,
	setMode,
	onDelete,
	currentEvent,
	setCurrentEvent,
}: EventModalProps) => {
	const { form, setQuickDuration, handleSubmitEvent, resetForm } = useEventForm(
		{
			initialDate,
			initialStartTime,
			initialEndTime,
			currentEvent: currentEvent || null,
			onSubmit,
			onClose,
		}
	);

	const handleClose = () => {
		if (setCurrentEvent) setCurrentEvent(null);
		resetForm();
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-lg p-0 gap-0 flex flex-col overflow-hidden">
				{mode === "list" ? (
					<EventsList
						date={initialDate ?? new Date()}
						events={selectedEventsDay ?? []}
						onEdit={(event) => {
							if (setCurrentEvent) setCurrentEvent(event);
							setMode("edit");
						}}
						onCreate={() => {
							if (setCurrentEvent) setCurrentEvent(null);
							setMode("create");
						}}
						onDelete={async (eventId) => {
							if (onDelete) await onDelete(eventId);
						}}
						onClose={handleClose}
					/>
				) : (
					<CreateEventForm
						form={form}
						onSubmit={(event) => {
							handleSubmitEvent(event);

							// if (setCurrentEvent) setCurrentEvent(null);
						}}
						setQuickDuration={setQuickDuration}
						onClose={handleClose}
						onCancel={() => {
							if (mode === "edit") {
								if (setCurrentEvent) setCurrentEvent(null);
								setMode("list");
							}
						}}
						currentEvent={currentEvent || null}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
};
