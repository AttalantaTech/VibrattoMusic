import DOMPurify from "dompurify";

/** Links with target="_blank" always receive a security-related rel attribute. */
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
	if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
		node.setAttribute("rel", "noopener noreferrer");
	}
});

/**
 * Keeps the formatting (paragraphs, bold, lists, links) and drops anything
 * that runs code (<script>, onerror=, javascript: links...). Any HTML that
 * someone else wrote must go through it before reaching the page.
 */
export const sanitizeHtml = (html: string): string =>
	String(DOMPurify.sanitize(html, { ADD_ATTR: ["target"] }));
