import { useState, useEffect, useCallback } from "react";
import type { AgendaEvent, ModalMode } from "../BandProfile/Agenda/types";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { useSaveSchedule, useSchedule } from "@/hooks/useMusicalProducts";
import { CalendarCustom } from "../Calendar/CalendarCustom";
import { mapAgendaEventToFormData } from "@/utils/mapAgendaEventToFormData";
import type { CommitmentAPI, MusicalProductSchedule } from "@/api/types";
import { format } from "date-fns";
import { EventModal } from "../BandProfile/Agenda/CreateAndEditEventModal/EventModal";
import { toast } from "sonner";

// Define styles consistent with modern interface pattern
const styles = {
	titleText: "font-bold text-gray-900 text-xl sm:text-2xl",
	subtitleText: "font-semibold text-gray-600 text-sm sm:text-lg",
	sectionContainer: "bg-white",
	sectionTitle: "flex items-center gap-2 mb-3 sm:mb-4",
	sectionIcon: "text-primary-600 flex-shrink-0",
};

export const AgendaComponent = () => {
	const { activeProduct } = useMusicalProductStore();
	const saveScheduleMutation = useSaveSchedule();

	const [currentEvent, setCurrentEvent] = useState<AgendaEvent | null>(null);
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [modalMode, setModalMode] = useState<ModalMode>("list");
	const [events, setEvents] = useState<Array<AgendaEvent>>([]);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [showEventModal, setShowEventModal] = useState(false);
	const [selectedEventsDay, setSelectedEventsDay] =
		useState<Array<AgendaEvent> | null>(null);

	const { data: agendaData } = useSchedule(
		activeProduct?.id ?? 0,
		currentMonth
	);

	const loadSchedule = useCallback(() => {
		if (!activeProduct?.id) return;

		try {
			if (Array.isArray(agendaData)) {
				setEvents(mapAgendaEventToFormData(agendaData));
			} else {
				setEvents([]);
			}
		} catch (error) {
			console.error(error);
			setEvents([]);
		}
	}, [agendaData, activeProduct?.id]);

	const mapEventsToApiFormat = (
		eventData: AgendaEvent
	): MusicalProductSchedule => {
		const currentEvents = [eventData];
		const oldEvents = selectedEventsDay ?? [];

		const mergedEvents = [
			// It retains the old ones that haven't been replaced.
			...oldEvents.filter((old) => {
				return !currentEvents.some(
					(current) => current.id === old.id && current.id !== 0
				);
			}),

			// adding new events + updated
			...currentEvents,
		];

		const mergedMap = new Map<number, any>();

		// Adding past events
		oldEvents.forEach((event) => {
			mergedMap.set(Number(event.id), event);
		});

		const commitments: Array<CommitmentAPI> = mergedEvents
			.sort((a, b) => a.date.getTime() - b.date.getTime())
			.map((event) => ({
				id: event.id,
				titulo: event.title.trim(),
				descricao: event.description?.trim() || "",
				localizacao: event.location ?? "",
				data: format(event.date, "yyyy-MM-dd"),
				horaInicio: event.startTime || null,
				horaFim: event.endTime || null,
				disponibilidadeOutrosEventos: event.availabilityOtherEvents,
			}));

		// Convert events to API format
		const scheduleData: MusicalProductSchedule = {
			id: activeProduct?.id || 0,
			inicioCalendario:
				commitments.length > 0
					? commitments.at(0)?.data
					: format(new Date(), "yyyy-MM-dd"),
			finalCalendario:
				commitments.length > 0
					? commitments.at(-1)?.data
					: format(new Date(), "yyyy-MM-dd"),
			compromissos: commitments,
		};

		return scheduleData;
	};

	const handleSubmit = async (eventData: AgendaEvent) => {
		if (!activeProduct?.id) {
			toast.error("Perfil Profissional não encontrado!");
			return;
		}

		const agendaData = mapEventsToApiFormat(eventData);

		await saveScheduleMutation
			.mutateAsync({
				productId: activeProduct?.id,
				scheduleData: agendaData,
			})
			.then(() => {
				setCurrentEvent(null);

				const handleClose = () => {
					setShowEventModal(false);
					setSelectedEventsDay(null);
					setSelectedDate(null);
				};
				if (modalMode === "create") {
					toast.success("Evento criado com sucesso!");
					handleClose();
				} else if (modalMode === "edit") {
					toast.success("Evento editado com sucesso!");
					handleClose();
				}
			})
			.catch((error: any) => {
				if (
					error?.name === "VibrattoApiError" ||
					error?.code === "INVALID_REQUEST"
				) {
					const errorValidation = error.data;
					const error_ = errorValidation[0] || {};

					const errorMessage = error_.errorMessage;

					if (errorMessage === "ConflitoHorario") {
						toast.error(
							"Não foi possível criar um novo evento na agenda. Você possui conflito de horário entre os eventos deste dia",
							{ duration: 10000 }
						);
					} else {
						toast.error("Ocorreu um erro. Tente novamente mais tarde!");
					}

					return;
				}
				toast.error("Ocorreu um erro. Tente novamente mais tarde!");
			});
	};

	const handleDelete = async (eventId: number) => {
		if (!activeProduct?.id) {
			toast.error("Perfil Profissional não encontrado!");
			return;
		}

		const selectedEvent = selectedEventsDay
			? selectedEventsDay.filter((event) => event.id !== eventId)
			: [];

		const eventDeleted = selectedEventsDay
			? selectedEventsDay.find((event) => event.id === eventId)
			: undefined;

		const mergedMap = new Map<number, any>();

		// Adding past events
		selectedEvent.forEach((event) => {
			mergedMap.set(Number(event.id), event);
		});

		if (selectedEvent) {
			const commitments: Array<CommitmentAPI> = selectedEvent
				.sort((a, b) => a.date.getTime() - b.date.getTime())
				.map((event) => ({
					id: event.id,
					titulo: event.title.trim(),
					descricao: event.description?.trim() || "",
					data: format(event.date, "yyyy-MM-dd"),
					horaInicio: event.startTime || null,
					horaFim: event.endTime || null,
					localizacao: event.location || "",
					disponibilidadeOutrosEventos: event.availabilityOtherEvents,
				}));

			// Convert events to API format
			const agendaData: MusicalProductSchedule = {
				id: activeProduct?.id ?? 0,
				inicioCalendario: eventDeleted?.date
					? format(eventDeleted?.date, "yyyy-MM-dd")
					: format(new Date(), "yyyy-MM-dd"),
				finalCalendario: eventDeleted?.date
					? format(eventDeleted?.date, "yyyy-MM-dd")
					: format(new Date(), "yyyy-MM-dd"),
				compromissos: commitments,
			};

			await saveScheduleMutation
				.mutateAsync({
					productId: activeProduct?.id,
					scheduleData: agendaData,
				})
				.then(() => {
					toast.success("Evento exculído com sucesso!");

					const newAgendaData: Array<AgendaEvent> = commitments.map(
						(commitment) => {
							return {
								id: commitment.id,
								title: commitment.titulo,
								description: commitment.descricao,
								date: new Date(
									`${commitment.data}${commitment.horaInicio ? `T${commitment.horaFim}` : "T00:00"}`
								),
								startTime: commitment.horaInicio,
								endTime: commitment.horaFim,
								location: commitment.descricao,
								availabilityOtherEvents:
									commitment.disponibilidadeOutrosEventos,
							};
						}
					);

					setSelectedEventsDay(newAgendaData);
				})
				.catch((error: any) => {
					if (
						error?.name === "VibrattoApiError" ||
						error?.code === "INVALID_REQUEST"
					) {
						const errorValidation = error.data;
						const error_ = errorValidation[0] || {};

						const errorMessage = error_.errorMessage;

						if (errorMessage === "ConflitoHorario") {
							toast.error(
								"Não foi possível editar o evento. Você possui conflito de horário entre os eventos deste dia",
								{ duration: 10000 }
							);
						} else {
							toast.error("Ocorreu um erro. Tente novamente mais tarde!");
						}

						return;
					}
					toast.error("Ocorreu um erro. Tente novamente mais tarde!");
				});
		}
	};

	useEffect(() => {
		loadSchedule();
	}, [loadSchedule]);

	return (
		<div className="flex justify-center w-full">
			<div className="flex flex-col justify-center items-center w-full gap-4 lg:gap-6  px-1 sm:px-0">
				{/* Section of the Agenda */}
				<div>
					<div className={styles.sectionTitle}>
						<h2 className={styles.titleText}>Agenda</h2>
					</div>
					<p className="text-gray-600 text-xs sm:text-base mb-8 sm:mb-10 leading-relaxed">
						Adicione eventos à sua agenda. Os contratantes poderão verificar sua
						disponibilidade através dos indicadores de "Ocupado", mas os
						detalhes dos eventos permanecerão privados.
					</p>

					{/* Agenda Component */}
					<div className=" border border-gray-200 rounded-lg w-full">
						<CalendarCustom
							currentMonth={currentMonth}
							setCurrentMonth={setCurrentMonth}
							onSelectDate={setSelectedDate}
							onHasDateForDay={(eventsOfDay) => {
								const hasEvents = eventsOfDay && eventsOfDay.length > 0;

								setSelectedEventsDay(hasEvents ? eventsOfDay : null);

								if (hasEvents) {
									setModalMode("list");
								} else {
									setModalMode("create");
								}

								setShowEventModal(true);
							}}
							events={events}
						/>
					</div>
				</div>
			</div>

			<EventModal
				isOpen={showEventModal}
				mode={modalMode}
				setMode={setModalMode}
				onClose={() => {
					setShowEventModal(false);
					setSelectedEventsDay(null);
					setSelectedDate(null);
				}}
				selectedEventsDay={selectedEventsDay}
				onSubmit={handleSubmit}
				onDelete={handleDelete}
				initialDate={selectedDate}
				currentEvent={currentEvent}
				setCurrentEvent={setCurrentEvent}
			/>
		</div>
	);
};
