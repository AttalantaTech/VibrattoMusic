import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
	Calendar,
	Loader2,
	Trash2,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { onboardingService } from "../../../api";
import { Button } from "../../ui/Button/Button";
import { useOnboarding } from "../../../contexts/hooks/useOnboarding";
import { StepLayout } from "../../BandRegister/layout/StepLayout/StepLayout";
import type {
	OnboardingSchedule,
	ScheduleApiResponse,
} from "../../../api/types";
import type { AgendaEvent } from "../../BandProfile/Agenda/types";
import CalendarCustom from "@/components/CalendarCustom/CalendarCustom";
import { CreateEventModal } from "@/components/BandProfile/Agenda";
import { useOnboardingData } from "@/hooks/useMusicalProducts";
import { ptBR } from "date-fns/locale";

// Define styles consistent with modern interface pattern
const styles = {
	titleText: "text-gray-800 font-semibold text-lg sm:text-xl",
	sectionContainer: "bg-gray-50",
	sectionTitle: "flex items-center gap-2 mb-3 sm:mb-4",
	sectionIcon: "text-blue-600 flex-shrink-0",
};

export default function ScheduleStep() {
	const { data: onboardingData } = useOnboardingData();
	const produtoMusicalId = onboardingData ? onboardingData.id : 0;

	const navigate = useNavigate();
	const { updateData, markStepComplete } = useOnboarding();

	const [loading, setLoading] = useState(false);
	const [events, setEvents] = useState<Array<AgendaEvent>>([]);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);

	const [createEventData, setCreateEventData] = useState<{
		date?: Date;
		startTime?: string;
		endTime?: string;
	}>({});

	const mapScheduleFromApi = (
		data: Array<ScheduleApiResponse>
	): Array<AgendaEvent> => {
		return data.flatMap((dayData) =>
			dayData.compromissos.map((comp) => ({
				id: comp.id,
				title: comp.titulo,
				description: comp.descricao || "",
				date: parseISO(dayData.data),
				startTime: comp.horaInicio,
				endTime: comp.horaFim,
				type: comp.disponibilidadeOutrosEventos ? "personal" : "show",
				status: "confirmed",
			}))
		);
	};

	const loadSchedule = useCallback(async () => {
		if (!produtoMusicalId) return;

		try {
			setLoading(true);
			const response = await onboardingService.getSchedule(
				Number(produtoMusicalId)
			);

			if (Array.isArray(response)) {
				setEvents(mapScheduleFromApi(response));
			} else {
				setEvents([]);
			}
		} catch (error) {
			console.error(error);
			setEvents([]);
		} finally {
			setLoading(false);
		}
	}, [produtoMusicalId]);

	// Load existing schedule from API
	const loadExistingSchedule = useCallback(async () => {
		if (!produtoMusicalId) {
			return;
		}

		try {
			setLoading(true);
			const response = await onboardingService.getSchedule(
				Number(produtoMusicalId)
			);

			// Handle the API format
			if (response && Array.isArray(response)) {
				const apiEvents: Array<AgendaEvent> = [];

				// Extract events from each day's compromissos
				response.forEach((dayData) => {
					if (dayData.compromissos && dayData.compromissos.length > 0) {
						dayData.compromissos.forEach((compromisso) => {
							apiEvents.push({
								id: compromisso.id || Date.now(),
								title: compromisso.titulo,
								description: compromisso.descricao || "",
								date: parseISO(dayData.data),
								startTime: compromisso.horaInicio,
								endTime: compromisso.horaFim,
								type: compromisso.disponibilidadeOutrosEventos
									? "personal"
									: "show",
								status: "confirmed",
							});
						});
					}
				});

				setEvents(apiEvents);
			} else {
				setEvents([]);
			}
		} catch (error) {
			console.error("Erro ao carregar agenda:", error);
			setEvents([]);
		} finally {
			setLoading(false);
		}
	}, [produtoMusicalId]);

	const formatDate = (date: Date) => {
		return format(date, "dd/MM/yyyy", { locale: ptBR });
	};

	const handleSelectedEvent = (eventData: Partial<AgendaEvent>) => {
		setEvents((state) => [...state, eventData as AgendaEvent]);
	};

	const handleRemoveEventSimple = (index: number) => {
		setEvents((previous) => {
			const sorted = [...previous].sort(
				(a, b) => a.date.getTime() - b.date.getTime()
			);

			return sorted.filter((_, indexSorted) => indexSorted !== index);
		});
	};

	// Submit to complete step
	const onSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (!produtoMusicalId) {
			console.error("ID do produto musical não encontrado");
			toast.error("Erro: ID do produto musical não encontrado");
			return;
		}

		setLoading(true);
		try {
			// Convert events to API format
			const scheduleData: OnboardingSchedule = {
				id: Number(produtoMusicalId),
				compromissos: events.map((event) => ({
					titulo: event.title.trim(),
					descricao: event.description?.trim() || "",
					data: format(event.date, "yyyy-MM-dd"),
					horaInicio: event.startTime,
					horaFim: event.endTime,
					disponibilidadeOutrosEventos: event.type !== "show",
				})),
			};

			await onboardingService.updateSchedule(
				Number(produtoMusicalId),
				scheduleData
			);

			// Update context
			updateData("schedule", scheduleData);
			markStepComplete("5");

			toast.success("Agenda salva com sucesso");
			await navigate({ to: "/band/register/onboarding/6" });
		} catch (error: any) {
			console.error("Error saving schedule:", error);
			toast.error("Erro ao salvar agenda. Tente novamente.");
		} finally {
			setLoading(false);
		}
	};

	// Load from onboarding context OR API
	useEffect(() => {
		async function getSchedule() {
			const onboardingSchedule = await onboardingService.getSchedule(
				Number(produtoMusicalId)
			);

			if (onboardingSchedule?.length > 0) {
				const mapped: Array<AgendaEvent> = onboardingSchedule.flatMap(
					(dayData) =>
						dayData.compromissos.map((c, index) => ({
							id: index + 1,
							title: c.titulo,
							description: c.descricao || "",
							date: parseISO(dayData.data),
							startTime: c.horaInicio,
							endTime: c.horaFim,
							type: c.disponibilidadeOutrosEventos ? "personal" : "show",
							status: "confirmed",
						}))
				);

				setEvents(mapped);
			} else {
				void loadSchedule();
			}
		}

		void getSchedule();
	}, [loadSchedule, onboardingData, produtoMusicalId]);

	// Load existing data from context or API
	useEffect(() => {
		const existingData = onboardingData as OnboardingSchedule | undefined;

		if (
			existingData &&
			existingData.compromissos &&
			existingData.compromissos.length > 0
		) {
			const agendaEvents: Array<AgendaEvent> = existingData.compromissos.map(
				(item, index) => ({
					id: index + 1,
					title: item.titulo,
					description: item.descricao || "",
					date: parseISO(item.data),
					startTime: item.horaInicio,
					endTime: item.horaFim,
					type: item.disponibilidadeOutrosEventos ? "personal" : "show",
					status: "confirmed",
				})
			);
			setEvents(agendaEvents);
		} else {
			void loadExistingSchedule();
		}
	}, [loadExistingSchedule, onboardingData]);

	return (
		<>
			<StepLayout
				currentStep={5}
				headerIcon={<Calendar className="text-blue-600" size={24} />}
				headerTitle="Agenda"
			>
				<div className="flex flex-col w-full h-full gap-4 lg:gap-6  px-1 sm:px-0">
					{/* Seção da Agenda */}
					<div className={styles.sectionContainer}>
						<div className={styles.sectionTitle}>
							<h2 className={styles.titleText}>Minha Agenda</h2>
						</div>
						<p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
							Adicione eventos à sua agenda. Os contratantes poderão verificar
							sua disponibilidade através dos indicadores de "Ocupado", mas os
							detalhes dos eventos permanecerão privados.
						</p>

						{/* Agenda Component */}
						<div className=" border border-gray-200 rounded-lg">
							<CalendarCustom
								onSelectDate={setSelectedDate}
								onModal={() => {
									setShowCreateModal((state) => !state);
								}}
							/>
						</div>

						{/* Lista de eventos */}
						{events.length > 0 && (
							<div className="mt-8">
								<div className="space-y-3">
									{[...events]
										.sort((a, b) => a.date.getTime() - b.date.getTime())
										.map((event, index) => (
											<div
												key={index}
												className="border-l-4 border-blue-500 text-blue-500 bg-blue-50 p-3 min-h-32 rounded-lg flex justify-between items-start"
											>
												<div>
													<div className="font-medium">{event.title}</div>
													<div className="text-sm">
														{formatDate(event.date)} • {event.startTime} -{" "}
														{event.endTime}
													</div>
												</div>

												<button
													className="text-gray-500 hover:text-gray-700"
													onClick={() => {
														handleRemoveEventSimple(index);
													}}
												>
													<Trash2 size={20} />
												</button>
												{/* )} */}
											</div>
										))}
								</div>
							</div>
						)}
					</div>

					<form
						className="flex flex-col w-full h-full gap-4 lg:gap-6"
						onSubmit={onSubmit}
					>
						{/* Navigation buttons */}
						<div className="flex flex-col sm:flex-row w-full gap-2 sm:gap-3 items-stretch sm:items-center justify-end mt-4 lg:mt-6 px-1 sm:px-0">
							<Button
								className="w-full sm:w-auto min-w-0 sm:min-w-[120px] text-sm sm:text-base py-2 sm:py-3"
								type="button"
								variant="outline"
								onClick={async () => {
									await navigate({ to: "/band/register/onboarding/4" });
								}}
							>
								<div className="flex items-center gap-1">
									<ChevronLeft />
									Voltar
								</div>
							</Button>
							<Button
								className="w-full sm:w-auto min-w-0 sm:min-w-[120px] text-sm sm:text-base py-2 sm:py-3"
								type="submit"
								disabled={loading}
							>
								{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

								<div className="flex items-center gap-1">
									{loading ? "Salvando..." : "Continuar"}
									<ChevronRight />
								</div>
							</Button>
						</div>
					</form>
				</div>
			</StepLayout>

			<CreateEventModal
				isOpen={showCreateModal}
				onClose={() => {
					setShowCreateModal(false);
					setCreateEventData({});
				}}
				onSubmit={handleSelectedEvent}
				initialDate={selectedDate}
				initialStartTime={createEventData.startTime}
				initialEndTime={createEventData.endTime}
			/>
		</>
	);
}
