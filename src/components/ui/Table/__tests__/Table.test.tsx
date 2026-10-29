import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createColumnHelper } from "@tanstack/react-table";
import { GenericTable } from "../Table";

type Row = { nome: string };
const column = createColumnHelper<Row>();
const columns = [column.accessor("nome", { header: "Nome" })];

describe("GenericTable pagination", () => {
	it("hides the pagination of an empty list (it read 'Página 1 de 0')", () => {
		render(<GenericTable data={[]} columns={columns} />);

		expect(screen.queryByText(/Página/)).toBeNull();
	});

	it("shows the pages when there are rows", () => {
		const data = Array.from({ length: 12 }, (_, i) => ({ nome: `Item ${i}` }));
		render(<GenericTable data={data} columns={columns} pageSize={10} />);

		expect(screen.getByText("Página 1 de 2")).toBeTruthy();
	});
});
