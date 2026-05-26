import type { useChatConnection } from "@/api/services/chat/useChatConnection";
import type { Conversation, Message } from "@/api/services/messages/types";
import type {
	QueryObserverResult,
	RefetchOptions,
} from "@tanstack/react-query";
import type {
	Dispatch,
	MutableRefObject,
	RefObject,
	SetStateAction,
} from "react";

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
	handleSendMessage: (
		content: string,
		senderType: number,
		idMusicalProduct: number | null
	) => Promise<void>;
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
	messagesContainerRef: RefObject<HTMLDivElement>;
	messagesEndRef: RefObject<HTMLDivElement>;
	scrollToBottom: () => void;
};

export type ChatMessage = {
	id: number;
	conversationId: number;
	content: string;
	sentAt: string;
	senderId: number;
};

export type MessagesState = {
	messages: Array<ChatMessage>;
	conversations: Array<Conversation>;
	currentConversationId: number | null;
};

export type UseMessagesStateReturn = {
	currentProductId?: number;
	currentChatUser: ChatUser;
	messageInput: string;
	setMessageInput: Dispatch<SetStateAction<string>>;
	searchQuery: string;
	setSearchQuery: Dispatch<SetStateAction<string>>;
	messages: Array<Message>;
	setMessages: Dispatch<SetStateAction<Array<Message>>>;
	newMessages: Array<Message>;
	setNewMessages: Dispatch<SetStateAction<Array<Message>>>;
	conversations: Array<Conversation>;
	setConversations: Dispatch<SetStateAction<Array<Conversation>>>;
	newConversationData: Array<Conversation>;
	setNewConversationData: Dispatch<SetStateAction<Array<Conversation>>>;
	selectedConversation: Conversation | null;
	setSelectedConversation: Dispatch<SetStateAction<Conversation | null>>;
	newConversationParticipant: { id: number; name: string } | null;
	setNewConversationParticipant: Dispatch<
		SetStateAction<{ id: number; name: string } | null>
	>;
	isProposalModalOpen: boolean;
	setIsProposalModalOpen: Dispatch<SetStateAction<boolean>>;
	isNewConversationModalOpen: boolean;
	setIsNewConversationModalOpen: Dispatch<SetStateAction<boolean>>;
	isProfileIncompleteModalOpen: boolean;
	setIsProfileIncompleteModalOpen: Dispatch<SetStateAction<boolean>>;
	shouldLoadCurrentConversation: boolean;
	setShouldLoadCurrentConversation: Dispatch<SetStateAction<boolean>>;
	shouldLoadConversations: boolean;
	setShouldLoadConversations: Dispatch<SetStateAction<boolean>>;
	currentConversationId: MutableRefObject<number | null>;
	messagesEndRef: RefObject<HTMLDivElement | null>;
	messagesContainerRef: RefObject<HTMLDivElement | null>;
	conversationsRef: MutableRefObject<Array<Conversation>>;
	filteredConversations: Array<Conversation>;
};

export type UseMessagesQueriesProps = {
	currentProductId?: number;
	token?: string | null;
	shouldLoadConversations: boolean;
	currentConversationId: number | null;
	shouldLoadCurrentConversation: boolean;
};

export type UseMessagesQueriesReturn = {
	conversationsData?: Array<Conversation>;
	isConversationsLoading: boolean;
	refetchConversations: () => Promise<unknown>;
	historyMessages?: {
		pages: Array<Array<Message>>;
	};
	isMessagesLoading: boolean;
	messagesError: unknown;
	refetchMessages: () => Promise<unknown>;
};

export type UseMessagesUIProps = {
	conversations: Array<Conversation>;
	searchQuery: string;
};

export type UseMessagesUIReturn = {
	scrollToBottom: () => void;
};

export type UseMessagesObserverProps = {
	messages: Array<Message>;
	user: unknown;
	currentUserId?: number;
	messagesContainerRef: RefObject<HTMLDivElement | null>;
	handleMarkMessageAsRead: (messageId: number) => Promise<void>;
	messagesEndRef: RefObject<HTMLDivElement>;
};

export type UseMessagesRealtimeProps = {
	chatConnection: ReturnType<typeof useChatConnection>;
	currentConversationId: number | null;
	newMessages: Array<Message>;
	setNewMessages: Dispatch<SetStateAction<Array<Message>>>;
	setMessages: Dispatch<SetStateAction<Array<Message>>>;
	conversations: Array<Conversation>;
	setConversations: (value: SetStateAction<Array<Conversation>>) => void;
	setNewConversationData: Dispatch<React.SetStateAction<Array<Conversation>>>;
	refetchConversations: (
		options?: RefetchOptions
	) => Promise<QueryObserverResult<Array<Conversation>, Error>>;
	setMessageInput: (value: SetStateAction<string>) => void;
	messages: Array<Message>;
};

export type UseMessagesRealtimeReturn = {
	connect: () => void;
	start: () => Promise<void>;
	sendMessage: (
		content: string,
		senderType: number,
		idMusicalProduct: number | null
	) => Promise<void>;
	enterConversation: (conversationId: number) => Promise<void>;
	markMessageAsRead: (messageId: number) => Promise<void>;
	addReceiveMessageHandler: (callback: (message: Message) => void) => void;
	addMessageReadHandler: (callback: (messageId: number) => void) => void;
	addNotificationHandler: (callback: (notification: string) => void) => void;
	addOnCloseHandler: (callback: (error?: Error) => void) => void;
	removeHandlers: () => void;
	handleReceiveMessage: (message: Message) => void;
	handleMessageRead: (messageId: number) => void;
};
