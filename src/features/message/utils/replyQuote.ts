import { stripHtml } from "@/utils/stripHtml";

// The API has no "reply to" link between messages, so a reply carries a copy
// of the original on top, marked with its id: the chat shows it as a quote
// that jumps to the original, and previews skip it
const QUOTE_SELECTOR = "blockquote[data-reply-to]";
const EXCERPT_LENGTH = 100;

export type ReplyTarget = {
	id: number;
	author: string;
	excerpt: string;
};

const escapeHtml = (text: string) =>
	text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

/** The message HTML without the quote of the message it answers */
export const withoutReplyQuote = (html: string): string => {
	if (!html.includes("data-reply-to")) return html;
	const document_ = new DOMParser().parseFromString(html, "text/html");
	document_.querySelectorAll(QUOTE_SELECTOR).forEach((quote) => {
		quote.remove();
	});
	return document_.body.innerHTML;
};

/** One line of the message's text, as the quote shows it */
export const replyExcerpt = (html: string): string => {
	const text = stripHtml(withoutReplyQuote(html)).replace(/\s+/g, " ").trim();
	return text.length > EXCERPT_LENGTH
		? `${text.slice(0, EXCERPT_LENGTH).trimEnd()}…`
		: text;
};

/** The quote that goes on top of a reply */
export const buildReplyQuote = ({ id, author, excerpt }: ReplyTarget): string =>
	`<blockquote data-reply-to="${id}"><strong>${escapeHtml(author)}</strong><br>${escapeHtml(excerpt)}</blockquote>`;
