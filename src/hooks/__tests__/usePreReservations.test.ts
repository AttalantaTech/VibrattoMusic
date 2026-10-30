import { describe, expect, it } from "vitest";
import type { ProposalResponse, ScheduleApiResponse } from "@/api/types";
import { pendingPreReservations } from "../usePreReservations";

const proposal = (id: number, status: string, date: string) =>
	({
		id,
		status: { id: 1, nome: status },
		dataInicio: `${date}T00:00:00`,
		contratante: { id: 1, nome: "Maria Souza" },
		produtoMusicalContratante: null,
		tipoEvento: { id: 1, nome: "Casamento" },
	}) as unknown as ProposalResponse;

const day = (date: string, status: ScheduleApiResponse["status"]) =>
	({
		data: `${date}T00:00:00`,
		status,
		compromissos: [],
	}) as ScheduleApiResponse;

const TODAY = "2026-10-30";

// Dates promised by an accepted proposal that the agenda doesn't block yet
describe("pre-reservations", () => {
	it("an accepted proposal on a free day is a pre-reservation", () => {
		const result = pendingPreReservations(
			[proposal(1, "Aceita", "2026-12-20")],
			[day("2026-12-20", "Livre")],
			TODAY
		);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			date: "2026-12-20",
			client: "Maria Souza",
		});
	});

	it("signed, waiting for payment and paid also count", () => {
		const result = pendingPreReservations(
			[
				proposal(1, "AguardandoPagamento", "2026-12-20"),
				proposal(2, "ContratacaoConcluida", "2026-12-21"),
			],
			[],
			TODAY
		);
		expect(result.map((r) => r.proposal.id)).toEqual([1, 2]);
	});

	it("is gone once the day is blocked (Ocupado)", () => {
		expect(
			pendingPreReservations(
				[proposal(1, "Aceita", "2026-12-20")],
				[day("2026-12-20", "Ocupado")],
				TODAY
			)
		).toEqual([]);
	});

	it("an event that still allows others (A Consultar) doesn't reserve the date", () => {
		expect(
			pendingPreReservations(
				[proposal(1, "Aceita", "2026-12-20")],
				[day("2026-12-20", "OcupadoComEspaco")],
				TODAY
			)
		).toHaveLength(1);
	});

	it("pending, refused or past proposals don't count", () => {
		expect(
			pendingPreReservations(
				[
					proposal(1, "Pendente", "2026-12-20"),
					proposal(2, "Rejeitada", "2026-12-20"),
					proposal(3, "Aceita", "2026-10-01"),
				],
				[],
				TODAY
			)
		).toEqual([]);
	});

	it("comes sorted by date", () => {
		const result = pendingPreReservations(
			[
				proposal(1, "Aceita", "2027-01-10"),
				proposal(2, "Aceita", "2026-11-05"),
			],
			[],
			TODAY
		);
		expect(result.map((r) => r.date)).toEqual(["2026-11-05", "2027-01-10"]);
	});
});
