import { describe, expect, it } from "vitest";
import type { Message } from "@/api/services/messages/types";
import { isOwnMessage } from "..";

const message = (idRemetente: number, tipoRemetente: number) =>
	({ idRemetente, tipoRemetente }) as Message;

// Decides the side of each message in the chat
describe("own message", () => {
	it("a professional's message is the one sent by the active product", () => {
		expect(isOwnMessage(message(878, 2), { userId: 63, productId: 878 })).toBe(
			true
		);
		expect(isOwnMessage(message(879, 2), { userId: 63, productId: 878 })).toBe(
			false
		);
	});

	it("a contractor's message is the one sent by the user", () => {
		expect(isOwnMessage(message(63, 1), { userId: 63 })).toBe(true);
		expect(isOwnMessage(message(63, 2), { userId: 63 })).toBe(false);
	});

	it("a user with the same id as the active product is someone else", () => {
		expect(isOwnMessage(message(878, 1), { userId: 63, productId: 878 })).toBe(
			false
		);
	});

	it("old cards saved as 'user' by the hiring product are still its own", () => {
		const sender = { userId: 63, productId: 878, contractorProductId: 878 };
		expect(isOwnMessage(message(878, 1), sender)).toBe(true);
		// For the hired product they stay on the other side
		expect(
			isOwnMessage(message(878, 1), {
				userId: 70,
				productId: 879,
				contractorProductId: 878,
			})
		).toBe(false);
	});
});
