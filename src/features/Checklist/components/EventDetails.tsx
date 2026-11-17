import { Clock, Plus, RotateCcw, Settings2, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { ChecklistEvent, ScheduleRow } from "../types";
import type { EventForecast } from "../hooks/useEventForecast";
import { forecastText, weatherSymbol } from "../utils/weather";
import { transportLabel } from "../utils/schedule";
import { newItemId } from "../hooks/useChecklistStore";

interface EventDetailsProps {
	event: ChecklistEvent;
	schedule: Array<ScheduleRow>;
	/** The person changed the schedule of this event */
	isScheduleCustom: boolean;
	audience: string;
	notes: string;
	onScheduleChange: (rows: Array<ScheduleRow>) => void;
	onScheduleReset: () => void;
	onEditScheduleModel: () => void;
	onAudienceChange: (audience: string) => void;
	onNotesChange: (notes: string) => void;
	weather: EventForecast;
}

const inputClass =
	"rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

/**
 * The event's "cronograma": the times of each step (calculated from the
 * show's time, changeable here) and what the team needs to know
 */
export const EventDetails = ({
	event,
	schedule,
	isScheduleCustom,
	audience,
	notes,
	onScheduleChange,
	onScheduleReset,
	onEditScheduleModel,
	onAudienceChange,
	onNotesChange,
	weather,
}: EventDetailsProps) => {
	const transport = transportLabel(event);
	const hasStart = !!event.startTime;

	const update = (id: string, change: Partial<ScheduleRow>) => {
		onScheduleChange(
			schedule.map((row) => (row.id === id ? { ...row, ...change } : row))
		);
	};

	return (
		<div className="flex flex-col gap-5">
			<section className="flex flex-col gap-2">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
						<Clock className="h-4 w-4" aria-hidden="true" />
						Cronograma
					</h4>
					<div className="flex gap-3 text-xs">
						{isScheduleCustom && (
							<button
								type="button"
								className="inline-flex items-center gap-1 text-gray-600 hover:text-primary-600"
								onClick={onScheduleReset}
							>
								<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
								Recalcular pelo horário do show
							</button>
						)}
						<button
							type="button"
							className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-500"
							onClick={onEditScheduleModel}
						>
							<Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
							Cronograma padrão
						</button>
					</div>
				</div>
				{!hasStart && (
					<p className="text-xs text-amber-700">
						O evento não tem horário de início: preencha os horários abaixo ou
						defina o horário do show para calcular sozinho.
					</p>
				)}

				<ul className="flex flex-col gap-1.5">
					{schedule.map((row) => (
						<li key={row.id} className="flex items-center gap-2">
							<input
								type="time"
								aria-label={`Horário de ${row.label}`}
								className={`${inputClass} w-[6.5rem] shrink-0 font-semibold`}
								value={row.time}
								onChange={(input) => {
									update(row.id, { time: input.target.value });
								}}
							/>
							<input
								aria-label="Etapa"
								className={`${inputClass} min-w-0 flex-1`}
								value={row.label}
								maxLength={100}
								onChange={(input) => {
									update(row.id, { label: input.target.value });
								}}
							/>
							<button
								type="button"
								aria-label={`Tirar "${row.label}" do cronograma`}
								className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
								onClick={() => {
									onScheduleChange(
										schedule.filter((item) => item.id !== row.id)
									);
								}}
							>
								<X className="h-4 w-4" />
							</button>
						</li>
					))}
				</ul>
				<button
					type="button"
					className="inline-flex items-center gap-1 self-start text-sm text-primary-600 hover:text-primary-500"
					onClick={() => {
						onScheduleChange([
							...schedule,
							{ id: newItemId(), time: "", label: "" },
						]);
					}}
				>
					<Plus className="h-4 w-4" aria-hidden="true" />
					Adicionar etapa
				</button>
			</section>

			<section className="flex flex-col gap-3">
				<h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
					Informações do evento
				</h4>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					<div className="rounded-md bg-gray-50 px-3 py-2">
						<p className="text-xs text-gray-500">Transporte</p>
						<p className="text-sm font-medium text-gray-900">
							{transport ?? "—"}
						</p>
					</div>
					<label className="flex flex-col rounded-md bg-gray-50 px-3 py-2">
						<span className="text-xs text-gray-500">Público</span>
						<input
							className="bg-transparent text-sm font-medium text-gray-900 placeholder:font-normal placeholder:text-gray-400 focus:outline-none"
							placeholder="Ex.: 200"
							maxLength={40}
							value={audience}
							onChange={(input) => {
								onAudienceChange(input.target.value);
							}}
						/>
					</label>
					<div className="rounded-md bg-gray-50 px-3 py-2">
						<p className="text-xs text-gray-500">Tipo do evento</p>
						<p className="text-sm font-medium text-gray-900">
							{event.eventType ?? "—"}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3 rounded-md bg-gray-50 px-3 py-2">
					<span className="text-2xl" aria-hidden="true">
						{weather.forecast ? weatherSymbol(weather.forecast.code) : "🌡️"}
					</span>
					<div className="min-w-0">
						<p className="text-xs text-gray-500">
							Previsão do tempo
							{weather.forecast ? ` · ${weather.forecast.place}` : ""}
						</p>
						<p className="text-sm font-medium text-gray-900">
							{weather.forecast
								? forecastText(weather.forecast)
								: weather.isLoading
									? "Buscando a previsão..."
									: !weather.hasCity
										? "Informe a cidade no local do evento para ver a previsão"
										: weather.window === "later" && weather.opensOn
											? `Fica disponível a partir de ${format(parseISO(weather.opensOn), "dd/MM")}`
											: weather.window === "past"
												? "Evento já passou"
												: weather.isError
													? "Não foi possível buscar a previsão agora"
													: "Cidade não encontrada para a previsão"}
						</p>
					</div>
					<span className="ml-auto hidden text-[10px] text-gray-400 sm:block">
						Open-Meteo
					</span>
				</div>
				<label className="flex flex-col gap-1">
					<span className="text-xs text-gray-500">Informações importantes</span>
					<textarea
						rows={3}
						maxLength={800}
						placeholder={
							"Figurino: preto, camisa lisa\nLocadora de som: da casa\nTécnico: Lekinho"
						}
						className={`${inputClass} w-full`}
						value={notes}
						onChange={(input) => {
							onNotesChange(input.target.value);
						}}
					/>
				</label>
			</section>
		</div>
	);
};
