import type {
	Branding,
	ChecklistEvent,
	ScheduleRow,
	ScheduleStep,
} from "../types";

/**
 * The suggested schedule, as in the examples bands send: every step in
 * relation to the show, so each event gets its times by itself
 */
export const DEFAULT_SCHEDULE: Array<ScheduleStep> = [
	{
		id: "sede",
		label: "Chegada da produção na sede",
		anchor: "inicio",
		offset: -180,
	},
	{
		id: "montagem",
		label: "Montagem de backline",
		anchor: "inicio",
		offset: -120,
	},
	{
		id: "chegada",
		label: "Chegada da banda ao local",
		anchor: "inicio",
		offset: -60,
	},
	{ id: "passagem", label: "Passagem de som", anchor: "inicio", offset: -45 },
	{ id: "show", label: "SHOW-TIME", anchor: "inicio", offset: 0 },
	{ id: "termino", label: "Término do show", anchor: "fim", offset: 0 },
	{ id: "saida", label: "Saída do local", anchor: "fim", offset: 30 },
];

export const DEFAULT_BRANDING: Branding = {
	color: "#862D2D",
	logo: null,
	producer: { name: "", email: "", phone: "" },
	defaultNotes: "",
};

/** Colors offered first; any other can be picked */
export const COLOR_PRESETS = [
	"#862D2D",
	"#E91E8C",
	"#3B0A99",
	"#0F4C81",
	"#0E7C66",
	"#E07A1F",
	"#1F2937",
];

/** "18:00" or "18:00:00" → minutes of the day; null when empty or invalid */
export const toMinutes = (time: string | null | undefined): number | null => {
	const match = /^(\d{1,2}):(\d{2})/.exec(time ?? "");
	if (!match) return null;
	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
};

/** Minutes of the day → "HH:mm", across midnight both ways */
export const fromMinutes = (minutes: number): string => {
	const day = 24 * 60;
	const wrapped = ((minutes % day) + day) % day;
	return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(
		wrapped % 60
	).padStart(2, "0")}`;
};

/** "45 min antes do início", "30 min depois do término", "No início" */
export const describeOffset = (step: ScheduleStep): string => {
	const point = step.anchor === "inicio" ? "início" : "término";
	if (step.offset === 0) return `No ${point} do show`;
	const amount = Math.abs(step.offset);
	const text =
		amount >= 60
			? `${Math.floor(amount / 60)}h${amount % 60 ? String(amount % 60).padStart(2, "0") : ""}`
			: `${amount} min`;
	return `${text} ${step.offset < 0 ? "antes" : "depois"} do ${point}`;
};

/**
 * The event's times from the model. Steps tied to the end need the show's
 * end; without the start, every time stays empty for the person to fill
 */
export const calculateSchedule = (
	steps: Array<ScheduleStep>,
	event: Pick<ChecklistEvent, "startTime" | "endTime">
): Array<ScheduleRow> => {
	const start = toMinutes(event.startTime);
	const end = toMinutes(event.endTime);

	return steps.map((step) => {
		const base = step.anchor === "inicio" ? start : end;
		return {
			id: step.id,
			label: step.label,
			time: base === null ? "" : fromMinutes(base + step.offset),
		};
	});
};

/** "#E91E8C" → [233, 30, 140]; the Vibratto red when invalid */
export const hexToRgb = (hex: string): [number, number, number] => {
	const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
	const value = match?.[1] ?? "862D2D";
	return [
		Number.parseInt(value.slice(0, 2), 16),
		Number.parseInt(value.slice(2, 4), 16),
		Number.parseInt(value.slice(4, 6), 16),
	];
};

/** A light version of the color, for the backgrounds of the PDF's cards */
export const tint = (
	rgb: [number, number, number],
	amount = 0.88
): [number, number, number] =>
	rgb.map((channel) => Math.round(channel + (255 - channel) * amount)) as [
		number,
		number,
		number,
	];

/** "Por conta do contratante" / "Própria", from the proposal */
export const transportLabel = (event: ChecklistEvent): string | null => {
	if (!event.proposal) return null;
	return event.proposal.transport ? "Por conta do contratante" : "Própria";
};
