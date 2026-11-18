import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
	GROUPS,
	type Branding,
	type ChecklistEvent,
	type ChecklistItem,
	type ScheduleRow,
} from "../types";
import { hexToRgb, tint, transportLabel } from "./schedule";

/**
 * The band's logo as data for the PDF. It is a nice-to-have: if it can't be
 * read, the PDF goes without it
 */
const loadImage = async (url: string | null): Promise<string | null> => {
	if (!url) return null;
	if (url.startsWith("data:")) return url;
	try {
		const blob = await (await fetch(url)).blob();
		return await new Promise<string | null>((resolve) => {
			const reader = new FileReader();
			reader.onload = () => {
				resolve(typeof reader.result === "string" ? reader.result : null);
			};
			reader.onerror = () => {
				resolve(null);
			};
			reader.readAsDataURL(blob);
		});
	} catch {
		return null;
	}
};

/**
 * An emoji as a picture: the PDF's fonts have no emoji, but the browser
 * draws them in color, as on the screen. null where it can't (the PDF then
 * goes with the text only)
 */
export const emojiImage = (symbol: string): string | null => {
	try {
		const canvas = document.createElement("canvas");
		canvas.width = 96;
		canvas.height = 96;
		const context = canvas.getContext("2d");
		if (!context) return null;
		context.font =
			"76px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";
		context.textAlign = "center";
		context.textBaseline = "middle";
		context.fillText(symbol, 48, 54);
		return canvas.toDataURL("image/png");
	} catch {
		return null;
	}
};

/**
 * "equipe": the run sheet for the band and staff (schedule, logistics,
 * notes), like the ones bands send today; "contratante": what the client
 * must have ready; "completo": the whole checklist
 */
export type PdfScope = "equipe" | "contratante" | "completo";

const TITLES: Record<PdfScope, string> = {
	equipe: "CRONOGRAMA - CHECKLIST",
	contratante: "Checklist para o evento",
	completo: "Checklist do evento",
};

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

/** checklist-2026-11-22-casamento-ana.pdf / cronograma-2026-11-22-... */
export const checklistFileName = (
	event: ChecklistEvent,
	scope: PdfScope = "contratante"
): string =>
	`${scope === "equipe" ? "cronograma" : "checklist"}-${event.date}-${slug(event.title) || "evento"}.pdf`;

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
 * The event as an A4 PDF, made in the browser with the band's logo and
 * color. jsPDF is loaded only here, when someone asks for the file
 */
export const buildChecklistPdf = async ({
	event,
	items,
	professional,
	scope,
	branding,
	logo = null,
	schedule = [],
	audience = "",
	notes = "",
	includeItems = false,
	weather = null,
}: {
	event: ChecklistEvent;
	items: Array<ChecklistItem>;
	professional: string;
	scope: PdfScope;
	branding?: Branding;
	/** The band's logo (URL or data); null: no logo */
	logo?: string | null;
	schedule?: Array<ScheduleRow>;
	audience?: string;
	notes?: string;
	/** "equipe": the checklist items after the schedule */
	includeItems?: boolean;
	/** "equipe": the day's forecast, as text, with the symbol of the screen */
	weather?: { text: string; symbol?: string } | null;
}): Promise<Blob> => {
	const { jsPDF } = await import("jspdf");
	const pdf = new jsPDF({ unit: "mm", format: "a4" });

	const brand = hexToRgb(branding?.color ?? "#862D2D");
	const light = tint(brand);
	const pageWidth = pdf.internal.pageSize.getWidth();
	const pageHeight = pdf.internal.pageSize.getHeight();
	const margin = 18;
	const contentWidth = pageWidth - margin * 2;
	const bottom = pageHeight - 24;
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
	const sectionTitle = (title: string) => {
		// Room for the title and its first line: a title alone at the bottom
		// of a page, with its items on the next, reads badly
		ensureRoom(26);
		y += 7;
		pdf.setFont("helvetica", "bold");
		pdf.setFontSize(11);
		color(brand);
		pdf.text(title.toUpperCase(), margin, y);
		pdf.setDrawColor(229, 231, 235);
		pdf.setLineWidth(0.2);
		pdf.line(margin, y + 2, pageWidth - margin, y + 2);
		y += 8;
	};

	// Header: the band's logo (only when it has one), the title in its color
	const logoData = await loadImage(logo);
	if (logoData) {
		try {
			const { width, height } = pdf.getImageProperties(logoData);
			// Fits in 45 x 14 mm keeping the proportion
			const scale = Math.min(45 / width, 14 / height);
			pdf.addImage(logoData, margin, 8, width * scale, height * scale);
		} catch {
			// An image jsPDF can't read: the PDF goes without the logo
		}
	}
	pdf.setFont("helvetica", "bold");
	pdf.setFontSize(scope === "equipe" ? 14 : 13);
	color(brand);
	pdf.text(TITLES[scope], pageWidth - margin, 14, { align: "right" });
	if (professional) {
		pdf.setFont("helvetica", "normal");
		pdf.setFontSize(10);
		color(MUTED);
		pdf.text(professional, pageWidth - margin, 19.5, { align: "right" });
	}
	pdf.setDrawColor(brand[0], brand[1], brand[2]);
	pdf.setLineWidth(0.8);
	pdf.line(margin, 25, pageWidth - margin, 25);
	pdf.setLineWidth(0.2);
	y = 37;

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
		[
			"Horário",
			scope === "equipe" || !event.startTime
				? null
				: event.startTime.slice(0, 5),
		],
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

	if (scope === "equipe") {
		// Three cards, as in the examples: transport, audience, event type
		y += 3;
		const gap = 4;
		const cardWidth = (contentWidth - gap * 2) / 3;
		const cards: Array<[string, string]> = [
			["TRANSPORTE", transportLabel(event) ?? "—"],
			["PÚBLICO", audience.trim() || "—"],
			["TIPO DO EVENTO", event.eventType ?? "—"],
		];
		cards.forEach(([label, value], index) => {
			const x = margin + index * (cardWidth + gap);
			pdf.setFillColor(light[0], light[1], light[2]);
			pdf.roundedRect(x, y, cardWidth, 17, 2, 2, "F");
			pdf.setFont("helvetica", "bold");
			pdf.setFontSize(8.5);
			color(brand);
			pdf.text(label, x + cardWidth / 2, y + 6, { align: "center" });
			pdf.setFont("helvetica", "normal");
			pdf.setFontSize(10.5);
			color(TEXT);
			const text = pdf.splitTextToSize(value, cardWidth - 4) as Array<string>;
			pdf.text(text[0] ?? "", x + cardWidth / 2, y + 12.5, { align: "center" });
		});
		y += 21;

		if (weather) {
			pdf.setDrawColor(brand[0], brand[1], brand[2]);
			pdf.setLineWidth(0.4);
			pdf.roundedRect(margin, y, contentWidth, 12, 2, 2, "S");
			pdf.setLineWidth(0.2);
			pdf.setFont("helvetica", "bold");
			pdf.setFontSize(8.5);
			color(brand);
			pdf.text("PREVISÃO DO TEMPO", margin + 4, y + 7.5);
			const icon = weather.symbol ? emojiImage(weather.symbol) : null;
			let textX = margin + 42;
			if (icon) {
				try {
					pdf.addImage(icon, "PNG", textX, y + 2.5, 7, 7);
					textX += 9;
				} catch {
					// No picture: the text alone says it
				}
			}
			pdf.setFont("helvetica", "normal");
			pdf.setFontSize(10.5);
			color(TEXT);
			const line = pdf.splitTextToSize(
				weather.text,
				pageWidth - margin - textX - 4
			) as Array<string>;
			pdf.text(line[0] ?? "", textX, y + 7.5);
			y += 16;
		}

		const rows = schedule.filter((row) => row.label.trim() || row.time);
		if (rows.length > 0) {
			sectionTitle("Cronograma");
			for (const row of rows) {
				pdf.setFontSize(11);
				const lines = pdf.splitTextToSize(
					row.label,
					contentWidth - 22
				) as Array<string>;
				ensureRoom(lines.length * 5.5 + 2);
				pdf.setFont("helvetica", "bold");
				color(brand);
				pdf.text(row.time ? row.time.replace(":", "h") : "--h--", margin, y);
				pdf.setFont("helvetica", "normal");
				color(TEXT);
				pdf.text(lines, margin + 18, y);
				y += lines.length * 5.5 + 1.5;
			}
		}

		if (notes.trim()) {
			sectionTitle("Informações importantes");
			pdf.setFont("helvetica", "normal");
			pdf.setFontSize(10.5);
			color(TEXT);
			for (const paragraph of notes.trim().split("\n")) {
				const lines = pdf.splitTextToSize(
					paragraph || " ",
					contentWidth
				) as Array<string>;
				ensureRoom(lines.length * 5 + 1);
				pdf.text(lines, margin, y);
				y += lines.length * 5 + 0.5;
			}
		}
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

	// Checklist items
	const showItems = scope !== "equipe" || includeItems;
	const sections = showItems
		? pdfSections(items, scope === "equipe" ? "completo" : scope)
		: [];
	for (const section of sections) {
		sectionTitle(section.title);

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

	// Footer on every page: the producer's contact, when filled in
	const pages = pdf.getNumberOfPages();
	const generated = format(new Date(), "dd/MM/yyyy 'às' HH:mm");
	const producer = [
		branding?.producer.name,
		branding?.producer.email,
		branding?.producer.phone,
	]
		.map((part) => part?.trim())
		.filter(Boolean)
		.join("  ·  ");
	for (let page = 1; page <= pages; page++) {
		pdf.setPage(page);
		if (producer) {
			pdf.setDrawColor(229, 231, 235);
			pdf.setLineWidth(0.2);
			pdf.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
			pdf.setFont("helvetica", "bold");
			pdf.setFontSize(9);
			color(TEXT);
			pdf.text(producer, pageWidth / 2, pageHeight - 13.5, { align: "center" });
		}
		pdf.setFont("helvetica", "normal");
		pdf.setFontSize(8);
		color(MUTED);
		pdf.text(`Gerado pela Vibratto em ${generated}`, margin, pageHeight - 8);
		pdf.text(`${page}/${pages}`, pageWidth - margin, pageHeight - 8, {
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
