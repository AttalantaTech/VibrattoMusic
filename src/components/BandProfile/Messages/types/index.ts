export interface Conversation {
	id: number;
	contratanteName: string;
	contratanteId: number;
	participantName: string;
	participantId: number;
	lastMessage?: string;
	lastMessageTime?: string;
	unreadCount: number;
	isOnline?: boolean;
}