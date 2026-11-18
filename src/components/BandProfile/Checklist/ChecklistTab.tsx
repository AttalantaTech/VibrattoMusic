import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
	AlertTriangle,
	ArrowLeft,
	CalendarX,
	Plus,
	ListChecks,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button/Button";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { useChecklistEvents } from "@/features/Checklist/hooks/useChecklistEvents";
import {
	brandingOf,
	eventStateOf,
	scheduleOf,
	templateOf,
	useChecklistStore,
} from "@/features/Checklist/hooks/useChecklistStore";
import {
	buildChecklist,
	isDueSoon,
	manualToEvent,
	progressOf,
	sortEvents,
} from "@/features/Checklist/utils/buildChecklist";
import { ManualEventDialog } from "@/features/Checklist/components/ManualEventDialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { EventChecklist } from "@/features/Checklist/components/EventChecklist";
import { ProgressBar } from "@/features/Checklist/components/ProgressBar";
import { TemplateEditor } from "@/features/Checklist/components/TemplateEditor";
import { ShareChecklistDialog } from "@/features/Checklist/components/ShareChecklistDialog";
import { useNavigate } from "@tanstack/react-router";
import { EventDetails } from "@/features/Checklist/components/EventDetails";
import { ScheduleTemplateEditor } from "@/features/Checklist/components/ScheduleTemplateEditor";
import { calculateSchedule } from "@/features/Checklist/utils/schedule";
import { useEventForecast } from "@/features/Checklist/hooks/useEventForecast";
import {
	forecastText,
	weatherSymbol,
} from "@/features/Checklist/utils/weather";
import {
	ORIGIN_LABEL,
	type ChecklistEvent,
	type ChecklistItem,
	type ManualEvent,
	type ProfileReadiness,
} from "@/features/Checklist/types";

const shortDate = (date: string) =>
	format(parseISO(date), "dd/MM · EEE", { locale: ptBR });

export const ChecklistTab = () => {
	const { activeProduct } = useMusicalProductStore();
	const profileId = activeProduct?.id;
	const { events: agendaEvents, isLoading } = useChecklistEvents(profileId);

	const byProfile = useChecklistStore((state) => state.byProfile);
	const toggle = useChecklistStore((state) => state.toggle);
	const addToEvent = useChecklistStore((state) => state.addToEvent);
	const removeFromEvent = useChecklistStore((state) => state.removeFromEvent);
	const saveTemplate = useChecklistStore((state) => state.saveTemplate);
	const saveManualEvent = useChecklistStore((state) => state.saveManualEvent);
	const removeManualEvent = useChecklistStore(
		(state) => state.removeManualEvent
	);

	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const [showPast, setShowPast] = useState(false);
	const [isEditingTemplate, setIsEditingTemplate] = useState(false);
	const [isSharing, setIsSharing] = useState(false);
	const navigate = useNavigate();
	const [isEditingSchedule, setIsEditingSchedule] = useState(false);
	const saveSchedule = useChecklistStore((state) => state.saveSchedule);
	const setEventDetails = useChecklistStore((state) => state.setEventDetails);
	// null: closed; undefined inside: creating; a ManualEvent: editing it
	const [manualDialog, setManualDialog] = useState<{
		event?: ManualEvent;
	} | null>(null);
	const [deletingManual, setDeletingManual] = useState<ManualEvent | null>(
		null
	);

	const today = format(new Date(), "yyyy-MM-dd");
	const template = templateOf(byProfile, profileId ?? 0);
	const branding = brandingOf(byProfile, profileId ?? 0);
	const scheduleModel = scheduleOf(byProfile, profileId ?? 0);
	// The profile's own logomarca wins; then the demo logo; else no logo
	const logo = activeProduct?.logomarca?.trim() || branding.logo || null;
	const manualEvents = useMemo(
		() => byProfile[profileId ?? 0]?.manual ?? [],
		[byProfile, profileId]
	);
	const events = useMemo(
		() => sortEvents([...agendaEvents, ...manualEvents.map(manualToEvent)]),
		[agendaEvents, manualEvents]
	);
	const manualOf = (event: ChecklistEvent): ManualEvent | undefined =>
		event.origin === "avulso"
			? manualEvents.find((item) => `avulso-${item.id}` === event.key)
			: undefined;

	const profile: ProfileReadiness = {
		rider: !!(activeProduct?.rider || activeProduct?.riderTexto),
		stageMap: !!(
			activeProduct?.mapaPalcoLink || activeProduct?.mapaPalco?.length
		),
		dressingRoom: !!(
			activeProduct?.camarimIncluso ||
			activeProduct?.infraCamarim ||
			activeProduct?.infraCamarimTexto
		),
	};

	const withItems = useMemo(
		() =>
			events.map((event) => ({
				event,
				items: buildChecklist(
					event,
					template,
					eventStateOf(byProfile, profileId ?? 0, event.key),
					profile
				),
			})),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[events, template, byProfile, profileId, JSON.stringify(profile)]
	);

	const upcoming = withItems.filter(({ event }) => event.date >= today);
	const past = withItems.filter(({ event }) => event.date < today).reverse();
	const listed = showPast ? past : upcoming;
	const dueSoon = upcoming.filter(({ event, items }) =>
		isDueSoon(event, items, today)
	);

	const selected =
		withItems.find(({ event }) => event.key === selectedKey) ??
		(selectedKey === null ? upcoming[0] : undefined);

	const selectedState = selected
		? eventStateOf(byProfile, profileId ?? 0, selected.event.key)
		: undefined;
	// Calculated from the show's time until the person changes it
	const selectedSchedule = selected
		? (selectedState?.schedule ??
			calculateSchedule(scheduleModel, selected.event))
		: [];
	const selectedNotes = selectedState?.notes ?? branding.defaultNotes;
	const weather = useEventForecast(selected?.event ?? null);

	if (!profileId) return null;

	const openEvent = (event: ChecklistEvent) => {
		setSelectedKey(event.key);
	};

	const handleRemove = (event: ChecklistEvent, item: ChecklistItem) => {
		removeFromEvent(profileId, event.key, item.id, item.source === "evento");
	};

	return (
		<div className="flex w-full flex-col gap-5 pb-10">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
						<ListChecks
							className="h-6 w-6 text-primary-700"
							aria-hidden="true"
						/>
						Checklist dos eventos
					</h2>
					<p className="text-sm text-gray-600">
						O que precisa estar pronto para cada show, da Vibratto ou de fora.
					</p>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row">
					<Button
						size="sm"
						className="flex gap-2"
						onClick={() => {
							setManualDialog({});
						}}
					>
						<Plus className="h-4 w-4" aria-hidden="true" />
						Criar checklist avulso
					</Button>
				</div>
			</div>

			<p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
				Versão de demonstração: as marcações e o seu modelo ficam salvos só
				neste navegador até o servidor passar a guardá-los.
			</p>

			{dueSoon.length > 0 && (
				<div
					className="flex flex-col gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3"
					role="status"
				>
					{dueSoon.map(({ event, items }) => {
						const open = items.filter((item) => !item.done).length;
						return (
							<button
								key={event.key}
								type="button"
								className="flex items-start gap-2 text-left text-sm text-orange-900 hover:underline"
								onClick={() => {
									openEvent(event);
									setShowPast(false);
								}}
							>
								<AlertTriangle
									className="mt-0.5 h-4 w-4 shrink-0"
									aria-hidden="true"
								/>
								<span>
									<strong>{event.title}</strong> é em{" "}
									{event.date === today ? "hoje" : shortDate(event.date)}:
									faltam {open} {open === 1 ? "item" : "itens"}.
								</span>
							</button>
						);
					})}
				</div>
			)}

			{isLoading ? (
				<div className="flex h-60 items-center justify-center">
					<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
				</div>
			) : (
				<div className="flex flex-col gap-6 lg:flex-row lg:items-start">
					{/* List: on phones it gives way to the chosen event */}
					<div
						className={`flex w-full flex-col gap-2 lg:w-80 lg:shrink-0 ${
							selectedKey ? "hidden lg:flex" : ""
						}`}
					>
						<div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-sm">
							{[
								{ value: false, label: `Próximos (${upcoming.length})` },
								{ value: true, label: `Anteriores (${past.length})` },
							].map((tab) => (
								<button
									key={tab.label}
									type="button"
									className={`flex-1 rounded-md px-3 py-1.5 font-medium ${
										showPast === tab.value
											? "bg-white text-gray-900 shadow-sm"
											: "text-gray-600"
									}`}
									onClick={() => {
										setShowPast(tab.value);
									}}
								>
									{tab.label}
								</button>
							))}
						</div>

						{listed.length === 0 ? (
							<div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-600">
								<CalendarX className="h-6 w-6 text-gray-400" />
								{showPast
									? "Nenhum evento anterior."
									: "Nenhum evento pela frente. Propostas aceitas e eventos da sua agenda aparecem aqui, ou crie um checklist avulso."}
							</div>
						) : (
							<ul className="flex flex-col gap-2">
								{listed.map(({ event, items }) => {
									const { done, total } = progressOf(items);
									const isSelected = selected?.event.key === event.key;
									return (
										<li key={event.key}>
											<button
												type="button"
												className={`flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors ${
													isSelected
														? "border-primary-400 bg-primary-50"
														: "border-gray-200 bg-white hover:border-gray-300"
												}`}
												onClick={() => {
													openEvent(event);
												}}
											>
												<div className="flex items-center justify-between gap-2">
													<span className="text-xs font-medium capitalize text-gray-500">
														{shortDate(event.date)}
													</span>
													<span className="text-xs text-gray-500">
														{ORIGIN_LABEL[event.origin].short}
													</span>
												</div>
												<span className="line-clamp-2 text-sm font-semibold text-gray-900">
													{event.title}
												</span>
												<div className="flex items-center gap-2">
													<ProgressBar done={done} total={total} />
													<span className="shrink-0 text-xs text-gray-600">
														{done}/{total}
													</span>
												</div>
											</button>
										</li>
									);
								})}
							</ul>
						)}
					</div>

					{/* The chosen event */}
					<div
						className={`min-w-0 flex-1 rounded-lg border border-gray-200 bg-white p-4 sm:p-5 ${
							selectedKey ? "" : "hidden lg:block"
						}`}
					>
						{selected ? (
							<>
								<button
									type="button"
									className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600 lg:hidden"
									onClick={() => {
										setSelectedKey(null);
									}}
								>
									<ArrowLeft className="h-4 w-4" aria-hidden="true" />
									Todos os eventos
								</button>
								<EventChecklist
									event={selected.event}
									items={selected.items}
									onToggle={(itemId) => {
										toggle(profileId, selected.event.key, itemId);
									}}
									onAdd={(item) => {
										addToEvent(profileId, selected.event.key, item);
									}}
									onRemove={(item) => {
										handleRemove(selected.event, item);
									}}
									onShare={() => {
										setIsSharing(true);
									}}
									onEditModel={() => {
										setIsEditingTemplate(true);
									}}
									{...(manualOf(selected.event)
										? {
												onEditEvent: () => {
													setManualDialog({ event: manualOf(selected.event) });
												},
												onDeleteEvent: () => {
													setDeletingManual(manualOf(selected.event) ?? null);
												},
											}
										: {})}
								>
									<EventDetails
										event={selected.event}
										schedule={selectedSchedule}
										isScheduleCustom={!!selectedState?.schedule}
										audience={selectedState?.audience ?? ""}
										notes={selectedNotes}
										onScheduleChange={(rows) => {
											setEventDetails(profileId, selected.event.key, {
												schedule: rows,
											});
										}}
										onScheduleReset={() => {
											setEventDetails(profileId, selected.event.key, {
												schedule: undefined,
											});
										}}
										onEditScheduleModel={() => {
											setIsEditingSchedule(true);
										}}
										onAudienceChange={(audience) => {
											setEventDetails(profileId, selected.event.key, {
												audience,
											});
										}}
										weather={weather}
										onNotesChange={(notes) => {
											setEventDetails(profileId, selected.event.key, {
												notes,
											});
										}}
									/>
								</EventChecklist>
							</>
						) : (
							<p className="py-10 text-center text-sm text-gray-500">
								Escolha um evento para ver o checklist.
							</p>
						)}
					</div>
				</div>
			)}

			<ManualEventDialog
				isOpen={!!manualDialog}
				event={manualDialog?.event}
				onClose={() => {
					setManualDialog(null);
				}}
				onSave={(manual) => {
					saveManualEvent(profileId, manual);
					setSelectedKey(`avulso-${manual.id}`);
					setShowPast(manual.date < today);
				}}
			/>

			<Dialog
				open={!!deletingManual}
				onOpenChange={(open) => {
					if (!open) setDeletingManual(null);
				}}
			>
				<DialogContent className="w-full sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Excluir "{deletingManual?.title}"?</DialogTitle>
						<DialogDescription>
							O checklist avulso e as marcações dele serão apagados.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2">
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								setDeletingManual(null);
							}}
						>
							Cancelar
						</Button>
						<Button
							variant="danger"
							size="sm"
							onClick={() => {
								if (deletingManual) {
									removeManualEvent(profileId, deletingManual.id);
									setSelectedKey(null);
								}
								setDeletingManual(null);
							}}
						>
							Excluir
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<TemplateEditor
				isOpen={isEditingTemplate}
				template={template}
				onClose={() => {
					setIsEditingTemplate(false);
				}}
				onSave={(items) => {
					saveTemplate(profileId, items);
				}}
			/>

			{selected && (
				<ShareChecklistDialog
					isOpen={isSharing}
					event={selected.event}
					items={selected.items}
					professional={activeProduct?.nome ?? ""}
					branding={branding}
					logo={logo}
					schedule={selectedSchedule}
					audience={selectedState?.audience ?? ""}
					notes={selectedNotes}
					weather={
						weather.forecast
							? {
									text: forecastText(weather.forecast),
									symbol: weatherSymbol(weather.forecast.code),
								}
							: null
					}
					onClose={() => {
						setIsSharing(false);
					}}
					onCustomize={() => {
						setIsSharing(false);
						void navigate({ to: "/band/me", search: { tab: "checklist-pdf" } });
					}}
				/>
			)}

			<ScheduleTemplateEditor
				isOpen={isEditingSchedule}
				steps={scheduleModel}
				onClose={() => {
					setIsEditingSchedule(false);
				}}
				onSave={(steps) => {
					saveSchedule(profileId, steps);
				}}
			/>
		</div>
	);
};
