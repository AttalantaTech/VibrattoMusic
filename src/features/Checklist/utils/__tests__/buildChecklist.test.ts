import { describe, expect, it } from "vitest";
import type { ProposalResponse, ScheduleApiResponse } from "@/api/types";
import {
	buildChecklist,
	buildEvents,
	isDueSoon,
	manualToEvent,
	sortEvents,
	progressOf,
} from "../buildChecklist";
import { clientShareText } from "../shareText";
import { DEFAULT_TEMPLATE } from "../defaultTemplate";
import { emptyEventState, type ProfileReadiness } from "../../types";

const proposal = (over: Partial<ProposalResponse> = {}): ProposalResponse =>
	({
		id: 10,
		identificadorUnico: "abc",
		contratante: { id: 1, nome: "Ana" },
		produtoMusicalContratante: null,
		tipoEvento: { id: 1, nome: "Casamento" },
		local: "Valinhos",
		dataInicio: "2026-11-22T00:00:00",
		horaInicio: "20:00:00",
		status: { id: 2, nome: "Aceita" },
		assinaturaContratante: true,
		assinaturaContratado: false,
		possuiSinalPagamento: true,
		sinalPago: false,
		transporteIncluso: true,
		acomodacaoInclusa: false,
		camarimIncluso: true,
		estruturaPalcoSomIluminacaoInclusa: false,
		...over,
	}) as unknown as ProposalResponse;

const day = (
	data: string,
	compromissos: Array<{ id: number; titulo: string }> = [],
	status: ScheduleApiResponse["status"] = "Livre"
): ScheduleApiResponse =>
	({
		data,
		status,
		compromissos: compromissos.map((c) => ({
			...c,
			descricao: "",
			localizacao: "Bar do Zé",
			data,
			horaInicio: "21:00:00",
			horaFim: null,
			disponibilidadeOutrosEventos: false,
		})),
	}) as ScheduleApiResponse;

const fullProfile: ProfileReadiness = {
	rider: true,
	stageMap: true,
	dressingRoom: false,
};

describe("events of the checklist", () => {
	it("takes hired proposals and leaves out pending or refused ones", () => {
		const events = buildEvents(
			[
				proposal(),
				proposal({ id: 11, status: { id: 1, nome: "Pendente" } }),
				proposal({ id: 12, status: { id: 3, nome: "Rejeitada" } }),
			],
			[]
		);
		expect(events.map((e) => e.key)).toEqual(["proposta-10"]);
		expect(events[0]?.title).toBe("Casamento · Ana");
	});

	it("adds the agenda's own events as outside the platform", () => {
		const events = buildEvents(
			[],
			[day("2026-11-28", [{ id: 5, titulo: "Show no bar" }])]
		);
		expect(events[0]).toMatchObject({
			key: "agenda-5",
			origin: "fora",
			title: "Show no bar",
			place: "Bar do Zé",
			inAgenda: true,
		});
	});

	it("doesn't count the hired event twice when it was saved in the agenda", () => {
		const events = buildEvents(
			[proposal()],
			[day("2026-11-22", [{ id: 7, titulo: "Casamento Ana" }], "Ocupado")]
		);
		expect(events.map((e) => e.key)).toEqual(["proposta-10"]);
		expect(events[0]?.inAgenda).toBe(true);
	});

	it("keeps one copy of a commitment read in two months", () => {
		const repeated = day("2026-11-28", [{ id: 5, titulo: "Show" }]);
		expect(buildEvents([], [repeated, repeated])).toHaveLength(1);
	});

	it("puts the events in date order", () => {
		const events = buildEvents(
			[proposal({ id: 20, dataInicio: "2026-12-05T00:00:00" }), proposal()],
			[day("2026-11-28", [{ id: 5, titulo: "Show" }])]
		);
		expect(events.map((e) => e.date)).toEqual([
			"2026-11-22",
			"2026-11-28",
			"2026-12-05",
		]);
	});
});

describe("items of an event", () => {
	const [event] = buildEvents([proposal()], []);
	if (!event) throw new Error("no event");

	it("checks by itself what the platform knows", () => {
		const items = buildChecklist(
			event,
			DEFAULT_TEMPLATE,
			emptyEventState(),
			fullProfile
		);
		const auto = Object.fromEntries(
			items.filter((i) => i.auto).map((i) => [i.label, i.done])
		);
		expect(auto).toEqual({
			"Proposta aceita": true,
			"Contrato assinado pelos dois lados": false,
			"Sinal recebido": false,
			"Contratação concluída": false,
			"Data bloqueada na agenda": false,
			"Rider técnico no perfil": true,
			"Mapa de palco no perfil": true,
			"Camarim definido no perfil": false,
		});
	});

	it("says whose signature is missing", () => {
		const items = buildChecklist(event, [], emptyEventState(), fullProfile);
		expect(items.find((i) => i.id === "auto-contrato")?.detail).toBe(
			"Falta a sua assinatura"
		);
	});

	it("has no down payment line when the proposal has none", () => {
		const [noDown] = buildEvents(
			[proposal({ possuiSinalPagamento: false })],
			[]
		);
		if (!noDown) throw new Error("no event");
		const items = buildChecklist(noDown, [], emptyEventState(), fullProfile);
		expect(items.some((i) => i.id === "auto-sinal")).toBe(false);
	});

	it("turns what the proposal includes into things to arrange", () => {
		const items = buildChecklist(event, [], emptyEventState(), fullProfile);
		const labels = items
			.filter((i) => i.source === "proposta")
			.map((i) => i.label);
		expect(labels).toEqual([
			"Transporte combinado (incluído na proposta)",
			"Camarim pronto conforme o combinado",
		]);
	});

	it("keeps the person's marks, removals and own items", () => {
		const items = buildChecklist(
			event,
			DEFAULT_TEMPLATE,
			{
				checked: { chegada: true, "item-x": true },
				removed: ["agua"],
				extra: [{ id: "item-x", label: "Levar banner", group: "equipamento" }],
			},
			fullProfile
		);
		expect(items.find((i) => i.id === "chegada")?.done).toBe(true);
		expect(items.some((i) => i.id === "agua")).toBe(false);
		expect(items.find((i) => i.id === "item-x")).toMatchObject({
			done: true,
			source: "evento",
		});
	});

	it("counts the progress", () => {
		const items = buildChecklist(event, [], emptyEventState(), fullProfile);
		expect(progressOf(items)).toEqual({ done: 3, total: 10 });
	});
});

describe("reminder and sharing", () => {
	const [event] = buildEvents([proposal()], []);
	if (!event) throw new Error("no event");
	const items = buildChecklist(
		event,
		DEFAULT_TEMPLATE,
		emptyEventState(),
		fullProfile
	);

	it("warns about an event in the next 3 days with open items", () => {
		expect(isDueSoon(event, items, "2026-11-20")).toBe(true);
		expect(isDueSoon(event, items, "2026-11-10")).toBe(false);
		expect(isDueSoon(event, items, "2026-11-23")).toBe(false);
	});

	it("doesn't warn when everything is done", () => {
		const done = items.map((i) => ({ ...i, done: true }));
		expect(isDueSoon(event, done, "2026-11-20")).toBe(false);
	});

	it("writes the message for the client with only their items", () => {
		const text = clientShareText(event, items, "DJ Danilo");
		expect(text).toContain("Olá, Ana! Aqui é DJ Danilo.");
		expect(text).toContain("22/11/2026");
		expect(text).toContain("às 20:00, em Valinhos");
		expect(text).toContain("▫️ Ponto de energia próximo ao palco");
		expect(text).toContain("▫️ Camarim pronto conforme o combinado");
		expect(text).not.toContain("Cabos e pedestais");
	});
});

describe("standalone checklist (avulso)", () => {
	const manual = {
		id: "x1",
		title: "  Show na praça ",
		date: "2026-12-05",
		startTime: "19:30",
		client: "Prefeitura",
		place: "",
	};

	it("becomes an event of the list", () => {
		expect(manualToEvent(manual)).toMatchObject({
			key: "avulso-x1",
			origin: "avulso",
			title: "Show na praça",
			date: "2026-12-05",
			startTime: "19:30:00",
			client: "Prefeitura",
			place: null,
		});
	});

	it("has no agenda item, only the profile's", () => {
		const items = buildChecklist(
			manualToEvent(manual),
			[],
			emptyEventState(),
			fullProfile
		);
		expect(items.filter((i) => i.auto).map((i) => i.id)).toEqual([
			"auto-rider",
			"auto-mapa",
			"auto-camarim",
		]);
	});

	it("is listed by date with the other events", () => {
		const [hired] = buildEvents([proposal()], []);
		if (!hired) throw new Error("no event");
		expect(
			sortEvents([manualToEvent(manual), hired]).map((e) => e.origin)
		).toEqual(["vibratto", "avulso"]);
	});
});
