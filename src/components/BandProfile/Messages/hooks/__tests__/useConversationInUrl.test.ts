import { describe, expect, it } from "vitest";
import { nextUrlAction } from "../useConversationInUrl";

const none = { selectedId: undefined, urlId: undefined };

// The back button closes the open conversation instead of leaving the chat
describe("open conversation in the address", () => {
	it("opening a conversation adds it to the address as a new entry", () => {
		expect(nextUrlAction(none, { selectedId: 239, urlId: undefined })).toEqual({
			type: "open",
			id: 239,
			replace: false,
		});
	});

	it("switching conversations replaces the entry, so back closes at once", () => {
		expect(
			nextUrlAction(
				{ selectedId: 239, urlId: 239 },
				{ selectedId: 240, urlId: 239 }
			)
		).toEqual({ type: "open", id: 240, replace: true });
	});

	it("the back button closes the conversation", () => {
		expect(
			nextUrlAction(
				{ selectedId: 239, urlId: 239 },
				{ selectedId: 239, urlId: undefined }
			)
		).toEqual({ type: "close" });
	});

	it("closing on screen (arrow, Esc) clears the address", () => {
		expect(
			nextUrlAction(
				{ selectedId: 239, urlId: 239 },
				{ selectedId: undefined, urlId: 239 }
			)
		).toEqual({ type: "clear" });
	});

	it("an address left from a reload is cleared", () => {
		expect(nextUrlAction(none, { selectedId: undefined, urlId: 239 })).toEqual({
			type: "clear",
		});
	});

	it("nothing to do while the address is catching up", () => {
		// Opened, the address not updated yet
		expect(
			nextUrlAction(
				{ selectedId: 239, urlId: undefined },
				{ selectedId: 239, urlId: undefined }
			)
		).toBeNull();
		// Address updated
		expect(
			nextUrlAction(
				{ selectedId: 239, urlId: undefined },
				{ selectedId: 239, urlId: 239 }
			)
		).toBeNull();
		expect(nextUrlAction(none, none)).toBeNull();
	});
});
