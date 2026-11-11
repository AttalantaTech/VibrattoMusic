import { describe, expect, it } from "vitest";
import { buildStatusMessage } from "../messageTemplates";
import {
	isHiringConcludedCard,
	proposalsAwaitingConclusionCard,
} from "../hiringConcluded";

// As entityLinks builds them (the address of the site comes from the .env)
const progressLink = (id: number) => ({
	label: "Acompanhar contratação",
	url: `https://vibratto.test/band/me?tab=hires&id=${id}&andamento=1`,
});

const card = (
	type: Parameters<typeof buildStatusMessage>[0],
	id: number,
	payload: object = {}
) => ({
	conteudo: buildStatusMessage(type, {
		link: progressLink(id),
		...payload,
	} as never),
});

// Shown in the middle of the conversation, for both sides
describe("conclusion card", () => {
	it("is recognized by its title and its link", () => {
		expect(isHiringConcludedCard(card("hiringConcluded", 12).conteudo)).toBe(
			true
		);
	});

	it("other cards and typed messages aren't", () => {
		expect(isHiringConcludedCard(card("proposalAccepted", 12).conteudo)).toBe(
			false
		);
		expect(isHiringConcludedCard("<p>Contratação concluída!</p>")).toBe(false);
	});
});

// The chat sends "Contratação concluída" once, when the hiring is concluded
// outside the screen (last signature on D4Sign)
describe("proposals waiting for the conclusion card", () => {
	it("an accepted proposal with no conclusion card waits for it", () => {
		expect(
			proposalsAwaitingConclusionCard([card("proposalAccepted", 12)])
		).toEqual([12]);
	});

	it("a confirmed down payment still waits for the conclusion", () => {
		expect(
			proposalsAwaitingConclusionCard([
				card("proposalAccepted", 12),
				card("proposalPaidSign", 12, { contractSigned: false }),
			])
		).toEqual([12]);
	});

	it("the card is sent only once", () => {
		expect(
			proposalsAwaitingConclusionCard([
				card("proposalAccepted", 12),
				card("hiringConcluded", 12),
			])
		).toEqual([]);
	});

	it("old down payment cards that already said it was concluded count", () => {
		expect(
			proposalsAwaitingConclusionCard([
				card("proposalAccepted", 12),
				{
					conteudo: `${card("proposalPaidSign", 12).conteudo} A contratação está concluída.`,
				},
			])
		).toEqual([]);
	});

	it("a canceled or refused proposal doesn't wait for anything", () => {
		expect(
			proposalsAwaitingConclusionCard([
				card("proposalAccepted", 12),
				card("proposalCanceled", 12),
				card("proposalRejected", 13, { reason: "Valor" }),
			])
		).toEqual([]);
	});

	it("each proposal of the conversation is followed on its own", () => {
		expect(
			proposalsAwaitingConclusionCard([
				card("proposalAccepted", 12),
				card("hiringConcluded", 12),
				card("proposalAccepted", 15),
				{ conteudo: "<p>Combinado, até lá!</p>" },
			])
		).toEqual([15]);
	});

	it("the proposal created card (Ver proposta) isn't followed", () => {
		expect(
			proposalsAwaitingConclusionCard([
				{
					conteudo: buildStatusMessage("contractCreated", {
						link: {
							label: "Ver proposta",
							url: "https://vibratto.test/band/me?tab=hires&id=12",
						},
					}),
				},
			])
		).toEqual([]);
	});
});
