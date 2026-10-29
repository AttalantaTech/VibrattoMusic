import { describe, expect, it } from "vitest";
import {
	hasContract,
	proposalStatusFilters,
	proposalStatusLabel,
} from "../ProposalStatusCard/types";

// Statuses from the flow approved on 26/10/2026
describe("proposal statuses", () => {
	it.each([
		["AguardandoPagamento", "Aguardando Pagamento"],
		["ContratacaoConcluida", "Contratação Concluída"],
		["Substituida", "Substituída"],
		["Pendente", "Pendente"],
	])("shows %s as '%s'", (status, label) => {
		expect(proposalStatusLabel(status)).toBe(label);
	});

	it("splits an unknown status into words instead of hiding it", () => {
		expect(proposalStatusLabel("NovoStatus")).toBe("Novo Status");
	});

	it("the Vendas/Contratações filters list the new statuses, not the old ones", () => {
		expect(proposalStatusFilters).toEqual(
			expect.arrayContaining(["AguardandoPagamento", "ContratacaoConcluida"])
		);
		expect(proposalStatusFilters).not.toContain("SinalPago");
		expect(proposalStatusFilters).not.toContain("ContratoAssinado");
	});

	describe("hasContract", () => {
		it.each(["Aceita", "AguardandoPagamento", "ContratacaoConcluida"])(
			"%s already has a contract",
			(status) => {
				expect(hasContract(status)).toBe(true);
			}
		);

		it.each(["Pendente", "Rejeitada", "Cancelada", "Vencida", "Substituida"])(
			"%s has no contract (only the proposal)",
			(status) => {
				expect(hasContract(status)).toBe(false);
			}
		);
	});
});
