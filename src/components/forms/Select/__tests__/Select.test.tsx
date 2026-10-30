import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Select } from "../Select";

// The list loads more items as it scrolls; jsdom has no IntersectionObserver
window.IntersectionObserver = vi.fn().mockReturnValue({
	observe: vi.fn(),
	disconnect: vi.fn(),
}) as unknown as typeof IntersectionObserver;

const options = [
	{ value: "1", label: "Campinas - SP" },
	{ value: "2", label: "Santos - SP" },
];

describe("Select", () => {
	it("a single choice shows its name, not '1 selecionado'", () => {
		render(
			<Select
				label="Local do Evento"
				name="local"
				options={options}
				selectedOptions={[options[0]!]}
				setSelectedOptions={vi.fn()}
			/>
		);

		expect(screen.getByText("Campinas - SP")).toBeTruthy();
		expect(screen.queryByText("1 selecionado")).toBeNull();
	});

	it("a single choice is cleared with the x in the field", () => {
		const setSelected = vi.fn();
		render(
			<Select
				label="Local do Evento"
				name="local"
				options={options}
				selectedOptions={[options[0]!]}
				setSelectedOptions={setSelected}
			/>
		);

		fireEvent.click(screen.getByLabelText("Limpar seleção"));

		expect(setSelected).toHaveBeenCalledWith([]);
	});

	it("a server-searched list opens straight on the search field", () => {
		render(
			<Select
				label="Local do Evento"
				name="local"
				options={options}
				selectedOptions={[]}
				setSelectedOptions={vi.fn()}
				searchTerm=""
				setSearchTerm={vi.fn()}
			/>
		);

		fireEvent.click(screen.getByText("Selecionar..."));

		expect(document.activeElement?.id).toBe("local-search");
	});

	it("a short list doesn't grab the keyboard", () => {
		render(
			<Select
				label="Gêneros"
				name="generos"
				options={options}
				selectedOptions={[]}
				setSelectedOptions={vi.fn()}
			/>
		);

		fireEvent.click(screen.getByText("Selecionar..."));

		expect(document.activeElement?.id).not.toBe("generos-search");
	});

	it("a long list filters as you type (it used to ignore the text)", () => {
		const genres = [
			"Rock",
			"Samba",
			"Sertanejo",
			"Pagode",
			"Forró",
			"MPB",
			"Jazz",
			"Blues",
		].map((label, index) => ({ value: String(index), label }));
		render(
			<Select
				label="Gêneros"
				name="generos"
				options={genres}
				selectedOptions={[]}
				setSelectedOptions={vi.fn()}
			/>
		);

		fireEvent.click(screen.getByText("Selecionar..."));
		fireEvent.change(screen.getByPlaceholderText("Pesquisar..."), {
			target: { value: "sa" },
		});

		expect(screen.getByText("Samba")).toBeTruthy();
		expect(screen.queryByText("Rock")).toBeNull();
	});

	it("a long list (event types, genres) opens straight on the search field", () => {
		const eventTypes = [
			"Aniversários",
			"Casamentos",
			"Corporativo",
			"Formaturas",
			"Festas",
			"Shows",
		].map((label, index) => ({ value: String(index), label }));
		render(
			<Select
				label="Tipo de Evento"
				name="tipo"
				options={eventTypes}
				selectedOptions={[]}
				setSelectedOptions={vi.fn()}
			/>
		);

		fireEvent.click(screen.getByText("Selecionar..."));

		expect(document.activeElement?.id).toBe("tipo-search");
	});

	it("a short list has no search box", () => {
		render(
			<Select
				label="Tipo"
				name="tipo"
				options={options}
				selectedOptions={[]}
				setSelectedOptions={vi.fn()}
			/>
		);

		fireEvent.click(screen.getByText("Selecionar..."));

		expect(screen.queryByPlaceholderText("Pesquisar...")).toBeNull();
	});

	it("a required choice (CPF/CNPJ) has no x to clear", () => {
		render(
			<Select
				label="Tipo"
				name="tipo"
				options={options}
				selectedOptions={[options[0]!]}
				setSelectedOptions={vi.fn()}
				clearable={false}
			/>
		);

		expect(screen.queryByLabelText("Limpar seleção")).toBeNull();
	});
});
