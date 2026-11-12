import { describe, expect, it } from "vitest";
import { uploadPercent, uploadsOf, type FileUpload } from "../uploadProgress";

describe("progress of a file being sent", () => {
	it("shows how much of the file was sent", () => {
		expect(uploadPercent({ loaded: 0, total: 2000 })).toBe(0);
		expect(uploadPercent({ loaded: 500, total: 2000 })).toBe(25);
		expect(uploadPercent({ loaded: 2000, total: 2000 })).toBe(100);
	});

	// "100%" with bytes still to go would look stuck
	it("only reaches 100 when everything was sent", () => {
		expect(uploadPercent({ loaded: 1999, total: 2000 })).toBe(99);
	});

	it("never leaves the 0 to 100 range", () => {
		expect(uploadPercent({ loaded: 3000, total: 2000 })).toBe(100);
		expect(uploadPercent({ loaded: 10, total: 0 })).toBe(0);
	});
});

describe("uploads shown in each section", () => {
	const upload = (id: number, type: FileUpload["type"]): FileUpload => ({
		id,
		type,
		name: `file-${id}`,
		loaded: 0,
		total: 1,
	});
	const uploads = [
		upload(1, "ProdutoMusicalCarrossel"),
		upload(2, "ProdutoMusicalClipagem"),
		upload(3, "ProdutoMusicalOnboardingCarrossel"),
		upload(4, "ProdutoMusicalOnboardingClipagem"),
		upload(5, "ProdutoMusicalFotoPerfil"),
	];

	it("the carousel shows its own, in the editor and in the onboarding", () => {
		expect(uploadsOf(uploads, "carousel").map(({ id }) => id)).toEqual([1, 3]);
	});

	it("the promotional files show their own", () => {
		expect(uploadsOf(uploads, "clipping").map(({ id }) => id)).toEqual([2, 4]);
	});
});
