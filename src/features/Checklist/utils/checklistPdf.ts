import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GROUPS, type ChecklistEvent, type ChecklistItem } from "../types";

/** "contratante": what the client must have ready; "completo": everything */
export type PdfScope = "contratante" | "completo";

// Vibratto's red (primary-600 / primary-700), as RGB for the PDF
const BRAND: [number, number, number] = [134, 45, 45];
const BRAND_DARK: [number, number, number] = [111, 32, 32];
const TEXT: [number, number, number] = [31, 41, 55];
const MUTED: [number, number, number] = [107, 114, 128];
const DONE: [number, number, number] = [22, 163, 74];

const slug = (text: string): string =>
	text
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 40);

/** checklist-2026-11-22-casamento-ana.pdf */
export const checklistFileName = (event: ChecklistEvent): string =>
	`checklist-${event.date}-${slug(event.title) || "evento"}.pdf`;

/** The items that go to the PDF, by group, in the screen's order */
export const pdfSections = (
	items: Array<ChecklistItem>,
	scope: PdfScope
): Array<{ title: string; items: Array<ChecklistItem> }> => {
	if (scope === "contratante")
		return [
			{
				title: "Itens para o contratante",
				items: items.filter((item) => item.group === "contratante"),
			},
		];

	return GROUPS.map((group) => ({
		title: group.label,
		items: items.filter((item) => item.group === group.id),
	})).filter((section) => section.items.length > 0);
};

/**
 * The event's checklist as an A4 PDF, made in the browser. jsPDF is loaded
 * only here, when someone asks for the file
 */
export const buildChecklistPdf = async ({
	event,
	items,
	professional,
	scope,
}: {
	event: ChecklistEvent;
	items: Array<ChecklistItem>;
	professional: string;
	scope: PdfScope;
}): Promise<Blob> => {
	const { jsPDF } = await import("jspdf");
	const pdf = new jsPDF({ unit: "mm", format: "a4" });

	const pageWidth = pdf.internal.pageSize.getWidth();
	const pageHeight = pdf.internal.pageSize.getHeight();
	const margin = 18;
	const contentWidth = pageWidth - margin * 2;
	const bottom = pageHeight - 20;
	let y = 0;

	const color = (rgb: [number, number, number]) => {
		pdf.setTextColor(rgb[0], rgb[1], rgb[2]);
	};
	const ensureRoom = (height: number) => {
		if (y + height > bottom) {
			pdf.addPage();
			y = 20;
		}
	};

	// Header band
	pdf.setFillColor(BRAND[0], BRAND[1], BRAND[2]);
	pdf.rect(0, 0, pageWidth, 26, "F");
	pdf.setFont("helvetica", "bold");
	pdf.setFontSize(16);
	color([255, 255, 255]);
	pdf.text(
		scope === "contratante" ? "Checklist para o evento" : "Checklist do evento",
		margin,
		16
	);
	pdf.setFont("helvetica", "normal");
	pdf.setFontSize(10);
	if (professional)
		pdf.text(professional, pageWidth - margin, 16, { align: "right" });
	y = 38;

	// Event
	pdf.setFont("helvetica", "bold");
	pdf.setFontSize(14);
	color(TEXT);
	const title = pdf.splitTextToSize(event.title, contentWidth) as Array<string>;
	pdf.text(title, margin, y);
	y += title.length * 6 + 2;

	const when = format(parseISO(event.date), "dd/MM/yyyy (EEEE)", {
		locale: ptBR,
	});
	const details: Array<[string, string | null]> = [
		["Data", when],
		["Horário", event.startTime ? event.startTime.slice(0, 5) : null],
		["Local", event.place],
		["Contratante", event.client],
	];
	pdf.setFontSize(10);
	for (const [label, value] of details) {
		if (!value) continue;
		pdf.setFont("helvetica", "bold");
		color(MUTED);
		pdf.text(`${label}:`, margin, y);
		pdf.setFont("helvetica", "normal");
		color(TEXT);
		const lines = pdf.splitTextToSize(
			value,
			contentWidth - 28
		) as Array<string>;
		pdf.text(lines, margin + 28, y);
		y += lines.length * 5 + 1;
	}

	if (scope === "contratante") {
		y += 3;
		pdf.setFontSize(10);
		color(MUTED);
		const note = pdf.splitTextToSize(
			"Por favor, confira se estes itens estarão prontos no dia do evento. Qualquer dúvida, fale com a gente.",
			contentWidth
		) as Array<string>;
		pdf.text(note, margin, y);
		y += note.length * 5;
	}

	// Sections
	for (const section of pdfSections(items, scope)) {
		ensureRoom(18);
		y += 7;
		pdf.setFont("helvetica", "bold");
		pdf.setFontSize(11);
		color(BRAND_DARK);
		pdf.text(section.title.toUpperCase(), margin, y);
		pdf.setDrawColor(229, 231, 235);
		pdf.line(margin, y + 2, pageWidth - margin, y + 2);
		y += 8;

		for (const item of section.items) {
			pdf.setFont("helvetica", "normal");
			pdf.setFontSize(11);
			const lines = pdf.splitTextToSize(
				item.label,
				contentWidth - 9
			) as Array<string>;
			const showDetail = scope === "completo" && item.auto && !!item.detail;
			ensureRoom(lines.length * 5.5 + (showDetail ? 5 : 0) + 2);

			// Box, and a check mark when done
			pdf.setDrawColor(156, 163, 175);
			pdf.setLineWidth(0.3);
			pdf.rect(margin, y - 3.6, 4.2, 4.2);
			if (item.done) {
				pdf.setDrawColor(DONE[0], DONE[1], DONE[2]);
				pdf.setLineWidth(0.6);
				pdf.line(margin + 0.8, y - 1.4, margin + 1.8, y - 0.3);
				pdf.line(margin + 1.8, y - 0.3, margin + 3.6, y - 3);
			}

			color(TEXT);
			pdf.text(lines, margin + 8, y);
			y += lines.length * 5.5;

			if (showDetail && item.detail) {
				pdf.setFontSize(9);
				color(MUTED);
				pdf.text(item.detail, margin + 8, y - 1);
				y += 4;
			}
			y += 1.5;
		}
	}

	// Footer on every page
	const pages = pdf.getNumberOfPages();
	const generated = format(new Date(), "dd/MM/yyyy 'às' HH:mm");
	for (let page = 1; page <= pages; page++) {
		pdf.setPage(page);
		pdf.setFont("helvetica", "normal");
		pdf.setFontSize(8);
		color(MUTED);
		pdf.text(`Gerado pela Vibratto em ${generated}`, margin, pageHeight - 10);
		pdf.text(`${page}/${pages}`, pageWidth - margin, pageHeight - 10, {
			align: "right",
		});
	}

	return pdf.output("blob");
};

/** Saves the file through the browser's download */
export const downloadFile = (blob: Blob, fileName: string): void => {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	document.body.append(link);
	link.click();
	link.remove();
	setTimeout(() => {
		URL.revokeObjectURL(url);
	}, 10_000);
};

/**
 * Opens the device's share menu with the PDF attached (WhatsApp shows up
 * there on phones). "unsupported" where the browser can't share files:
 * the caller downloads it instead
 */
export const sharePdfFile = async (
	blob: Blob,
	fileName: string,
	text: string
): Promise<"shared" | "cancelled" | "unsupported"> => {
	const file = new File([blob], fileName, { type: "application/pdf" });
	if (!navigator.canShare?.({ files: [file] })) return "unsupported";

	try {
		await navigator.share({ files: [file], text });
		return "shared";
	} catch (error) {
		return error instanceof DOMException && error.name === "AbortError"
			? "cancelled"
			: "unsupported";
	}
};
