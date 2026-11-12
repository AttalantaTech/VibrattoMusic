import { describe, expect, it } from "vitest";
import { moveFile } from "../fileOrder";

const files = ["a", "b", "c", "d"].map((link) => ({ link, legenda: link }));
const order = (list: Array<{ link: string }>) =>
	list.map(({ link }) => link).join("");

describe("order of the carousel and promotional files", () => {
	it("moves a file forward, the ones between shifting back", () => {
		expect(order(moveFile(files, "a", "c"))).toBe("bcad");
	});

	it("moves a file back, the ones between shifting forward", () => {
		expect(order(moveFile(files, "d", "b"))).toBe("adbc");
	});

	it("makes a file the first (the main image of the carousel)", () => {
		expect(order(moveFile(files, "c", "a"))).toBe("cabd");
	});

	it("keeps the caption with its file", () => {
		expect(moveFile(files, "a", "d")[3]).toEqual({ link: "a", legenda: "a" });
	});

	it("doesn't change the list it was given", () => {
		moveFile(files, "a", "d");
		expect(order(files)).toBe("abcd");
	});

	// Nothing to save: the same list tells the screen not to send anything
	it("returns the same list when the file is dropped where it was", () => {
		expect(moveFile(files, "b", "b")).toBe(files);
	});

	it("returns the same list for a file that isn't in it", () => {
		expect(moveFile(files, "x", "a")).toBe(files);
	});
});
