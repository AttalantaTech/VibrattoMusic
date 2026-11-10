import { describe, expect, it } from "vitest";
import type { ProposalResponse, User } from "@/api/types";
import {
	acceptsCounterProposal,
	awaitsDownPayment,
	proposalRoles,
} from "../proposalRoles";

const proposal = (status: string) =>
	({
		status: { id: 1, nome: status },
		contratante: { id: 7, nome: "Maria" },
		produtoMusicalContratante: { id: 0, nome: "" },
	}) as unknown as ProposalResponse;

const contractor = { id: 7 } as User;
const band = { id: 99 } as User;

// Offers "Fazer Contraproposta" to the band, in Vendas and in the chat
describe("acceptsCounterProposal", () => {
	const refused = (status: string, aceitaContraProposta: boolean) => ({
		...proposal(status),
		aceitaContraProposta,
	});

	it("a refused proposal that asked for another one can be answered", () => {
		expect(acceptsCounterProposal(refused("Rejeitada", true))).toBe(true);
	});

	it("a plain refusal can't", () => {
		expect(acceptsCounterProposal(refused("Rejeitada", false))).toBe(false);
	});

	it("once answered (replaced) it can't be answered again", () => {
		expect(acceptsCounterProposal(refused("Substituida", true))).toBe(false);
	});
});

describe("proposalRoles", () => {
	it("recognizes the contractor by the user", () => {
		const roles = proposalRoles({
			proposal: proposal("Pendente"),
			user: contractor,
			productContractorId: null,
		});
		expect(roles.isContractor).toBe(true);
	});

	it("recognizes a musical product hiring another one", () => {
		const roles = proposalRoles({
			proposal: {
				...proposal("Pendente"),
				produtoMusicalContratante: { id: 5, nome: "Banda A" },
			},
			user: band,
			productContractorId: 5,
		});
		expect(roles.isContractor).toBe(true);
	});

	it("a pending proposal waits for an answer", () => {
		expect(
			proposalRoles({
				proposal: proposal("Pendente"),
				user: contractor,
				productContractorId: null,
			}).isWaitingForResponse
		).toBe(true);
	});

	it("only the band confirms the down payment, in 'Aguardando Pagamento'", () => {
		const forBand = proposalRoles({
			proposal: proposal("AguardandoPagamento"),
			user: band,
			productContractorId: 3,
		});
		const forContractor = proposalRoles({
			proposal: proposal("AguardandoPagamento"),
			user: contractor,
			productContractorId: null,
		});

		expect(forBand.needsContractorPaidSign).toBe(true);
		expect(forContractor.needsContractorPaidSign).toBe(false);
	});

	it("the band confirms the down payment already in Aceita, before the signatures", () => {
		expect(
			proposalRoles({
				proposal: { ...proposal("Aceita"), possuiSinalPagamento: true },
				user: band,
				productContractorId: 3,
			}).needsContractorPaidSign
		).toBe(true);
	});

	it("an accepted proposal without down payment has nothing to confirm", () => {
		expect(
			awaitsDownPayment({ ...proposal("Aceita"), possuiSinalPagamento: false })
		).toBe(false);
	});

	it("a paid down payment is not confirmed again", () => {
		for (const status of ["Aceita", "AguardandoPagamento"]) {
			expect(
				awaitsDownPayment({
					...proposal(status),
					possuiSinalPagamento: true,
					sinalPago: true,
				})
			).toBe(false);
		}
	});

	it("no confirmation while pending or after the hiring", () => {
		for (const status of ["Pendente", "ContratacaoConcluida", "Vencida"]) {
			expect(
				awaitsDownPayment({ ...proposal(status), possuiSinalPagamento: true })
			).toBe(false);
		}
	});

	it("'Contratação Concluída' is the signed and paid hiring", () => {
		expect(
			proposalRoles({
				proposal: proposal("ContratacaoConcluida"),
				user: band,
				productContractorId: 3,
			}).signedContract
		).toBe(true);
	});
});
