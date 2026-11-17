/**
 * The markers the back-end replaces when it makes the contract of a
 * proposal. Shown with readable names, and filled with example data in the
 * preview. The list comes from the base contract; Cunha will confirm the rest
 */
export const MARKERS: Array<{
	marker: string;
	label: string;
	example: string;
}> = [
	{
		marker: "[ProdutoMusical.Nome]",
		label: "Seu nome artístico",
		example: "DJ Danilo",
	},
	{
		marker: "[ProdutoMusical.CidadeContato]",
		label: "Sua cidade",
		example: "Valinhos - SP",
	},
	{
		marker: "[Contratante.Qualificacao]",
		label: "Dados do contratante",
		example:
			"ANA SOUZA, inscrita no CPF sob o nº 000.000.000-00, residente na Rua das Flores, 100, Campinas - SP",
	},
	{
		marker: "[Contratada.Qualificacao]",
		label: "Seus dados (contratado)",
		example:
			"DANILO DE PALMA, inscrito no CPF sob o nº 000.000.000-00, residente na Av. Brasil, 200, Valinhos - SP",
	},
	{
		marker: "[Proposta.DataInicio]",
		label: "Data do evento",
		example: "22/11/2026",
	},
	{
		marker: "[Proposta.Local]",
		label: "Local do evento",
		example: "Espaço Jardim Europa, Campinas - SP",
	},
	{
		marker: "[Proposta.HorarioEDuracao]",
		label: "Horário e duração",
		example: "início às 20h00, duração de 4 horas",
	},
	{
		marker: "[Proposta.CondicoesPagamento]",
		label: "Valor e pagamento",
		example: "R$ 14.000,00, à vista no dia do evento, via PIX",
	},
	{
		marker: "[Contratante.Assinatura]",
		label: "Assinatura do contratante",
		example: "Ana Souza",
	},
	{
		marker: "[Contratada.Assinatura]",
		label: "Sua assinatura",
		example: "Danilo de Palma",
	},
];

const MARKER_PATTERN = /\[[A-Za-z]+\.[A-Za-z]+\]/g;

/** The markers found in a text, in order, without repeats */
export const markersIn = (text: string): Array<string> => [
	...new Set(text.match(MARKER_PATTERN) ?? []),
];

export const labelOf = (marker: string): string =>
	MARKERS.find((item) => item.marker === marker)?.label ?? marker;

/** Markers that were in the original text and aren't anymore */
export const removedMarkers = (
	original: string,
	edited: string
): Array<string> => {
	const kept = new Set(markersIn(edited));
	return markersIn(original).filter((marker) => !kept.has(marker));
};

/** Markers typed by hand that the back-end doesn't know */
export const unknownMarkers = (text: string): Array<string> =>
	markersIn(text).filter((marker) => !MARKERS.some((m) => m.marker === marker));

/**
 * The text split into plain parts and markers, to show the markers as
 * chips. Unknown markers come back as plain text
 */
export const splitMarkers = (
	text: string
): Array<{ kind: "text" | "marker"; value: string }> => {
	const parts: Array<{ kind: "text" | "marker"; value: string }> = [];
	let last = 0;
	for (const match of text.matchAll(MARKER_PATTERN)) {
		const index = match.index ?? 0;
		const known = MARKERS.some((m) => m.marker === match[0]);
		if (!known) continue;
		if (index > last)
			parts.push({ kind: "text", value: text.slice(last, index) });
		parts.push({ kind: "marker", value: match[0] });
		last = index + match[0].length;
	}
	if (last < text.length) parts.push({ kind: "text", value: text.slice(last) });
	return parts;
};

/** The text as the client would read it, with example data */
export const fillExample = (text: string): string =>
	text.replace(
		MARKER_PATTERN,
		(marker) => MARKERS.find((m) => m.marker === marker)?.example ?? marker
	);

/** The back-end keeps Windows line breaks; the screen works with \n */
export const toScreenText = (text: string): string =>
	text.replace(/\r\n/g, "\n");
export const toApiText = (text: string): string =>
	text.replace(/\r?\n/g, "\r\n");
