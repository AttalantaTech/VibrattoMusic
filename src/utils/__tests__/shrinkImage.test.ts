import { describe, expect, it } from "vitest";
import { canShrink, fitWithin, maxSideFor, outputOf } from "../shrinkImage";

describe("photos are sent no bigger than the screen needs", () => {
	it("profile photos and logos up to 800 px", () => {
		expect(maxSideFor("UsuarioFotoPerfil")).toBe(800);
		expect(maxSideFor("ProdutoMusicalFotoPerfil")).toBe(800);
		expect(maxSideFor("ProdutoMusicalOnboardingFotoPerfil")).toBe(800);
		expect(maxSideFor("ProdutoMusicalLogomarca")).toBe(800);
	});

	it("gallery and promotional pictures up to 1920 px", () => {
		expect(maxSideFor("ProdutoMusicalCarrossel")).toBe(1920);
		expect(maxSideFor("ProdutoMusicalOnboardingCarrossel")).toBe(1920);
		expect(maxSideFor("ProdutoMusicalClipagem")).toBe(1920);
	});

	it("leaves rider, dressing room and stage map as they are", () => {
		expect(maxSideFor("ProdutoMusicalRider")).toBeNull();
		expect(maxSideFor("ProdutoMusicalInfraCamarim")).toBeNull();
		expect(maxSideFor("ProdutoMusicalOnboardingMapaPalco")).toBeNull();
	});

	it("only redraws JPEG, PNG and WebP", () => {
		expect(canShrink("image/jpeg")).toBe(true);
		expect(canShrink("image/png")).toBe(true);
		expect(canShrink("image/webp")).toBe(true);
		expect(canShrink("image/gif")).toBe(false);
		expect(canShrink("application/pdf")).toBe(false);
		expect(canShrink("video/mp4")).toBe(false);
		expect(canShrink("")).toBe(false);
	});

	it("keeps the proportion of a standing phone photo", () => {
		expect(fitWithin(1980, 2640, 800)).toEqual({ width: 600, height: 800 });
	});

	it("keeps the proportion of a lying photo", () => {
		expect(fitWithin(4000, 3000, 1920)).toEqual({ width: 1920, height: 1440 });
	});

	it("never makes a small photo bigger", () => {
		expect(fitWithin(500, 300, 800)).toEqual({ width: 500, height: 300 });
	});

	it("keeps PNG (transparent logos) and turns the rest into JPEG", () => {
		expect(outputOf("image/png", "logo.png")).toEqual({
			type: "image/png",
			name: "logo.png",
		});
		expect(outputOf("image/webp", "foto.webp")).toEqual({
			type: "image/jpeg",
			name: "foto.jpg",
		});
		expect(outputOf("image/jpeg", "IMG_1234.JPEG")).toEqual({
			type: "image/jpeg",
			name: "IMG_1234.jpg",
		});
	});
});
