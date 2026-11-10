import { create } from "zustand";
import { toast } from "sonner";
import {
	usePreReservations,
	type PreReservation,
} from "@/hooks/usePreReservations";

export const DISMISSED_PRE_RESERVATIONS_STORAGE = "dismissed-pre-reservations";

/** Ids of the proposals whose reminder was removed on this device */
export const readDismissed = (): Array<number> => {
	try {
		const stored: unknown = JSON.parse(
			localStorage.getItem(DISMISSED_PRE_RESERVATIONS_STORAGE) ?? "[]"
		);
		return Array.isArray(stored)
			? stored.filter((id): id is number => typeof id === "number")
			: [];
	} catch {
		// Storage blocked or corrupted: nothing was removed
		return [];
	}
};

const save = (ids: Array<number>) => {
	try {
		localStorage.setItem(
			DISMISSED_PRE_RESERVATIONS_STORAGE,
			JSON.stringify(ids)
		);
	} catch {
		// Without storage the choice lasts until the page reloads
	}
};

interface DismissedPreReservationsState {
	dismissed: Array<number>;
	dismiss: (proposalId: number) => void;
	restore: (proposalIds: Array<number>) => void;
}

// One list for the bell and the agenda, so removing in one updates the other.
// Kept in the browser (there is no notification API), so it is per device
export const useDismissedPreReservations =
	create<DismissedPreReservationsState>((set) => ({
		dismissed: readDismissed(),
		dismiss: (proposalId) => {
			// Read again: another tab may have removed one meanwhile
			const next = [...new Set([...readDismissed(), proposalId])];
			save(next);
			set({ dismissed: next });
		},
		restore: (proposalIds) => {
			const next = readDismissed().filter((id) => !proposalIds.includes(id));
			save(next);
			set({ dismissed: next });
		},
	}));

/** Splits the pre-reservations into the ones still shown and the removed ones */
export const splitPreReservations = (
	reservations: Array<PreReservation>,
	dismissed: Array<number>
) => ({
	visible: reservations.filter((r) => !dismissed.includes(r.proposal.id)),
	removed: reservations.filter((r) => dismissed.includes(r.proposal.id)),
});

/**
 * The pre-reservation reminders of the bell and the agenda. The professional
 * can remove one (a date that will not be blocked); it can be brought back
 * right away ("Desfazer") or later, in the agenda
 */
export const usePreReservationReminders = (productId: number | undefined) => {
	const reservations = usePreReservations(productId);
	const { dismissed, dismiss, restore } = useDismissedPreReservations();
	const { visible, removed } = splitPreReservations(reservations, dismissed);

	const remove = (reservation: PreReservation) => {
		dismiss(reservation.proposal.id);
		toast("Lembrete de pré-reserva excluído", {
			action: {
				label: "Desfazer",
				onClick: () => {
					restore([reservation.proposal.id]);
				},
			},
		});
	};

	const restoreAll = () => {
		restore(removed.map((r) => r.proposal.id));
	};

	return { preReservations: visible, removed, remove, restoreAll };
};
