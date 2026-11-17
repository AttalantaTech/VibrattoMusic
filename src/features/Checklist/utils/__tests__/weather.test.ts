import { describe, expect, it } from "vitest";
import {
	cityFromPlace,
	forecastOpensOn,
	forecastText,
	forecastWindow,
	weatherLabel,
} from "../weather";

describe("weather forecast of the event", () => {
	it("finds the city in the places typed in proposals", () => {
		expect(cityFromPlace("Coruripe - AL")).toEqual({
			city: "Coruripe",
			uf: "AL",
		});
		expect(
			cityFromPlace("Espaço de Eventos Jardim Europa, São Paulo - SP")
		).toEqual({ city: "São Paulo", uf: "SP" });
		expect(cityFromPlace("Praça Central, Valinhos/SP")).toEqual({
			city: "Valinhos",
			uf: "SP",
		});
	});

	it("uses the last part when there is no state", () => {
		expect(cityFromPlace("Sítio Costa Brava, Paripueira")).toEqual({
			city: "Paripueira",
			uf: null,
		});
		expect(cityFromPlace("")).toBeNull();
	});

	it("doesn't take any two letters for a state", () => {
		expect(cityFromPlace("Bar do Zé - XY")?.uf).toBeNull();
	});

	it("knows when the forecast exists (up to 16 days ahead)", () => {
		expect(forecastWindow("2026-11-20", "2026-11-17")).toBe("available");
		expect(forecastWindow("2026-12-15", "2026-11-17")).toBe("later");
		expect(forecastWindow("2026-11-10", "2026-11-17")).toBe("past");
		expect(forecastOpensOn("2026-12-15")).toBe("2026-11-30");
	});

	it("describes the day in Portuguese", () => {
		expect(weatherLabel(2)).toBe("Sol com algumas nuvens");
		expect(weatherLabel(63)).toBe("Chuva");
		expect(
			forecastText({ place: "", min: 23.4, max: 31.6, rainChance: 10, code: 2 })
		).toBe("Sol com algumas nuvens · 23° a 32° · chuva 10%");
	});
});
