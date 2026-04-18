import type { Conversation, Message } from "@/api/services/messages/types";

export type ChatUser = {
	id: number;
	name: string;
	type: "user" | "product";
	isContractor?: boolean;
	profileImageUrl?: string | null;
};

export type MessagesContextType = {
	currentChatUser: ChatUser;
	messageInput: string;
	setMessageInput: (value: string) => void;
	messagesError: Error | null;
	messages: Array<Message>;
	searchQuery: string;
	setSearchQuery: (value: string) => void;
	filteredConversations: Array<Conversation>;
	conversations: Array<Conversation>;
	isMessagesLoading: boolean;
	isConversationsLoading: boolean;
	selectedConversation: Conversation | null;
	setSelectedConversation: (value: Conversation | null) => void;
	handleSendMessage: (content: string) => Promise<void>;
	handleMarkMessageAsRead: (messageId: number) => Promise<void>;
	newConversationParticipant: { id: number; name: string } | null;
	setNewConversationParticipant: (
		value: { id: number; name: string } | null
	) => void;
	isProfileComplete: boolean;
	isProposalModalOpen: boolean;
	setIsProposalModalOpen: (value: boolean) => void;
	isNewConversationModalOpen: boolean;
	setIsNewConversationModalOpen: (value: boolean) => void;
	isProfileIncompleteModalOpen: boolean;
	setIsProfileIncompleteModalOpen: (value: boolean) => void;
	messagesContainerRef: React.RefObject<HTMLDivElement>;
	messagesEndRef: React.RefObject<HTMLDivElement>;
	scrollToBottom: () => void;
};
