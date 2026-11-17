import type { ProposalResponse, ScheduleApiResponse } from "@/api/types";
import type {
	ChecklistEvent,
	ChecklistItem,
	EventChecklistState,
	ProfileReadiness,
	TemplateItem,
} from "../types";

const day = (date: string): string => date.slice(0, 10);

/** Proposals that became a show: accepted, waiting for payment or concluded */
export const HIRED_STATUSES = [
	"Aceita",
	"AguardandoPagamento",
	"ContratacaoConcluida",
];

const clientOf = (proposal: ProposalResponse): string | null =>
	proposal.produtoMusicalContratante?.nome ||
	proposal.contratante?.nome ||
	proposal.nomeContratante ||
	null;

/**
 * The professional's events: hired through Vibratto (proposals) and added
 * by hand in the agenda (outside the platform). A commitment on the day of
 * a hired event is that same event, saved in the agenda: not a second one
 */
export const buildEvents = (
	proposals: Array<ProposalResponse>,
	schedule: Array<ScheduleApiResponse>
): Array<ChecklistEvent> => {
	const blockedDays = new Set(
		schedule
			.filter((s) => s.status === "Ocupado" || s.compromissos.length > 0)
			.map((s) => day(s.data))
	);

	const hired = proposals
		.filter((p) => HIRED_STATUSES.includes(p.status.nome))
		.map<ChecklistEvent>((p) => {
			const client = clientOf(p);
			const type = p.tipoEvento?.nome || p.nomeTipoEvento || null;

			return {
				key: `proposta-${p.id}`,
				origin: "vibratto",
				date: day(p.dataInicio),
				startTime: p.horaInicio,
				title: [type, client].filter(Boolean).join(" · ") || "Evento",
				client,
				place: p.local || null,
				eventType: type,
				inAgenda: blockedDays.has(day(p.dataInicio)),
				proposal: {
					id: p.id,
					identificadorUnico: p.identificadorUnico,
					status: p.status.nome,
					signedByClient: p.assinaturaContratante,
					signedByProfessional: p.assinaturaContratado,
					hasDownPayment: p.possuiSinalPagamento ?? false,
					downPaymentPaid: p.sinalPago ?? false,
					transport: p.transporteIncluso,
					lodging: p.acomodacaoInclusa,
					dressingRoom: p.camarimIncluso,
					stageStructure: p.estruturaPalcoSomIluminacaoInclusa ?? false,
				},
			};
		});

	const hiredDays = new Set(hired.map((event) => event.date));

	const outside = schedule.flatMap((s) =>
		s.compromissos
			.filter((c) => !hiredDays.has(day(c.data || s.data)))
			.map<ChecklistEvent>((c) => ({
				key: `agenda-${c.id}`,
				origin: "fora",
				date: day(c.data || s.data),
				startTime: c.horaInicio,
				title: c.titulo?.trim() || "Evento da agenda",
				client: null,
				place: c.localizacao?.trim() || null,
				eventType: null,
				inAgenda: true,
			}))
	);

	// The same commitment comes in every month asked for: keep one
	const unique = new Map<string, ChecklistEvent>();
	for (const event of [...hired, ...outside]) unique.set(event.key, event);

	return [...unique.values()].sort(
		(a, b) =>
			a.date.localeCompare(b.date) ||
			(a.startTime ?? "").localeCompare(b.startTime ?? "")
	);
};

/**
 * What the system checks by itself. Only what it can know for sure: a
 * missing signature or down payment stays unchecked with the reason
 */
const automaticItems = (
	event: ChecklistEvent,
	profile: ProfileReadiness
): Array<ChecklistItem> => {
	const items: Array<ChecklistItem> = [];
	const add = (id: string, label: string, done: boolean, detail: string) =>
		items.push({
			id: `auto-${id}`,
			label,
			group: "negocio",
			done,
			auto: true,
			detail,
			source: "auto",
		});

	const p = event.proposal;
	if (p) {
		add("aceita", "Proposta aceita", true, "Aceita pelo contratante");

		const signed = p.signedByClient && p.signedByProfessional;
		add(
			"contrato",
			"Contrato assinado pelos dois lados",
			signed,
			signed
				? "Assinado pelo contratante e por você"
				: !p.signedByClient && !p.signedByProfessional
					? "Falta a assinatura dos dois"
					: !p.signedByClient
						? "Falta a assinatura do contratante"
						: "Falta a sua assinatura"
		);

		if (p.hasDownPayment)
			add(
				"sinal",
				"Sinal recebido",
				p.downPaymentPaid,
				p.downPaymentPaid ? "Confirmado por você" : "Ainda não confirmado"
			);

		const concluded = p.status === "ContratacaoConcluida";
		add(
			"concluida",
			"Contratação concluída",
			concluded,
			concluded ? "Tudo certo na Vibratto" : "Ainda em andamento"
		);
	}

	add(
		"agenda",
		"Data bloqueada na agenda",
		event.inAgenda,
		event.inAgenda ? "Ocupada na sua agenda" : "Salve o evento na agenda"
	);
	add(
		"rider",
		"Rider técnico no perfil",
		profile.rider,
		profile.rider ? "Cadastrado" : "Cadastre em Conta > Mapas e técnico"
	);
	add(
		"mapa",
		"Mapa de palco no perfil",
		profile.stageMap,
		profile.stageMap ? "Cadastrado" : "Cadastre em Conta > Mapas e técnico"
	);
	add(
		"camarim",
		"Camarim definido no perfil",
		profile.dressingRoom,
		profile.dressingRoom ? "Definido" : "Defina em Conta > Mapas e técnico"
	);

	return items;
};

/** What the proposal says is included becomes something to arrange */
const proposalItems = (event: ChecklistEvent): Array<TemplateItem> => {
	const p = event.proposal;
	if (!p) return [];

	const items: Array<TemplateItem> = [];
	if (p.transport)
		items.push({
			id: "proposta-transporte",
			label: "Transporte combinado (incluído na proposta)",
			group: "logistica",
		});
	if (p.lodging)
		items.push({
			id: "proposta-hospedagem",
			label: "Hospedagem reservada (incluída na proposta)",
			group: "logistica",
		});
	if (p.stageStructure)
		items.push({
			id: "proposta-estrutura",
			label: "Estrutura de palco, som e iluminação (incluída na proposta)",
			group: "equipamento",
		});
	if (p.dressingRoom)
		items.push({
			id: "proposta-camarim",
			label: "Camarim pronto conforme o combinado",
			group: "contratante",
		});

	return items;
};

/** Every line of one event's checklist, in the order of the groups */
export const buildChecklist = (
	event: ChecklistEvent,
	template: Array<TemplateItem>,
	state: EventChecklistState,
	profile: ProfileReadiness
): Array<ChecklistItem> => {
	const removed = new Set(state.removed);
	const manual = (item: TemplateItem, source: ChecklistItem["source"]) => ({
		...item,
		done: !!state.checked[item.id],
		auto: false,
		source,
	});

	return [
		...automaticItems(event, profile),
		...proposalItems(event)
			.filter((item) => !removed.has(item.id))
			.map((item) => manual(item, "proposta")),
		...template
			.filter((item) => !removed.has(item.id))
			.map((item) => manual(item, "modelo")),
		...state.extra.map((item) => manual(item, "evento")),
	];
};

export const progressOf = (
	items: Array<ChecklistItem>
): { done: number; total: number } => ({
	done: items.filter((item) => item.done).length,
	total: items.length,
});

/**
 * Events in the next few days with something still open: the reminder at
 * the top of the screen (the back-end will send it by e-mail/notification)
 */
export const isDueSoon = (
	event: ChecklistEvent,
	items: Array<ChecklistItem>,
	today: string,
	days = 3
): boolean => {
	const limit = new Date(`${today}T12:00:00`);
	limit.setDate(limit.getDate() + days);
	const last = limit.toISOString().slice(0, 10);

	return (
		event.date >= today &&
		event.date <= last &&
		items.some((item) => !item.done)
	);
};
