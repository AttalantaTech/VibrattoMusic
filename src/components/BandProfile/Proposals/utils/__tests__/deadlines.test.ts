import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
	deadlineDate,
	deadlineDays,
	deadlineLabel,
	isDeadlineAfterEvent,
} from "../deadlines";

// Acceptance and down payment deadlines are typed in days counted from the
// day the proposal is sent (they used to be added to the event date)
describe("deadlines", () => {
	beforeAll(() => {
		vi.useFakeTimers();
		// "Today" for these tests: 29/10/2026, afternoon in Brasília
		vi.setSystemTime(new Date("2026-10-29T15:00:00-03:00"));
	});

	afterAll(() => {
		vi.useRealTimers();
	});

	it("counts the days from today, not from the event", () => {
		expect(deadlineDate(15)).toBe("2026-11-13");
		expect(deadlineDate(30)).toBe("2026-11-28");
	});

	it("shows the due date as dd/mm/aaaa", () => {
		expect(deadlineLabel(30)).toBe("28/11/2026");
	});

	it("flags a deadline that ends after the event", () => {
		expect(isDeadlineAfterEvent(60, "2026-12-20")).toBe(true);
	});

	it("accepts a deadline on or before the event", () => {
		expect(isDeadlineAfterEvent(52, "2026-12-20")).toBe(false);
		expect(isDeadlineAfterEvent(30, "2026-12-20")).toBe(false);
	});

	it("doesn't flag anything without an event date", () => {
		expect(isDeadlineAfterEvent(999, "")).toBe(false);
	});

	it("turns a saved deadline back into days from today", () => {
		expect(deadlineDays("2026-11-13T00:00:00", 15)).toBe(15);
	});

	it("never goes below 1 day for a deadline already past", () => {
		expect(deadlineDays("2026-01-01", 15)).toBe(1);
	});

	it("uses the default when nothing was saved", () => {
		expect(deadlineDays(null, 30)).toBe(30);
	});
});
