import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { sanitizeHtml } from "../sanitizeHtml";
import { SafeHtml } from "@/components/ui/SafeHtml/SafeHtml";

// HTML written by someone else (chat cards, rider and camarim texts on the
// public profile) must never run code in the visitor's browser
describe("sanitizeHtml", () => {
	it("removes <script>", () => {
		const clean = sanitizeHtml("<p>Rider</p><script>alert(1)</script>");
		expect(clean).not.toContain("<script");
		expect(clean).toContain("<p>Rider</p>");
	});

	it("removes event handlers such as onerror", () => {
		const clean = sanitizeHtml('<img src="x" onerror="alert(1)">');
		expect(clean).not.toContain("onerror");
	});

	it("removes javascript: links", () => {
		const clean = sanitizeHtml('<a href="javascript:alert(1)">clique</a>');
		expect(clean).not.toContain("javascript:");
	});

	it("removes iframes", () => {
		expect(sanitizeHtml('<iframe src="https://x.com"></iframe>')).not.toContain(
			"<iframe"
		);
	});

	it("keeps the editor's formatting", () => {
		const html =
			"<p><strong>Som:</strong> 2 caixas</p><ul><li>Mesa</li></ul><em>obs</em>";
		expect(sanitizeHtml(html)).toBe(html);
	});

	it("protects links that open in a new tab", () => {
		const clean = sanitizeHtml(
			'<a href="https://vibratto.com" target="_blank">site</a>'
		);
		expect(clean).toContain('rel="noopener noreferrer"');
	});
});

describe("SafeHtml", () => {
	it("shows the text without the injected code", () => {
		const { container } = render(
			<SafeHtml html='<p>Camarim com espelho</p><img src="x" onerror="alert(1)">' />
		);

		expect(container.textContent).toBe("Camarim com espelho");
		expect(container.innerHTML).not.toContain("onerror");
	});
});
