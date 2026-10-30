import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { stripHtml } from "@/utils/stripHtml";
import {
	buildReplyQuote,
	replyExcerpt,
	withoutReplyQuote,
} from "../replyQuote";

const quote = buildReplyQuote({
	id: 42,
	author: "Maria Souza",
	excerpt: "Qual o valor para 3 horas?",
});
const reply = `${quote}Fica R$ 2.500 com som incluso.`;

// Answering a specific message (the API has no link between messages)
describe("reply quote", () => {
	it("carries the original's id, author and text", () => {
		expect(quote).toBe(
			'<blockquote data-reply-to="42"><strong>Maria Souza</strong><br>Qual o valor para 3 horas?</blockquote>'
		);
	});

	it("survives the chat's HTML cleaning, so the quote can jump to the original", () => {
		expect(sanitizeHtml(reply)).toContain('data-reply-to="42"');
	});

	it("escapes what people typed", () => {
		const html = buildReplyQuote({
			id: 1,
			author: "<b>Ana</b>",
			excerpt: '<img src=x onerror="alert(1)">',
		});
		expect(html).not.toContain("<img");
		expect(html).not.toContain("<b>Ana");
	});

	it("the conversation list shows only the answer", () => {
		expect(stripHtml(withoutReplyQuote(reply))).toBe(
			"Fica R$ 2.500 com som incluso."
		);
	});

	it("quoting a reply quotes only its answer (no quote inside a quote)", () => {
		expect(replyExcerpt(reply)).toBe("Fica R$ 2.500 com som incluso.");
	});

	it("a long message is cut to one short line", () => {
		const excerpt = replyExcerpt(`<p>${"palavra ".repeat(40)}</p>`);
		expect(excerpt.length).toBeLessThanOrEqual(101);
		expect(excerpt.endsWith("…")).toBe(true);
	});

	it("a proposal card is quoted by its text", () => {
		expect(
			replyExcerpt(
				"<div><p>🎉 Proposta aceita!</p><p>Olá DJ Danilo, sua proposta foi aceita.</p></div>"
			)
		).toBe("🎉 Proposta aceita! Olá DJ Danilo, sua proposta foi aceita.");
	});
});
