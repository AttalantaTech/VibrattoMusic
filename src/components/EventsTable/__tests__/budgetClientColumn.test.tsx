import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { BudgetResponse } from "@/api/types";
import { EventsTable } from "..";

const budget = (overrides: Partial<BudgetResponse>): BudgetResponse => ({
	id: 1,
	identificadorUnico: "x",
	contratante: { id: 63, nome: "Danilo de Palma" },
	produtoMusicalContratante: { id: 0, nome: "" },
	produtoMusical: { id: 878, nome: "DJ Danilo" },
	tipoEvento: { id: 2, nome: "Casamentos" },
	descricao: "Casamento",
	local: "Agudos - SP",
	dataEvento: "2026-12-28T00:00:00",
	horaInicio: null,
	duracao: "01:00:00",
	enviado: false,
	dataCriacao: "",
	dataAtualizacao: "",
	...overrides,
});

const renderRows = (budgets: Array<BudgetResponse>) =>
	render(
		<EventsTable
			mode="budgets"
			dataBudgets={budgets.map((item) => ({
				budget: item,
				createProposal: vi.fn(),
			}))}
		/>
	);

describe("Cliente column of the budget requests", () => {
	it("a request from a professional profile shows the profile, then the person", () => {
		renderRows([
			budget({
				produtoMusicalContratante: { id: 880, nome: "Engenheiro de Som" },
			}),
		]);

		// The table is drawn for desktop and for phones: check every copy
		const cells = screen
			.getAllByText("Engenheiro de Som")
			.map((name) => name.parentElement?.textContent);
		expect(cells.length).toBeGreaterThan(0);
		for (const cell of cells)
			expect(cell).toBe("Engenheiro de SomDanilo de Palma");
	});

	it("a client's own request shows only the person", () => {
		renderRows([budget({})]);

		expect(screen.getAllByText("Danilo de Palma").length).toBeGreaterThan(0);
		expect(screen.queryByText("Engenheiro de Som")).toBeNull();
	});
});
