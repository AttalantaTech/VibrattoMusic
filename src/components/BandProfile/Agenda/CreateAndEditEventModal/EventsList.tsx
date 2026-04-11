import { Edit, Trash2 } from "lucide-react";
import { Button } from "../../../ui/Button/Button";
import type { Dispatch, SetStateAction } from "react";
import type { AgendaEvent } from "../types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { sortByDate } from "@/utils/sortByDate";

interface EventsListProps {
	date: Date;
	events: Array<AgendaEvent> | null;
	onEdit: Dispatch<SetStateAction<AgendaEvent | null>>;
	onCreate: () => void;
	onDelete: (eventId: number) => Promise<void>;
	onClose: () => void;
}
export const EventsList = ({
	date,
	events,
	onEdit,
	onCreate,
	onDelete,
	onClose,
}: EventsListProps) => {
	const formatDate = (date: Date) => {
		return format(date, "dd/MM/yyyy", { locale: ptBR });
	};

	return (
		<div className="flex flex-col justify-end px-6 pt-6 border-b border-gray-200">
			<DialogHeader>
				<DialogTitle className="text-xl font-semibold text-gray-900 mb-6">
					Eventos para{" "}
					{date && (
						<span>
							{format(date, "eeee, d 'de' MMMM", {
								locale: ptBR,
							})}
							.
						</span>
					)}
				</DialogTitle>

				<DialogDescription />
			</DialogHeader>

			{(!events || events.length === 0) && (
				<div className="text-center text-gray-500 italic py-6">
					Nenhum evento para este dia.
				</div>
			)}

			{/*  Event list*/}
			{events && events.length > 0 && (
				<div className="flex-1 overflow-y-auto">
					<div className="space-y-3 max-h-[60vh]">
						{[...(events ?? [])]
							.sort((a, b) => {
								return sortByDate({
									valueA: new Date(a.date),
									valueB: new Date(b.date),
									startTimeA: a.startTime ?? "",
									startTimeB: b.startTime ?? "",
								});
							})
							.map((event) => (
								<div
									key={event.id || `${event.title}-${event.startTime}`}
									className="border-l-4 border-primary-500 text-primary-500 bg-primary-50 p-3 min-h-32 rounded-lg flex justify-between items-start"
								>
									<div>
										<div className="font-medium">{event.title}</div>
										<div className="text-sm">
											{formatDate(event.date)} •{" "}
											{event.startTime && event.endTime ? (
												`${event.startTime} - 
											${event.endTime}`
											) : (
												<span className="font-light italic">
													Sem horário definido
												</span>
											)}
										</div>
									</div>

									<div className="flex gap-4">
										<button
											className="text-gray-500 hover:text-gray-700"
											onClick={() => {
												onEdit(event);
											}}
										>
											<Edit size={20} />
										</button>

										<button
											className="text-gray-500 hover:text-gray-700"
											onClick={async () => {
												await onDelete(event.id);
											}}
										>
											<Trash2 size={20} />
										</button>
									</div>
								</div>
							))}
					</div>
				</div>
			)}

			{/* Footer */}

			<div className="flex justify-end gap-3 py-6">
				<Button
					type="button"
					variant="secondary"
					onClick={() => {
						onClose();
					}}
					className="px-4 py-2"
				>
					Cancelar
				</Button>
				<Button
					variant="primary"
					className="px-4 py-2"
					onClick={() => {
						onCreate();
					}}
				>
					Criar Evento
				</Button>
			</div>
		</div>
	);
};
