import { describe, expect, it } from "vitest";
import type { ChecklistEvent, ChecklistItem } from "../../types";
import {
	buildChecklistPdf,
	checklistFileName,
	pdfSections,
} from "../checklistPdf";

const event: ChecklistEvent = {
	key: "proposta-10",
	origin: "vibratto",
	date: "2026-11-22",
	startTime: "20:00:00",
	title: "Casamento · Ana & João",
	client: "Ana",
	place: "Valinhos - SP",
	eventType: "Casamento",
	inAgenda: true,
};

const item = (
	id: string,
	group: ChecklistItem["group"],
	done = false
): ChecklistItem => ({
	id,
	label: `Item ${id}`,
	group,
	done,
	auto: group === "negocio",
	detail: group === "negocio" ? "Assinado" : undefined,
	source: group === "negocio" ? "auto" : "modelo",
});

const items = [
	item("a", "negocio", true),
	item("b", "logistica"),
	item("c", "contratante"),
	item("d", "contratante", true),
];

describe("checklist PDF", () => {
	it("names the file by date and event, without accents or symbols", () => {
		expect(checklistFileName(event)).toBe(
			"checklist-2026-11-22-casamento-ana-joao.pdf"
		);
	});

	it("has only the client's items when it goes to the client", () => {
		const sections = pdfSections(items, "contratante");
		expect(sections).toHaveLength(1);
		expect(sections[0]?.items.map((i) => i.id)).toEqual(["c", "d"]);
	});

	it("has every group with items in the complete version", () => {
		expect(pdfSections(items, "completo").map((s) => s.title)).toEqual([
			"Negócio",
			"Logística",
			"Com o contratante",
		]);
	});

	it("is a real PDF file", async () => {
		const pdf = await buildChecklistPdf({
			event,
			items,
			professional: "DJ Danilo",
			scope: "completo",
		});
		expect(pdf.type).toBe("application/pdf");
		// The test browser (jsdom) has no Blob.arrayBuffer: read it like a file
		const bytes = await new Promise<ArrayBuffer>((resolve) => {
			const reader = new FileReader();
			reader.onload = () => {
				resolve(reader.result as ArrayBuffer);
			};
			reader.readAsArrayBuffer(pdf);
		});
		const head = new TextDecoder().decode(new Uint8Array(bytes).slice(0, 5));
		expect(head).toBe("%PDF-");
	});
});

describe("team schedule PDF", () => {
	it("is named as a schedule", () => {
		expect(checklistFileName(event, "equipe")).toBe(
			"cronograma-2026-11-22-casamento-ana-joao.pdf"
		);
	});

	it("is a real PDF with the band's color, logo and schedule", async () => {
		// A 1x1 PNG as the band's logo
		const logo =
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
		const pdf = await buildChecklistPdf({
			event,
			items,
			professional: "DJ Danilo",
			scope: "equipe",
			branding: {
				color: "#E91E8C",
				logo,
				producer: {
					name: "Franklin Agra",
					email: "",
					phone: "(82) 9.8202-8490",
				},
				defaultNotes: "",
			},
			logo,
			schedule: [
				{ id: "a", time: "17:15", label: "Passagem de som" },
				{ id: "b", time: "18:00", label: "SHOW-TIME" },
			],
			audience: "200",
			notes: "Figurino: preto\nTécnico: Lekinho",
			includeItems: true,
		});
		expect(pdf.type).toBe("application/pdf");
	});
});
