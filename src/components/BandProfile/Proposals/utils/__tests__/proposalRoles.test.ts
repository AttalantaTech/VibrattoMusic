import { describe, expect, it } from "vitest";
import type { ProposalResponse, User } from "@/api/types";
import { proposalRoles } from "../proposalRoles";

const proposal = (status: string) =>
	({
		status: { id: 1, nome: status },
		contratante: { id: 7, nome: "Maria" },
		produtoMusicalContratante: { id: 0, nome: "" },
	}) as unknown as ProposalResponse;

const contractor = { id: 7 } as User;
const band = { id: 99 } as User;

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

	it("nobody confirms the down payment before the contract is signed", () => {
		expect(
			proposalRoles({
				proposal: proposal("Aceita"),
				user: band,
				productContractorId: 3,
			}).needsContractorPaidSign
		).toBe(false);
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
