import { describe, expect, it } from "vitest";
import { chatMessageHtml } from "../chatMessageHtml";

// What the chat field sends
describe("chatMessageHtml", () => {
	it("keeps bold, italic, underline and lists", () => {
		const html = "<b>Oi</b> <i>tudo</i> <u>bem</u><ul><li>Som</li></ul>";
		expect(chatMessageHtml(html)).toBe(html);
	});

	it("keeps line breaks", () => {
		expect(chatMessageHtml("Linha 1<div>Linha 2</div>")).toBe(
			"Linha 1<div>Linha 2</div>"
		);
	});

	it("drops fonts, colors and links from pasted text, keeping the words", () => {
		expect(
			chatMessageHtml(
				'<span style="color:red;font-family:Arial">Texto</span> <a href="https://x.com">link</a>'
			)
		).toBe("Texto link");
	});

	it("drops anything that runs code", () => {
		expect(
			chatMessageHtml(
				'Oi<img src=x onerror="alert(1)"><script>alert(1)</script>'
			)
		).toBe("Oi");
	});

	it("removes blank lines at the start and end", () => {
		expect(chatMessageHtml("<div><br></div>&nbsp;Oi<br><div><br></div>")).toBe(
			"Oi"
		);
	});

	it("is empty when there is nothing to read (send stays off)", () => {
		expect(chatMessageHtml("<div><br></div>&nbsp; <b> </b>")).toBe("");
	});

	it("an emoji alone is a message", () => {
		expect(chatMessageHtml("🎉")).toBe("🎉");
	});
});
