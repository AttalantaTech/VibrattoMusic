import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ChecklistEvent, ChecklistItem } from "../types";

/**
 * The message for the client: what they need to have ready for the show.
 * Sent by WhatsApp or copied, until the back-end offers a page where the
 * client checks the items too
 */
export const clientShareText = (
	event: ChecklistEvent,
	items: Array<ChecklistItem>,
	professional: string
): string => {
	const forClient = items.filter((item) => item.group === "contratante");
	const when = format(parseISO(event.date), "dd/MM/yyyy (EEEE)", {
		locale: ptBR,
	});

	return [
		`Olá${event.client ? `, ${event.client}` : ""}! Aqui é ${professional}.`,
		`Para o evento de ${when}${event.startTime ? ` às ${event.startTime.slice(0, 5)}` : ""}${event.place ? `, em ${event.place}` : ""}, precisamos que estes itens estejam prontos:`,
		"",
		...forClient.map((item) => `${item.done ? "✅" : "▫️"} ${item.label}`),
		"",
		"Qualquer dúvida, é só falar por aqui. Obrigado!",
	].join("\n");
};
