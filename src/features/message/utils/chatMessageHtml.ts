import DOMPurify from "dompurify";

// What the chat field can produce: bold, italic, underline, bullet list and
// line breaks. Pasted text keeps its words but loses fonts, colors and links
const CHAT_TAGS = [
	"b",
	"strong",
	"i",
	"em",
	"u",
	"ul",
	"ol",
	"li",
	"br",
	"div",
	"p",
];

// A blank line at the edges: spaces, <br> or an empty <div>/<p>
const BLANK = String.raw`(?:\s|&nbsp;|<br\s*\/?>|<(div|p)>(?:\s|&nbsp;|<br\s*\/?>)*<\/\1>)`;
const LEADING_BLANKS = new RegExp(`^${BLANK}+`);
const TRAILING_BLANKS = new RegExp(`${BLANK}+$`);

/**
 * Turns what was typed in the chat field into the HTML that is sent: only the
 * formatting the field offers, no blank lines at the start or end, and "" when
 * there is nothing to read (so the send button stays off).
 */
export const chatMessageHtml = (html: string): string => {
	const clean = String(
		DOMPurify.sanitize(html, { ALLOWED_TAGS: CHAT_TAGS, ALLOWED_ATTR: [] })
	);

	// trim() also drops non-breaking spaces (&nbsp;)
	const text = new DOMParser()
		.parseFromString(clean, "text/html")
		.body.textContent?.trim();
	if (!text) return "";

	return clean.replace(LEADING_BLANKS, "").replace(TRAILING_BLANKS, "");
};
