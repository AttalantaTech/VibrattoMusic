import { describe, expect, it } from "vitest";
import {
	DEFAULT_SCHEDULE,
	calculateSchedule,
	describeOffset,
	fromMinutes,
	hexToRgb,
	tint,
	toMinutes,
} from "../schedule";

describe("schedule of the show", () => {
	it("calculates every step from the show's start and end", () => {
		const rows = calculateSchedule(DEFAULT_SCHEDULE, {
			startTime: "18:00:00",
			endTime: "20:00:00",
		});
		expect(rows.map((row) => `${row.time} ${row.label}`)).toEqual([
			"15:00 Chegada da produção na sede",
			"16:00 Montagem de backline",
			"17:00 Chegada da banda ao local",
			"17:15 Passagem de som",
			"18:00 SHOW-TIME",
			"20:00 Término do show",
			"20:30 Saída do local",
		]);
	});

	it("crosses midnight like the late shows of the examples", () => {
		const rows = calculateSchedule(DEFAULT_SCHEDULE, {
			startTime: "23:00",
			endTime: "01:00",
		});
		expect(rows.at(-1)?.time).toBe("01:30");
		expect(fromMinutes(-30)).toBe("23:30");
	});

	it("leaves the times empty without the show's start", () => {
		const rows = calculateSchedule(DEFAULT_SCHEDULE, {
			startTime: null,
			endTime: null,
		});
		expect(rows.every((row) => row.time === "")).toBe(true);
	});

	it("leaves only the end steps empty when the end isn't known", () => {
		const rows = calculateSchedule(DEFAULT_SCHEDULE, {
			startTime: "19:00",
			endTime: null,
		});
		expect(rows.find((r) => r.id === "show")?.time).toBe("19:00");
		expect(rows.find((r) => r.id === "termino")?.time).toBe("");
	});

	it("reads and rejects times", () => {
		expect(toMinutes("07:05:00")).toBe(425);
		expect(toMinutes("25:00")).toBeNull();
		expect(toMinutes("")).toBeNull();
	});

	it("explains each step for the person", () => {
		expect(
			describeOffset({ id: "a", label: "", anchor: "inicio", offset: -45 })
		).toBe("45 min antes do início");
		expect(
			describeOffset({ id: "b", label: "", anchor: "inicio", offset: -90 })
		).toBe("1h30 antes do início");
		expect(
			describeOffset({ id: "c", label: "", anchor: "fim", offset: 30 })
		).toBe("30 min depois do término");
		expect(
			describeOffset({ id: "d", label: "", anchor: "fim", offset: 0 })
		).toBe("No término do show");
	});
});

describe("band color", () => {
	it("turns the picked color into RGB for the PDF", () => {
		expect(hexToRgb("#E91E8C")).toEqual([233, 30, 140]);
		expect(hexToRgb("bad")).toEqual([134, 45, 45]);
	});

	it("makes a light version for backgrounds", () => {
		expect(tint([0, 0, 0], 0.5)).toEqual([128, 128, 128]);
	});
});
