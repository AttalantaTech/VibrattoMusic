const STORAGE_KEY_PREFIX = "vibratto_conversations_";

interface StoredConversation {
	id: number;
	produtoMusicalId: number | null;
	produtoMusicalNome: string;
	createdAt: string;
	lastActivity?: string;
}

interface SaveConversation {
	conversationId: number;
	produtoMusicalId: number | null;
	produtoMusicalNome: string;
	userId?: string | number;
}

export class ConversationStorage {
	private static getStorageKey(userId?: string | number): string {
		const id = userId || "default";
		return `${STORAGE_KEY_PREFIX}${id}`;
	}

	static saveConversation({
		conversationId,
		produtoMusicalId,
		produtoMusicalNome,
		userId,
	}: SaveConversation): void {
		try {
			const key = this.getStorageKey(userId);
			const stored = localStorage.getItem(key);
			const conversations: Array<StoredConversation> = stored
				? (JSON.parse(stored) as Array<StoredConversation>)
				: [];

			const existingIndex = conversations.findIndex(
				(c: StoredConversation) => c.id === conversationId
			);

			const newConversation: StoredConversation = {
				id: conversationId,
				produtoMusicalId,
				produtoMusicalNome,
				createdAt:
					existingIndex >= 0 && conversations[existingIndex]
						? conversations[existingIndex].createdAt
						: new Date().toISOString(),
				lastActivity: new Date().toISOString(),
			};

			if (existingIndex >= 0) {
				conversations[existingIndex] = newConversation;
			} else {
				conversations.unshift(newConversation);
			}

			localStorage.setItem(key, JSON.stringify(conversations));
		} catch (error) {
			console.error("Error saving conversation to localStorage:", error);
		}
	}

	static getConversationIds(userId?: string | number): Array<number> {
		try {
			const key = this.getStorageKey(userId);
			const stored = localStorage.getItem(key);

			if (!stored) return [];

			const conversations: Array<StoredConversation> = JSON.parse(
				stored
			) as Array<StoredConversation>;
			return conversations.map((c) => c.id);
		} catch (error) {
			console.error("Error reading conversations from localStorage:", error);
			return [];
		}
	}

	static getConversations(userId?: string | number): Array<StoredConversation> {
		try {
			const key = this.getStorageKey(userId);
			const stored = localStorage.getItem(key);

			if (!stored) return [];

			return JSON.parse(stored) as Array<StoredConversation>;
		} catch (error) {
			console.error("Error reading conversations from localStorage:", error);
			return [];
		}
	}

	static removeConversation(
		conversationId: number,
		userId?: string | number
	): void {
		try {
			const key = this.getStorageKey(userId);
			const stored = localStorage.getItem(key);

			if (!stored) return;

			const conversations: Array<StoredConversation> = JSON.parse(
				stored
			) as Array<StoredConversation>;
			const filtered = conversations.filter((c) => c.id !== conversationId);

			localStorage.setItem(key, JSON.stringify(filtered));
		} catch (error) {
			console.error("Error removing conversation from localStorage:", error);
		}
	}

	static clearConversations(userId?: string | number): void {
		try {
			const key = this.getStorageKey(userId);
			localStorage.removeItem(key);
		} catch (error) {
			console.error("Error clearing conversations from localStorage:", error);
		}
	}

	static updateLastActivity(
		conversationId: number,
		userId?: string | number
	): void {
		try {
			const key = this.getStorageKey(userId);
			const stored = localStorage.getItem(key);

			if (!stored) return;

			const conversations: Array<StoredConversation> = JSON.parse(
				stored
			) as Array<StoredConversation>;
			const conversation = conversations.find((c) => c.id === conversationId);

			if (conversation) {
				conversation.lastActivity = new Date().toISOString();

				conversations.sort((a, b) => {
					const aTime = new Date(a.lastActivity || a.createdAt).getTime();
					const bTime = new Date(b.lastActivity || b.createdAt).getTime();
					return bTime - aTime;
				});

				localStorage.setItem(key, JSON.stringify(conversations));
			}
		} catch (error) {
			console.error("Error updating conversation activity:", error);
		}
	}

	static updateParticipantName(
		conversationId: number,
		produtoMusicalNome: string,
		userId?: string | number
	): void {
		try {
			const key = this.getStorageKey(userId);
			const stored = localStorage.getItem(key);

			if (!stored) return;

			const conversations: Array<StoredConversation> = JSON.parse(
				stored
			) as Array<StoredConversation>;
			const conversation = conversations.find((c) => c.id === conversationId);

			if (conversation) {
				conversation.produtoMusicalNome = produtoMusicalNome;
				localStorage.setItem(key, JSON.stringify(conversations));
			}
		} catch (error) {
			console.error("Error updating participant name:", error);
		}
	}
}
