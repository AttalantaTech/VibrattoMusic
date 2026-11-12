import { describe, expect, it } from "vitest";
import { thumbnailCrop } from "../pdfThumbnailCache";

describe("thumbnail kept of a PDF's first page", () => {
	it("keeps a normal sheet whole", () => {
		expect(thumbnailCrop(500, 707)).toEqual({
			width: 500,
			height: 707,
			isLongPage: false,
		});
	});

	// A media kit laid out as one page many screens tall
	it("keeps only the top of a very long page", () => {
		expect(thumbnailCrop(500, 6500)).toEqual({
			width: 500,
			height: 750,
			isLongPage: true,
		});
	});
});
