import { onlyAlphanumeric } from "@/utils/validation";

export interface MessageLink {
	label: string;
	url: string;
}

interface BaseContext {
	recipientName?: string;
	link?: MessageLink;
}

export interface StatusPayloads {
	budgetRequested: {
		eventTypeLabel: string;
		description?: string;
		date: string;
		startTime?: string | null;
		duration?: string | null;
		location: string;
	};
	proposalRequested: {
		eventTypeLabel: string;
		description?: string;
		date: string;
		startTime?: string | null;
		duration?: string | null;
		location: string;
		// Answer to a rejected proposal
		counterProposal?: boolean;
	};

	proposalAccepted: Record<string, never>;
	proposalPaidSign: Record<string, never>;
	proposalRejected: { reason: string };
	proposalCanceled: { reason?: string };
	contractCreated: Record<string, never>;
}

export type StatusMessageType = keyof StatusPayloads;

/** Security: All text provided by the user undergoes escapeHtml. */
const escapeHtml = (value: string): string =>
	String(value ?? "")
		.replace("&", "&amp;")
		.replace("<", "&lt;")
		.replace(">", "&gt;")
		.replace('"', "&quot;")
		.replace("'", "&#39;");

/** Only accepts http(s) and relative paths (blocks javascript:, data:, etc.) */
const safeUrl = (url: string): string =>
	/^(https?:\/\/|\/)/i.test(url) ? url : "#";

/** Reusable UI blocks */
type Variant = "info" | "success" | "danger" | "neutral";

const variants: Record<
	Variant,
	{ border: string; title: string; button: string }
> = {
	info: {
		border: "border-blue-200 bg-blue-50",
		title: "",
		button: "bg-sky-400 hover:bg-sky-500",
	},
	success: {
		border: "border-green-200 bg-green-50",
		title: "",
		button: "bg-green-600 hover:bg-green-700",
	},
	danger: {
		border: "border-red-200 bg-red-50",
		title: "",
		button: "bg-red-600 hover:bg-red-700",
	},
	neutral: {
		border: "border-gray-200 bg-gray-50",
		title: "",
		button: "bg-gray-600 hover:bg-gray-700",
	},
};

// Also identifies budget cards sent before they had their own link
export const BUDGET_REQUEST_TITLE = "Nova solicitação de orçamento";

type Row = { icon: string; label: string; value: string | null | undefined };

const renderRow = ({ icon, label, value }: Row) =>
	`<div class="flex items-start gap-2">
		<span class="shrink-0" aria-hidden="true">${icon}</span>
		<span class="min-w-0 break-words text-gray-700"><span class="font-medium text-gray-900">${escapeHtml(label)}:</span> ${escapeHtml(value || "")}</span>
	</div>`;

const renderLink = (link: MessageLink | undefined, variant: Variant) =>
	link
		? `<a href="${escapeHtml(safeUrl(link.url))}" class="inline-flex w-fit items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white no-underline transition-colors hover:underline ${variants[variant].button}">🔗 ${escapeHtml(link.label)}</a>`
		: "";

const renderCard = (params: {
	variant: Variant;
	title: string;
	subtitle?: string;
	bodyHtml?: string;
	rows?: Array<Row | null>;
	link?: MessageLink;
}) => {
	const v = variants[params.variant];
	const rows = (params.rows ?? []).filter(
		(row): row is Row => row !== null && Boolean(row.value)
	);

	return `<div class="flex w-full max-w-sm flex-col gap-2 rounded-lg text-sm leading-relaxed shadow-sm">
	<p class="text-base font-semibold ${v.title}">${params.title}</p>
	${params.subtitle ? `<p>${escapeHtml(params.subtitle)}</p>` : ""}
	${params.bodyHtml ? `<p>${params.bodyHtml}</p>` : ""}
	${rows.length > 0 ? `<div class="flex flex-col gap-1.5 rounded-lg border p-3 ${v.border}">${rows.map(renderRow).join("")}</div>` : ""}
	${renderLink(params.link, params.variant)}
</div>`;
};

export const formatDocument = (document: string): string => {
	const raw = onlyAlphanumeric(document);
	if (raw.length === 11) {
		return raw.replace(/^(.{3})(.{3})(.{3})(.{2})$/, "$1.$2.$3-$4");
	}
	if (raw.length === 14) {
		return raw.replace(/^(.{2})(.{3})(.{3})(.{4})(.{2})$/, "$1.$2.$3/$4-$5");
	}
	return document;
};

const greeting = (name?: string) => (name ? `Olá ${name}` : "Olá");

/** Models */
type Template<K extends StatusMessageType> = (
	context: BaseContext & StatusPayloads[K]
) => string;

const statusTemplates: { [K in StatusMessageType]: Template<K> } = {
	budgetRequested: (c) =>
		renderCard({
			variant: "info",
			title: `🎵 ${BUDGET_REQUEST_TITLE}`,
			subtitle: `${greeting(c.recipientName)}, que boa notícia! Você recebeu uma solicitação de orçamento.`,
			rows: [
				{ icon: "🎤", label: "Tipo de evento", value: c.eventTypeLabel || "-" },
				{ icon: "📝", label: "Descrição", value: c.description },
				{ icon: "📅", label: "Data", value: c.date },
				{ icon: "⏰", label: "Início", value: c.startTime || "Não definido" },
				{ icon: "⏳", label: "Duração", value: c.duration || "Não definido" },
				{ icon: "📍", label: "Local", value: c.location },
			],
			link: c.link,
		}),
	proposalRequested: (c) =>
		renderCard({
			variant: "info",
			title: c.counterProposal
				? "🔁 Contraproposta recebida!"
				: "🎵 Proposta criada!",
			subtitle: c.counterProposal
				? `${greeting(c.recipientName)}, você recebeu uma contraproposta. Confira os dados.`
				: `${greeting(c.recipientName)}, uma proposta foi criada. confira os dados.`,
			rows: [
				{ icon: "🎤", label: "Tipo de evento", value: c.eventTypeLabel || "-" },
				{ icon: "📝", label: "Descrição", value: c.description },
				{ icon: "📅", label: "Data", value: c.date },
				{ icon: "⏰", label: "Início", value: c.startTime || "Não definido" },
				{ icon: "⏳", label: "Duração", value: c.duration || "Não definido" },
				{ icon: "📍", label: "Local", value: c.location },
			],
			link: c.link,
		}),
	proposalAccepted: (c) =>
		renderCard({
			variant: "success",
			title: "🎉 Proposta aceita!",
			subtitle: `${greeting(c.recipientName)}, sua proposta foi aceita.`,
			link: c.link,
		}),
	proposalPaidSign: (c) =>
		renderCard({
			variant: "success",
			title: "🎉 Pagamento do sinal confirmado!",
			subtitle: `${greeting(c.recipientName)}, o contratado confirmou o recebimento do sinal. A contratação está concluída.`,
			link: c.link,
		}),

	proposalRejected: (c) =>
		renderCard({
			variant: "danger",
			title: "❌ Proposta recusada",
			subtitle: `${greeting(c.recipientName)}, infelizmente uma proposta foi recusada.`,
			rows: [{ icon: "📝", label: "Motivo", value: c.reason }],
			link: c.link,
		}),

	proposalCanceled: (c) =>
		renderCard({
			variant: "neutral",
			title: "🚫 Proposta cancelada",
			subtitle: `${greeting(c.recipientName)}, uma proposta foi cancelada.`,
			rows: [{ icon: "📝", label: "Motivo", value: c.reason }],
			link: c.link,
		}),

	contractCreated: (c) =>
		renderCard({
			variant: "success",
			title: "📄 Contrato disponível",
			subtitle: `${greeting(c.recipientName)}, o contrato foi gerado e está disponível.`,
			link: c.link,
		}),
};

/** Returns an HTML string ready for <MessageHtml html={...} />. */
export const buildStatusMessage = <K extends StatusMessageType>(
	type: K,
	context: BaseContext & StatusPayloads[K]
): string => statusTemplates[type](context);

const appUrl = (path: string) =>
	`${import.meta.env["VITE_VIBRATTO_FRONT_BASE_URL"]}${path}`;

export const entityLinks = {
	proposalTab: (id: number | string): MessageLink => ({
		label: "Ver proposta",
		url: appUrl(`band/me?tab=hires&id=${id}`),
	}),
	// Opens without login, for people who don't have an account
	proposalPublic: (identificadorUnico: string): MessageLink => ({
		label: "Ver proposta",
		url: appUrl(`proposta/${identificadorUnico}`),
	}),
	// Opens the conversation's budget requests (the id is the budget's)
	budgetRequest: (id: number | string): MessageLink => ({
		label: "Ver solicitação",
		url: appUrl(`band/me?tab=messages&orcamento=${id}`),
	}),
	contractTab: (id: number | string): MessageLink => ({
		label: "Ver contrato",
		url: appUrl(`band/me?tab=contracts&id=${id}`),
	}),
};
