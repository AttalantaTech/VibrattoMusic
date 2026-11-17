import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
	emptyEventState,
	type EventChecklistState,
	type TemplateItem,
} from "../types";
import { DEFAULT_TEMPLATE } from "../utils/defaultTemplate";

/**
 * PROTOTYPE: kept in this browser only. The shape is what the back-end is
 * asked to store (a model per profile, a state per event), so the screens
 * stay the same when it does
 */
interface ProfileChecklists {
	/** null: still the suggested model */
	template: Array<TemplateItem> | null;
	events: Record<string, EventChecklistState>;
}

interface ChecklistStore {
	byProfile: Record<number, ProfileChecklists>;
	toggle: (profileId: number, eventKey: string, itemId: string) => void;
	addToEvent: (profileId: number, eventKey: string, item: TemplateItem) => void;
	removeFromEvent: (
		profileId: number,
		eventKey: string,
		itemId: string,
		isExtra: boolean
	) => void;
	saveTemplate: (profileId: number, template: Array<TemplateItem>) => void;
}

const profileOf = (
	state: ChecklistStore,
	profileId: number
): ProfileChecklists =>
	state.byProfile[profileId] ?? { template: null, events: {} };

const withEvent = (
	state: ChecklistStore,
	profileId: number,
	eventKey: string,
	change: (event: EventChecklistState) => EventChecklistState
): Pick<ChecklistStore, "byProfile"> => {
	const profile = profileOf(state, profileId);
	const event = profile.events[eventKey] ?? emptyEventState();

	return {
		byProfile: {
			...state.byProfile,
			[profileId]: {
				...profile,
				events: { ...profile.events, [eventKey]: change(event) },
			},
		},
	};
};

export const useChecklistStore = create<ChecklistStore>()(
	persist(
		(set) => ({
			byProfile: {},
			toggle: (profileId, eventKey, itemId) => {
				set((state) =>
					withEvent(state, profileId, eventKey, (event) => ({
						...event,
						checked: { ...event.checked, [itemId]: !event.checked[itemId] },
					}))
				);
			},
			addToEvent: (profileId, eventKey, item) => {
				set((state) =>
					withEvent(state, profileId, eventKey, (event) => ({
						...event,
						extra: [...event.extra, item],
					}))
				);
			},
			removeFromEvent: (profileId, eventKey, itemId, isExtra) => {
				set((state) =>
					withEvent(state, profileId, eventKey, (event) =>
						isExtra
							? {
									...event,
									extra: event.extra.filter((item) => item.id !== itemId),
								}
							: { ...event, removed: [...event.removed, itemId] }
					)
				);
			},
			saveTemplate: (profileId, template) => {
				set((state) => ({
					byProfile: {
						...state.byProfile,
						[profileId]: { ...profileOf(state, profileId), template },
					},
				}));
			},
		}),
		{ name: "vibratto-checklist-prototype" }
	)
);

/** The profile's model, or the suggested one while it wasn't changed */
export const templateOf = (
	byProfile: ChecklistStore["byProfile"],
	profileId: number
): Array<TemplateItem> => byProfile[profileId]?.template ?? DEFAULT_TEMPLATE;

export const eventStateOf = (
	byProfile: ChecklistStore["byProfile"],
	profileId: number,
	eventKey: string
): EventChecklistState =>
	byProfile[profileId]?.events[eventKey] ?? emptyEventState();

/** A new id for an item typed by the person */
export const newItemId = (): string =>
	`item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
