import { beforeEach, describe, expect, it } from "vitest";
import type { PreReservation } from "../usePreReservations";
import {
	DISMISSED_PRE_RESERVATIONS_STORAGE,
	readDismissed,
	splitPreReservations,
	useDismissedPreReservations,
} from "../useDismissedPreReservations";

const reservation = (id: number) =>
	({ proposal: { id }, date: "2026-12-20", client: "Maria" }) as PreReservation;

// Reminders the professional removed from the bell and the agenda
describe("removed pre-reservation reminders", () => {
	beforeEach(() => {
		localStorage.clear();
		useDismissedPreReservations.setState({ dismissed: [] });
	});

	it("a removed reminder is saved for the next visit", () => {
		useDismissedPreReservations.getState().dismiss(42);
		expect(useDismissedPreReservations.getState().dismissed).toEqual([42]);
		expect(readDismissed()).toEqual([42]);
	});

	it("removing the same reminder twice keeps one entry", () => {
		useDismissedPreReservations.getState().dismiss(7);
		useDismissedPreReservations.getState().dismiss(7);
		expect(readDismissed()).toEqual([7]);
	});

	it("undoing brings the reminder back", () => {
		useDismissedPreReservations.getState().dismiss(7);
		useDismissedPreReservations.getState().dismiss(8);
		useDismissedPreReservations.getState().restore([7]);
		expect(useDismissedPreReservations.getState().dismissed).toEqual([8]);
		expect(readDismissed()).toEqual([8]);
	});

	it("a corrupted value counts as nothing removed", () => {
		localStorage.setItem(DISMISSED_PRE_RESERVATIONS_STORAGE, "{not json");
		expect(readDismissed()).toEqual([]);
	});

	it("removed reminders leave the list and can be listed to restore", () => {
		const { visible, removed } = splitPreReservations(
			[reservation(1), reservation(2), reservation(3)],
			[2, 99]
		);
		expect(visible.map((r) => r.proposal.id)).toEqual([1, 3]);
		expect(removed.map((r) => r.proposal.id)).toEqual([2]);
	});
});
