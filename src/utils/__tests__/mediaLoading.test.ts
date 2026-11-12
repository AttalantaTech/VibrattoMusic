import { afterEach, describe, expect, it, vi } from "vitest";
import { needsFreshPdfAddress } from "../pdfDocument";
import { videoThumbnailSource } from "../validation";

const USER_AGENTS = {
	chrome:
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
	edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
	firefox:
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0",
	androidChrome:
		"Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
	iphoneChrome:
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1",
	safariMac:
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
	safariIphone:
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
};

const browseWith = (userAgent: string) => {
	vi.stubGlobal("navigator", { userAgent });
};

// Rider, dressing room and stage map files: a changed address makes the
// browser download the file again every time the tab is opened
describe("files of the profile tabs are downloaded once", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it.each([
		"chrome",
		"edge",
		"firefox",
		"androidChrome",
		"iphoneChrome",
	] as const)("%s keeps the address, so the file is reused", (browser) => {
		browseWith(USER_AGENTS[browser]);
		expect(needsFreshPdfAddress()).toBe(false);
	});

	it.each(["safariMac", "safariIphone"] as const)(
		"%s still gets a new address (it shows a blank box otherwise)",
		(browser) => {
			browseWith(USER_AGENTS[browser]);
			expect(needsFreshPdfAddress()).toBe(true);
		}
	);
});

describe("video thumbnails", () => {
	it("asks for the first frame of the video", () => {
		expect(videoThumbnailSource("https://files.test/a.mp4")).toBe(
			"https://files.test/a.mp4#t=0.1"
		);
	});

	it("leaves an address that already says where to start", () => {
		expect(videoThumbnailSource("https://files.test/a.mp4#t=5")).toBe(
			"https://files.test/a.mp4#t=5"
		);
	});
});
