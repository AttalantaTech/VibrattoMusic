import { useState, useEffect, useCallback } from "react";
import type { AgendaEvent, ModalMode } from "../BandProfile/Agenda/types";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { useSaveSchedule, useSchedule } from "@/hooks/useMusicalProducts";
import { CalendarCustom } from "../Calendar/CalendarCustom";
import { mapAgendaEventToFormData } from "@/utils/mapAgendaEventToFormData";
import type { CommitmentAPI, MusicalProductSchedule } from "@/api/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock } from "lucide-react";
import { musicalProductService } from "@/api";
import { Button } from "@/components/ui/Button/Button";
import {
	usePreReservations,
	type PreReservation,
} from "@/hooks/usePreReservations";
import { proposalStatusLabel } from "@/components/BandProfile/Proposals/components/ProposalStatusCard/types";
import { EventModal } from "../BandProfile/Agenda/EventModal/EventModal";
import { toast } from "sonner";
import {
	calculateDuration,
	calculateEndTime,
} from "../BandProfile/Agenda/utils";

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

	const preReservations = usePreReservations(activeProduct?.id);

	// Opens "Novo Evento" filled with the proposal, on top of that day's other
	// events: saving sends the whole day, so they must be loaded first or the
	// save would drop them
	const confirmPreReservation = async (reservation: PreReservation) => {
		if (!activeProduct?.id) return;

		let dayEvents: Array<AgendaEvent>;
		try {
			const schedule = await musicalProductService.getScheduleRange(
				activeProduct.id,
				reservation.date,
				reservation.date
			);
			dayEvents = mapAgendaEventToFormData(schedule).filter(
				(event) => format(event.date, "yyyy-MM-dd") === reservation.date
			);
		} catch {
			toast.error("Não foi possível carregar a agenda deste dia.");
			return;
		}

		const { proposal } = reservation;
		const startTime = proposal.horaInicio?.slice(0, 5) ?? "";
		const date = parseISO(reservation.date);

		setCurrentMonth(date);
		setSelectedDate(date);
		setSelectedEventsDay(dayEvents.length > 0 ? dayEvents : null);
		setCurrentEvent({
			id: 0,
			title: `${proposal.tipoEvento?.nome ?? "Evento"} · ${reservation.client}`,
			description: `Reserva da proposta nº ${proposal.id}`,
			date: parseISO(`${reservation.date}T${startTime || "00:00"}`),
			startTime,
			endTime: proposal.horaFim?.slice(0, 5) ?? "",
			location: proposal.local ?? "",
			// The date is sold: no other bookings that day
			availabilityOtherEvents: false,
		});
		setModalMode("create");
		setShowEventModal(true);
	};

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
			.map((event) => {
				return {
					id: event.id,
					titulo: event.title.trim(),
					descricao: event.description?.trim() || "",
					localizacao: event.location ?? "",
					data: format(event.date, "yyyy-MM-dd"),
					horaInicio: event.startTime || null,
					duracao: calculateDuration(event.startTime, event.endTime),
					disponibilidadeOutrosEventos: event.availabilityOtherEvents,
				};
			});

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
					duracao: calculateDuration(event.startTime, event.endTime),
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
									`${commitment.data}${commitment.horaInicio ? `T${commitment.horaInicio}` : "T00:00"}`
								),
								startTime: commitment.horaInicio,
								endTime: calculateEndTime(
									commitment.horaInicio,
									commitment.duracao
								),
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
				<div className="w-full">
					<div className={styles.sectionTitle}>
						<h2 className={styles.titleText}>Agenda</h2>
					</div>
					<p className="text-gray-600 text-xs sm:text-base mb-8 sm:mb-10 leading-relaxed">
						Adicione eventos à sua agenda. Os contratantes só poderão visualizar
						a disponibilidade da agenda clicando em uma data por vez.
					</p>

					{preReservations.length > 0 ? (
						<div className="mb-6 rounded-lg border border-[#B2DDFF] bg-[#EFF8FF] p-4">
							<p className="flex items-center gap-2 font-semibold text-[#175CD3]">
								<CalendarClock size={20} className="shrink-0" />
								{preReservations.length === 1
									? "1 data pré-reservada aguardando confirmação"
									: `${preReservations.length} datas pré-reservadas aguardando confirmação`}
							</p>
							<p className="mt-1 text-sm text-gray-700">
								Estas datas têm proposta aceita. Confirme a reserva para
								bloquear a agenda: até lá, outros contratantes ainda veem o dia
								como disponível.
							</p>
							<ul className="mt-3 divide-y divide-[#D1E9FF] rounded-md bg-white">
								{preReservations.map((reservation) => (
									<li
										key={reservation.proposal.id}
										className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
									>
										<div className="min-w-0 text-sm">
											<p className="font-medium text-gray-900">
												{format(
													parseISO(reservation.date),
													"dd/MM/yyyy (EEEE)",
													{ locale: ptBR }
												)}
											</p>
											<p className="truncate text-gray-600">
												{reservation.proposal.tipoEvento?.nome} ·{" "}
												{reservation.client} ·{" "}
												{proposalStatusLabel(reservation.proposal.status.nome)}
											</p>
										</div>
										<Button
											size="sm"
											variant="primary"
											className="shrink-0"
											onClick={() => {
												void confirmPreReservation(reservation);
											}}
										>
											Confirmar reserva
										</Button>
									</li>
								))}
							</ul>
						</div>
					) : null}

					{/* Agenda Component */}
					<div className=" border border-gray-200 rounded-lg w-full">
						<CalendarCustom
							currentMonth={currentMonth}
							setCurrentMonth={setCurrentMonth}
							onSelectDate={setSelectedDate}
							onHasDateForDay={(eventsOfDay, date) => {
								const hasEvents = eventsOfDay && eventsOfDay.length > 0;

								// A free pre-reserved day goes straight to confirming it
								const reservation = preReservations.find(
									(item) => item.date === format(date, "yyyy-MM-dd")
								);
								if (reservation && !hasEvents) {
									void confirmPreReservation(reservation);
									return;
								}

								setSelectedEventsDay(hasEvents ? eventsOfDay : null);

								if (hasEvents) {
									setModalMode("list");
								} else {
									setModalMode("create");
								}

								setShowEventModal(true);
							}}
							agendaData={agendaData}
							eventsAgendaFormat={events}
							preReservations={preReservations}
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
