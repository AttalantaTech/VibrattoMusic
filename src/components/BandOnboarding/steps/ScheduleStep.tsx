import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
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
import { StepLayout } from "../layout/StepLayout/StepLayout";
import type {
	MusicalProductSchedule,
	OnboardingApiResponse,
	ScheduleApiResponse,
} from "../../../api/types";
import type { AgendaEvent } from "../../BandProfile/Agenda/types";
import CalendarCustom from "@/components/CalendarCustom/CalendarCustom";
import { CreateEventModal } from "@/components/BandProfile/Agenda";
import {
	useOnboardingSchedule,
	useOnboardingData,
} from "@/hooks/useOnboarding";
import { ptBR } from "date-fns/locale";
import { decryptValue } from "@/utils/encryptValue";

// Define styles consistent with modern interface pattern
const styles = {
	titleText: "text-gray-800 font-semibold text-lg sm:text-xl",
	sectionContainer: "bg-gray-50",
	sectionTitle: "flex items-center gap-2 mb-3 sm:mb-4",
	sectionIcon: "text-primary-600 flex-shrink-0",
};

export default function ScheduleStep() {
	const { data } = useOnboardingData();

	const searchParameters = useSearch({ from: "/band/register/onboarding/5" });
	const onboardingID = searchParameters.registerId
		? decryptValue(searchParameters.registerId ?? "")
		: null;
	const onboardingType = searchParameters.type ?? null;

	const onboardingData = useMemo<OnboardingApiResponse | undefined>(() => {
		if (!data?.length) return undefined;

		if (onboardingType === "new-onboarding") return undefined;

		if (onboardingID)
			return data.find((item) => item.id === Number(onboardingID));

		return data[0];
	}, [data, onboardingID, onboardingType]);

	const produtoMusicalId = onboardingData ? onboardingData.id : 0;

	const { data: dataSchedule } = useOnboardingSchedule(produtoMusicalId);

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
		return data.flatMap((day) =>
			day.compromissos.map((comp) => ({
				id: comp.id,
				title: comp.titulo,
				description: comp.descricao || "",
				date: parseISO(day.data),
				startTime: comp.horaInicio,
				endTime: comp.horaFim,
				type: comp.disponibilidadeOutrosEventos ? "personal" : "show",
				status: "confirmed",
			}))
		);
	};

	const loadSchedule = useCallback(() => {
		if (!produtoMusicalId) return;

		try {
			setLoading(true);

			if (Array.isArray(dataSchedule)) {
				setEvents(mapScheduleFromApi(dataSchedule));
			} else {
				setEvents([]);
			}
		} catch (error) {
			console.error(error);
			setEvents([]);
		} finally {
			setLoading(false);
		}
	}, [dataSchedule, produtoMusicalId]);

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
			const compromissos = events
				.sort((a, b) => a.date.getTime() - b.date.getTime())
				.map((event) => ({
					titulo: event.title.trim(),
					descricao: event.description?.trim() || "",
					data: format(event.date, "yyyy-MM-dd"),
					horaInicio: event.startTime,
					horaFim: event.endTime,
					disponibilidadeOutrosEventos: event.type !== "show",
				}));

			// Convert events to API format
			const scheduleData: MusicalProductSchedule = {
				id: Number(produtoMusicalId),
				inicioCalendario:
					compromissos.length > 0
						? compromissos.at(0)?.data
						: format(new Date(), "yyyy-MM-dd"),
				finalCalendario:
					compromissos.length > 0
						? compromissos.at(-1)?.data
						: format(new Date(), "yyyy-MM-dd"),
				compromissos,
			};

			await onboardingService.saveOnboardingSchedule(
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

	useEffect(() => {
		loadSchedule();
	}, [loadSchedule]);

	return (
		<>
			<StepLayout
				currentStep={5}
				headerIcon={<Calendar className="text-primary-700" size={24} />}
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
												className="border-l-4 border-primary-500 text-primary-500 bg-primary-50 p-3 min-h-32 rounded-lg flex justify-between items-start"
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
