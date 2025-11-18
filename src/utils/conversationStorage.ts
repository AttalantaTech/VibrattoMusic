const STORAGE_KEY_PREFIX = 'vibratto_conversations_';

interface StoredConversation {
	id: number;
	participantId: number;
	participantName?: string;
	createdAt: string;
	lastActivity?: string;
}

export class ConversationStorage {
	private static getStorageKey(userId?: string | number): string {
		const id = userId || 'default';
		return `${STORAGE_KEY_PREFIX}${id}`;
	}

	static saveConversation(conversationId: number, participantId: number, participantName?: string, userId?: string | number): void {
		try {
			const key = this.getStorageKey(userId);
			const stored = localStorage.getItem(key);
			const conversations: StoredConversation[] = stored ? JSON.parse(stored) as StoredConversation[] : [];
			
			const existingIndex = conversations.findIndex((c: StoredConversation) => c.id === conversationId);
			
			const newConversation: StoredConversation = {
				id: conversationId,
				participantId,
				participantName,
				createdAt: existingIndex >= 0 && conversations[existingIndex] ? conversations[existingIndex]!.createdAt : new Date().toISOString(),
				lastActivity: new Date().toISOString()
			};
			
			if (existingIndex >= 0) {
				conversations[existingIndex] = newConversation;
			} else {
				conversations.unshift(newConversation);
			}
			
			localStorage.setItem(key, JSON.stringify(conversations));
		} catch (error) {
			console.error('Error saving conversation to localStorage:', error);
		}
	}

	static getConversationIds(userId?: string | number): number[] {
		try {
			const key = this.getStorageKey(userId);
			const stored = localStorage.getItem(key);
			
			if (!stored) return [];
			
			const conversations: StoredConversation[] = JSON.parse(stored) as StoredConversation[];
			return conversations.map(c => c.id);
		} catch (error) {
			console.error('Error reading conversations from localStorage:', error);
			return [];
		}
	}

	static getConversations(userId?: string | number): StoredConversation[] {
		try {
			const key = this.getStorageKey(userId);
			const stored = localStorage.getItem(key);
			
			if (!stored) return [];
			
			return JSON.parse(stored) as StoredConversation[];
		} catch (error) {
			console.error('Error reading conversations from localStorage:', error);
			return [];
		}
	}

	static removeConversation(conversationId: number, userId?: string | number): void {
		try {
			const key = this.getStorageKey(userId);
			const stored = localStorage.getItem(key);
			
			if (!stored) return;
			
			const conversations: StoredConversation[] = JSON.parse(stored) as StoredConversation[];
			const filtered = conversations.filter(c => c.id !== conversationId);
			
			localStorage.setItem(key, JSON.stringify(filtered));
		} catch (error) {
			console.error('Error removing conversation from localStorage:', error);
		}
	}

	static clearConversations(userId?: string | number): void {
		try {
			const key = this.getStorageKey(userId);
			localStorage.removeItem(key);
		} catch (error) {
			console.error('Error clearing conversations from localStorage:', error);
		}
	}

	static updateLastActivity(conversationId: number, userId?: string | number): void {
		try {
			const key = this.getStorageKey(userId);
			const stored = localStorage.getItem(key);
			
			if (!stored) return;
			
			const conversations: StoredConversation[] = JSON.parse(stored) as StoredConversation[];
			const conversation = conversations.find(c => c.id === conversationId);
			
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
			console.error('Error updating conversation activity:', error);
		}
	}

	static updateParticipantName(conversationId: number, participantName: string, userId?: string | number): void {
		try {
			const key = this.getStorageKey(userId);
			const stored = localStorage.getItem(key);
			
			if (!stored) return;
			
			const conversations: StoredConversation[] = JSON.parse(stored) as StoredConversation[];
			const conversation = conversations.find(c => c.id === conversationId);
			
			if (conversation) {
				conversation.participantName = participantName;
				localStorage.setItem(key, JSON.stringify(conversations));
			}
		} catch (error) {
			console.error('Error updating participant name:', error);
		}
	}
}