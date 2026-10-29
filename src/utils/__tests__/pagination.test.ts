import { describe, expect, it } from "vitest";
import { visiblePages } from "../pagination";

// Search page numbers: never below 1 or above the last page
describe("visiblePages", () => {
	it("3 pages show 1 2 3 (it showed -1 0 1 2 3)", () => {
		expect(visiblePages(1, 3)).toEqual([1, 2, 3]);
		expect(visiblePages(3, 3)).toEqual([1, 2, 3]);
	});

	it("a single page shows just 1", () => {
		expect(visiblePages(1, 1)).toEqual([1]);
	});

	it("no pages shows nothing", () => {
		expect(visiblePages(1, 0)).toEqual([]);
	});

	it("keeps 5 pages around the current one", () => {
		expect(visiblePages(6, 10)).toEqual([4, 5, 6, 7, 8]);
	});

	it("starts at 1 near the beginning", () => {
		expect(visiblePages(1, 10)).toEqual([1, 2, 3, 4, 5]);
		expect(visiblePages(2, 10)).toEqual([1, 2, 3, 4, 5]);
	});

	it("ends at the last page near the end", () => {
		expect(visiblePages(10, 10)).toEqual([6, 7, 8, 9, 10]);
		expect(visiblePages(9, 10)).toEqual([6, 7, 8, 9, 10]);
	});

	it.each([2, 3, 4, 5, 6, 7])("never goes below 1 with %i pages", (total) => {
		for (let page = 1; page <= total; page++) {
			const pages = visiblePages(page, total);
			expect(Math.min(...pages)).toBeGreaterThanOrEqual(1);
			expect(Math.max(...pages)).toBeLessThanOrEqual(total);
			expect(pages).toContain(page);
		}
	});
});
