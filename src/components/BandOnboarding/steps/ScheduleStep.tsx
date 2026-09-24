import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
	Calendar,
	Loader2,
	Trash2,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { onboardingService } from "../../../api";
import { Button } from "../../ui/Button/Button";
import { useOnboarding } from "../../../contexts/hooks/useOnboarding";
import { StepLayout } from "../layout/StepLayout/StepLayout";
import type {
	CommitmentAPI,
	MusicalProductSchedule,
	OnboardingApiResponse,
} from "../../../api/types";
import type { AgendaEvent, ModalMode } from "../../BandProfile/Agenda/types";
import { DatePicker } from "@/components/Calendar/DatePicker";
import {
	useOnboardingSchedule,
	useOnboardingData,
} from "@/hooks/useOnboarding";
import { ptBR } from "date-fns/locale";
import { decryptValue, encryptValue } from "@/utils/encryptValue";
import { mapAgendaEventToFormData } from "@/utils/mapAgendaEventToFormData";
import { EventModal } from "@/components/BandProfile/Agenda/EventModal/EventModal";
import { calculateDuration } from "@/components/BandProfile/Agenda/utils";
import { toBR } from "@/utils";

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
	const [showEventModal, setShowEventModal] = useState(false);
	const [modalMode, setModalMode] = useState<ModalMode>("create");
	const [selectedEventsDay, setSelectedEventsDay] =
		useState<Array<AgendaEvent> | null>(null);

	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [currentMonth, setCurrentMonth] = useState(toBR(new Date()));

	const loadSchedule = useCallback(() => {
		if (!produtoMusicalId) return;

		try {
			setLoading(true);

			if (Array.isArray(dataSchedule)) {
				setEvents(mapAgendaEventToFormData(dataSchedule));
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

	const handleSelectedEvent = (eventData: AgendaEvent) => {
		setEvents((state) => [...state, eventData]);

		setShowEventModal(false);
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
			const compromissos: Array<CommitmentAPI> = events
				.sort((a, b) => a.date.getTime() - b.date.getTime())
				.map((event) => ({
					id: 0,
					titulo: event.title.trim(),
					descricao: event.description?.trim() || "",
					data: format(event.date, "yyyy-MM-dd"),
					horaInicio: event.startTime || null,
					duracao: calculateDuration(event.startTime, event.endTime),
					disponibilidadeOutrosEventos: event.availabilityOtherEvents,
					localizacao: event.location ?? "",
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

			await onboardingService
				.saveOnboardingSchedule(Number(produtoMusicalId), scheduleData)
				.then(async () => {
					setShowEventModal(false);
					setSelectedEventsDay(null);
					setSelectedDate(null);

					// Update context
					updateData("schedule", scheduleData);
					markStepComplete("5");

					toast.success("Agenda salva com sucesso");

					if (onboardingData?.id) {
						await navigate({
							to: "/band/register/onboarding/6",
							search: {
								registerId: encryptValue(onboardingData.id.toString()),
							},
						});
					}
				})
				.catch((error: any) => {
					if (
						error?.name === "VibrattoApiError" ||
						error?.code === "INVALID_REQUEST"
					) {
						const errorMessage = error.data?.mensagem as string | undefined;

						if (errorMessage && errorMessage.includes("ConflitoHorario")) {
							toast.error(
								"Não foi possível criar os eventos da agenda. Você possui conflito de horário entre os eventos.",
								{ duration: 10000 }
							);
						} else {
							toast.error("Ocorreu um erro. Tente novamente mais tarde!");
						}

						return;
					}
					toast.error("Ocorreu um erro. Tente novamente mais tarde!");
				});
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
						<div className={styles.sectionTitle}></div>
						<p className="text-gray-600 text-justify text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
							Adicione eventos à sua agenda. Os contratantes só poderão
							visualizar a disponibilidade da agenda clicando em uma data por
							vez.
							<br />
							<br />
							Você pode adicionar eventos em um outro momento na edição do
							perfil.
						</p>

						{/* Agenda Component */}
						<div className=" border border-gray-200 rounded-lg">
							<DatePicker
								mode="default"
								currentMonth={currentMonth}
								setCurrentMonth={setCurrentMonth}
								onSelectDate={setSelectedDate}
								onModal={() => {
									setShowEventModal((state) => !state);
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
									if (onboardingData?.id) {
										await navigate({
											to: "/band/register/onboarding/4",
											search: {
												registerId: encryptValue(onboardingData.id.toString()),
											},
										});
									}
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

			<EventModal
				isOpen={showEventModal}
				mode={modalMode}
				setMode={setModalMode}
				onClose={() => {
					setShowEventModal(false);
					setSelectedEventsDay(null);
					setSelectedDate(null);
					setShowEventModal(false);
				}}
				selectedEventsDay={selectedEventsDay}
				onSubmit={(event) => {
					handleSelectedEvent(event);
				}}
				initialDate={selectedDate}
			/>
		</>
	);
}
