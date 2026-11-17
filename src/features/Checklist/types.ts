/**
 * Checklist of each event of a professional profile: what must be ready for
 * that show. Part is checked by the system (it already knows), part comes
 * from the professional's own model, part is added only to that event
 */

export type ChecklistGroup =
	| "negocio"
	| "logistica"
	| "equipamento"
	| "contratante"
	| "depois";

export const GROUPS: Array<{
	id: ChecklistGroup;
	label: string;
	hint?: string;
}> = [
	{
		id: "negocio",
		label: "Negócio",
		hint: "Marcado sozinho com o que a Vibratto já sabe",
	},
	{ id: "logistica", label: "Logística" },
	{ id: "equipamento", label: "Equipamento" },
	{
		id: "contratante",
		label: "Com o contratante",
		hint: "Pode ser compartilhado com quem contratou",
	},
	{ id: "depois", label: "Depois do evento" },
];

/** An item of the professional's model, copied into every event */
export interface TemplateItem {
	id: string;
	label: string;
	group: Exclude<ChecklistGroup, "negocio">;
}

/** What the person did on one event: kept until the back-end stores it */
export interface EventChecklistState {
	/** Manual items checked, by item id */
	checked: Record<string, boolean>;
	/** Items added only to this event */
	extra: Array<TemplateItem>;
	/** Model items removed only from this event */
	removed: Array<string>;
	/** The event's schedule, once the person changed it (else calculated) */
	schedule?: Array<ScheduleRow>;
	/** Expected audience, as typed ("200", "150 convidados") */
	audience?: string;
	/** "Informações importantes" of this event (figurino, som, técnico) */
	notes?: string;
}

/**
 * A step of the professional's schedule model, in relation to the show:
 * "Passagem de som, 45 min before the start". The times of each event are
 * calculated from the show's start and end
 */
export interface ScheduleStep {
	id: string;
	label: string;
	anchor: "inicio" | "fim";
	/** Minutes from the anchor: -45 is 45 min before */
	offset: number;
}

/** A line of an event's schedule: "17:15 Passagem de som" */
export interface ScheduleRow {
	id: string;
	/** HH:mm, or "" while the show's time isn't known */
	time: string;
	label: string;
}

/**
 * The band's look on the PDFs: one main color, the logo (only when the
 * band has one) and the producer's contact in the footer
 */
export interface Branding {
	/** #RRGGBB */
	color: string;
	/** DEMO: logo sent on this screen, as data; the profile's logomarca wins */
	logo: string | null;
	producer: { name: string; email: string; phone: string };
	/** Text that every new event starts with in "Informações importantes" */
	defaultNotes: string;
}

export const emptyEventState = (): EventChecklistState => ({
	checked: {},
	extra: [],
	removed: [],
});

export type EventOrigin = "vibratto" | "fora" | "avulso";

export const ORIGIN_LABEL: Record<
	EventOrigin,
	{ long: string; short: string }
> = {
	vibratto: { long: "Contratado pela Vibratto", short: "Vibratto" },
	fora: { long: "Fora da plataforma", short: "Fora da plataforma" },
	avulso: { long: "Checklist avulso", short: "Avulso" },
};

/**
 * A checklist made by hand on the Checklist screen, like a standalone
 * proposal: for an event that isn't a proposal nor in the agenda
 */
export interface ManualEvent {
	id: string;
	title: string;
	/** yyyy-MM-dd */
	date: string;
	/** HH:mm, or empty */
	startTime: string;
	/** HH:mm, or empty */
	endTime?: string;
	client: string;
	place: string;
}

/** An event of the agenda: hired through Vibratto or added by hand */
export interface ChecklistEvent {
	/** "proposta-123" or "agenda-45": the key of its checklist */
	key: string;
	/** "avulso": created on the Checklist screen, not tied to the agenda */
	origin: EventOrigin;
	/** Event day, yyyy-MM-dd */
	date: string;
	startTime: string | null;
	/** End of the show (HH:mm:ss), when known */
	endTime: string | null;
	title: string;
	/** Who hired, when known */
	client: string | null;
	place: string | null;
	eventType: string | null;
	/** The proposal behind the event, for the automatic items */
	proposal?: {
		id: number;
		identificadorUnico: string;
		status: string;
		signedByClient: boolean;
		signedByProfessional: boolean;
		hasDownPayment: boolean;
		downPaymentPaid: boolean;
		transport: boolean;
		lodging: boolean;
		dressingRoom: boolean;
		stageStructure: boolean;
	};
	/** The day is blocked in the agenda ("Ocupado") or has a commitment */
	inAgenda: boolean;
}

/** What the profile already has, for the automatic items of every event */
export interface ProfileReadiness {
	rider: boolean;
	stageMap: boolean;
	dressingRoom: boolean;
}

/** One line of an event's checklist, as shown */
export interface ChecklistItem {
	id: string;
	label: string;
	group: ChecklistGroup;
	done: boolean;
	/** Checked by the system: the person can't change it by hand */
	auto: boolean;
	/** Why it is (or isn't) checked, for automatic items */
	detail?: string;
	/** Came from the model (removable from this event) or added here */
	source: "auto" | "modelo" | "evento" | "proposta";
}
