import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ProposalResponse } from "@/api/types";
import { ConfirmDownPaymentDialog } from "../ConfirmDownPaymentDialog";

const proposal = {
	id: 7,
	valor: 5000,
	tipoSinalPagamento: "P",
	valorSinalPagamento: 30,
	contratante: { id: 1, nome: "Maria" },
	status: { id: 1, nome: "AguardandoPagamento" },
} as unknown as ProposalResponse;

// Confirming notifies the client (and may conclude the hiring), so it asks first
describe("ConfirmDownPaymentDialog", () => {
	it("shows the amount and the client before confirming", () => {
		render(
			<ConfirmDownPaymentDialog
				proposal={proposal}
				onConfirm={vi.fn()}
				onClose={vi.fn()}
			/>
		);

		expect(screen.getByText(/R\$ 1\.500,00/)).toBeTruthy();
		expect(screen.getByText("Maria")).toBeTruthy();
	});

	it("confirms that proposal", () => {
		const onConfirm = vi.fn(() => Promise.resolve());
		render(
			<ConfirmDownPaymentDialog
				proposal={proposal}
				onConfirm={onConfirm}
				onClose={vi.fn()}
			/>
		);

		fireEvent.click(screen.getByText("Confirmar Recebimento"));

		expect(onConfirm).toHaveBeenCalledWith(proposal);
	});

	it("'Voltar' closes without confirming", () => {
		const onConfirm = vi.fn();
		const onClose = vi.fn();
		render(
			<ConfirmDownPaymentDialog
				proposal={proposal}
				onConfirm={onConfirm}
				onClose={onClose}
			/>
		);

		fireEvent.click(screen.getByText("Voltar"));

		expect(onClose).toHaveBeenCalled();
		expect(onConfirm).not.toHaveBeenCalled();
	});

	it("after both signed, says the hiring will be concluded", () => {
		render(
			<ConfirmDownPaymentDialog
				proposal={proposal}
				onConfirm={vi.fn()}
				onClose={vi.fn()}
			/>
		);

		expect(
			screen.getByText(/a contratação será concluída e o cliente/)
		).toBeTruthy();
	});

	it("before the signatures, says the hiring still waits for them", () => {
		render(
			<ConfirmDownPaymentDialog
				proposal={{ ...proposal, status: { id: 2, nome: "Aceita" } }}
				onConfirm={vi.fn()}
				onClose={vi.fn()}
			/>
		);

		expect(screen.getByText(/assinado pelas duas partes/)).toBeTruthy();
	});

	it("stays closed without a proposal", () => {
		render(
			<ConfirmDownPaymentDialog
				proposal={null}
				onConfirm={vi.fn()}
				onClose={vi.fn()}
			/>
		);

		expect(screen.queryByText("Confirmar Recebimento do Sinal")).toBeNull();
	});
});
