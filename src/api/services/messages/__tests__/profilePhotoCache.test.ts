import { describe, expect, it, vi } from "vitest";
import { createPhotoCache } from "../profilePhotoCache";

const TEN_MINUTES = 10 * 60 * 1000;

// The conversation list refreshes every 10 seconds: it must not ask the API
// for the same photos every time
describe("profile photos of the conversation list", () => {
	it("asks the API once for each profile, however often the list refreshes", async () => {
		const fetchPhoto = vi.fn((id: number) => Promise.resolve(`photo-${id}`));
		const photoOf = createPhotoCache(fetchPhoto, TEN_MINUTES);

		expect(await photoOf(7)).toBe("photo-7");
		expect(await photoOf(7)).toBe("photo-7");
		expect(await photoOf(8)).toBe("photo-8");
		expect(await photoOf(7)).toBe("photo-7");

		expect(fetchPhoto).toHaveBeenCalledTimes(2);
	});

	it("two refreshes at the same time share one request", async () => {
		const fetchPhoto = vi.fn(() => Promise.resolve("photo"));
		const photoOf = createPhotoCache(fetchPhoto, TEN_MINUTES);

		await Promise.all([photoOf(7), photoOf(7)]);

		expect(fetchPhoto).toHaveBeenCalledTimes(1);
	});

	it("asks again after a while, so a changed photo shows up", async () => {
		let time = 0;
		const fetchPhoto = vi.fn(() => Promise.resolve("photo"));
		const photoOf = createPhotoCache(fetchPhoto, TEN_MINUTES, () => time);

		await photoOf(7);
		time = TEN_MINUTES + 1;
		await photoOf(7);

		expect(fetchPhoto).toHaveBeenCalledTimes(2);
	});

	it("a photo that fails doesn't break the list and is tried again", async () => {
		const fetchPhoto = vi
			.fn<(id: number) => Promise<string | null>>()
			.mockRejectedValueOnce(new Error("Rate limit exceeded"))
			.mockResolvedValueOnce("photo");
		const photoOf = createPhotoCache(fetchPhoto, TEN_MINUTES);

		expect(await photoOf(7)).toBeNull();
		expect(await photoOf(7)).toBe("photo");
	});
});
