import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Calendar, Loader2, DollarSign, Eye, EyeOff } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { onboardingService } from "../../../api";
import { Button } from "../../ui/Button/Button";
import { Input } from "../../ui/Input/Input";
import { Label } from "../../ui/Label/Label";
import { IconTabNavigation } from "../../ui/IconTabNavigation/IconTabNavigation";
import { useOnboarding } from "../../../contexts/hooks/useOnboarding";
import { StepLayout } from "../../BandRegister/layout/StepLayout/StepLayout";
import { AgendaComponent } from "../../Agenda/AgendaComponent";
import type {
	OnboardingSchedule,
	ScheduleApiResponse,
} from "../../../api/types";
import type { AgendaEvent } from "../../BandProfile/Agenda/types";

// Define styles consistent with modern interface pattern
const styles = {
	titleText: "text-gray-800 font-semibold text-lg sm:text-xl",
	sectionContainer: "bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200",
	sectionTitle: "flex items-center gap-2 mb-3 sm:mb-4",
	sectionIcon: "text-blue-600 flex-shrink-0",
};

export default function ScheduleStep() {
	const [loading, setLoading] = useState(false);
	const [events, setEvents] = useState<Array<AgendaEvent>>([]);
	const [showPriceTab, setShowPriceTab] = useState<string>("false");
	const [valorServico, setValorServico] = useState<number>(0);
	const navigate = useNavigate();
	const { updateData, markStepComplete, onboardingData, produtoMusicalId } =
		useOnboarding();

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
				(response as Array<ScheduleApiResponse>).forEach((dayData) => {
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

	// Load existing data from context or API
	useEffect(() => {
		const existingData = onboardingData["schedule"] as
			| OnboardingSchedule
			| undefined;

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

	// Handle events change from AgendaComponent
	const handleEventsChange = async (newEvents: Array<AgendaEvent>) => {
		setEvents(newEvents);

		// Save to API immediately when events change
		if (produtoMusicalId) {
			try {
				const scheduleData: OnboardingSchedule = {
					compromissos: newEvents.map((event) => ({
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

				toast.success("Agenda atualizada com sucesso");
			} catch (error: any) {
				console.error("Erro ao salvar agenda:", error);
				toast.error("Erro ao salvar agenda. Tente novamente.");
			}
		}
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

	return (
		<StepLayout
			currentStep={5}
			headerIcon={<Calendar className="text-blue-600" size={24} />}
			headerTitle="Agenda"
		>
			<div className="flex flex-col w-full h-full gap-4 lg:gap-6 overflow-y-auto px-1 sm:px-0">
				<form
					className="flex flex-col w-full h-full gap-4 lg:gap-6"
					onSubmit={onSubmit}
				>
					{/* Seção da Agenda */}
					<div className={styles.sectionContainer}>
						<div className={styles.sectionTitle}>
							<Calendar className={styles.sectionIcon} size={24} />
							<h2 className={styles.titleText}>Minha Agenda</h2>
						</div>
						<p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
							Adicione eventos à sua agenda. Os contratantes poderão verificar
							sua disponibilidade através dos indicadores de "Ocupado", mas os
							detalhes dos eventos permanecerão privados.
						</p>

						{/* Agenda Component */}
						<div className="h-96 border border-gray-200 rounded-lg overflow-hidden">
							<AgendaComponent
								events={events}
								onEventsChange={handleEventsChange}
								initialDate={new Date()}
								readOnly={false}
								allowDragAndDrop={false}
								showCreateButton
								viewMode="form"
								simpleMode
								produtoMusicalId={
									produtoMusicalId ? Number(produtoMusicalId) : undefined
								}
								enableApiSync={false} // We handle saving manually
							/>
						</div>
					</div>

					{/* Seção de Valores */}
					<div className={styles.sectionContainer}>
						<div className={styles.sectionTitle}>
							<DollarSign className={styles.sectionIcon} size={24} />
							<h2 className={styles.titleText}>Valores e Orçamento</h2>
						</div>
						<p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
							Defina como os contratantes verão suas informações de valores.
						</p>

						{/* Tabs for price visibility */}
						<div className="mb-4">
							<IconTabNavigation
								currentTab={showPriceTab}
								tabs={[
									{
										label: "Mostre o valor do serviço",
										value: "true",
										icon: <Eye size={20} />,
									},
									{
										label: "Valor mediante solicitação",
										value: "false",
										icon: <EyeOff size={20} />,
									},
								]}
								onChange={setShowPriceTab}
							/>
						</div>

						{/* Price input when showing price */}
						{showPriceTab === "true" && (
							<div className="space-y-2">
								<Label className="text-sm font-medium">Valor por evento</Label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<span className="text-gray-500 text-sm font-medium">
											R$
										</span>
									</div>
									<Input
										type="number"
										placeholder="1.000,00"
										className="pl-10"
										value={valorServico || ""}
										onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
											const value = parseFloat(event.target.value) || 0;
											setValorServico(value);
										}}
									/>
								</div>
								<p className="text-xs text-gray-500">
									Esse valor será exibido no seu perfil
								</p>
							</div>
						)}
					</div>

					{/* Navigation buttons */}
					<div className="flex flex-col sm:flex-row w-full gap-2 sm:gap-3 items-stretch sm:items-center justify-between mt-4 lg:mt-6 px-1 sm:px-0">
						<Button
							className="w-full sm:w-auto min-w-0 sm:min-w-[120px] text-sm sm:text-base py-2 sm:py-3"
							type="button"
							variant="outline"
							onClick={async () => {
								await navigate({ to: "/band/register/onboarding/4" });
							}}
						>
							Voltar
						</Button>
						<Button
							className="w-full sm:w-auto min-w-0 sm:min-w-[120px] text-sm sm:text-base py-2 sm:py-3"
							type="submit"
							disabled={loading}
						>
							{loading ? (
								<>
									<Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
									<span className="hidden sm:inline">Salvando...</span>
									<span className="sm:hidden">Salvando</span>
								</>
							) : (
								"Próximo"
							)}
						</Button>
					</div>
				</form>
			</div>
		</StepLayout>
	);
}
