import { useState, useEffect, useRef, useCallback } from "react";
import {
	Search,
	DollarSign,
	Loader2,
	MessageSquare,
	Circle,
	CheckCheck,
	Check,
} from "lucide-react";
import { SendProposalModal } from "./SendProposalModal";
import { StartConversationModal } from "./StartConversationModal";
import { ChatInput } from "../../forms/ChatInput/ChatInput";
import { useSignalRChat } from "../../../hooks/useSignalRChat";
import { useAuthStore } from "../../../store/authStore";
import { useConversations } from "../../../hooks/useMessaging";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { musicalProductService } from "../../../api";
import type { SignalRMessage } from "../../../services/signalr/chatService";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useActiveMusicalProduct } from "../../../hooks/useActiveMusicalProduct";
import { useProfileStatus } from "../../../hooks/useProfileStatus";
import { ProfileIncompleteModal } from "../../ui/ProfileIncompleteModal/ProfileIncompleteModal";
import { SignalRService } from "@/api/services/signalRService";

interface Conversation {
	id: number;
	participantName: string;
	participantId: number;
	lastMessage?: string;
	lastMessageTime?: string;
	unreadCount: number;
	isOnline?: boolean;
}

const MessagesTab = () => {
	const [selectedConversation, setSelectedConversation] =
		useState<Conversation | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
	const [isNewConversationModalOpen, setIsNewConversationModalOpen] =
		useState(false);
	const [newConversationParticipant, setNewConversationParticipant] = useState<{
		id: number;
		name: string;
	} | null>(null);
	const [isProfileIncompleteModalOpen, setIsProfileIncompleteModalOpen] =
		useState(false);
	const [messageInput, setMessageInput] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const messagesContainerRef = useRef<HTMLDivElement>(null);

	// Auth store - using same approach as BandProfile account tab
	const { user, token } = useAuthStore();
	const queryClient = useQueryClient();
	const { activeProduct } = useActiveMusicalProduct();
	const currentProductId = activeProduct?.id
		? Number(activeProduct.id)
		: undefined;

	// Check if user profile is complete for proposal functionality
	const { isProfileComplete } = useProfileStatus();

	// Fetch user's musical products - same as BandProfile account tab
	const { data: myProducts } = useQuery({
		queryKey: ["myMusicalProducts"],
		queryFn: () => musicalProductService.getMyProducts(),
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	const firstProduct = myProducts?.data?.[0];

	// Get conversations from API
	const { data: conversationsData, isLoading: conversationsLoading } =
		useConversations(currentProductId);

	// Transform API data to component format
	const conversations: Array<Conversation> =
		conversationsData?.data?.map((conv: any) => ({
			id: parseInt(conv.id, 0),
			contratanteName: conv.metadata?.contratanteNome || "Usuario Desconhecido",
			contratanteId: conv.metadata?.contratanteId || "Usuario Desconhecido",
			participantName: conv.metadata?.participantName || "Usuario Desconhecido",
			participantId: conv.metadata?.participantId || 0,
			lastMessage: conv.lastMessage?.content || "",
			lastMessageTime: conv.lastMessage?.createdAt || conv.updatedAt,
			unreadCount: conv.unreadCount || 0,
			isOnline: false, // This would need to be determined from online status API
		})) || [];

	// SignalR Chat Hook
	const {
		messages,
		isLoading,
		error,
		currentConversaId,
		sendMessage,
		markAsRead,
		enterConversation,
	} = useSignalRChat({
		onMessageReceived: (message) => {
			// Play notification sound
			playNotificationSound();

			// Update conversation list
			updateConversationWithNewMessage(message);

			// Show toast notification if not in focus
			if (document.hidden) {
				toast.info(
					`Nova mensagem de ${message.nomeRemetente || "Usuário desconhecido"}`,
					{
						description: message.conteudo.substring(0, 50) + "...",
					}
				);
			}
		},
		onMessageRead: () => {
			// Message read event handled
		},
		onNotification: (notification) => {
			toast.info(notification);
		},
	});

	// Enter existing conversation when selected
	useEffect(() => {
		if (selectedConversation && user) {
			console.log("🚀 Entering conversation:", selectedConversation.id);
			// For existing conversations, use enterConversation instead of initializeChat
			enterConversation(selectedConversation.id).catch((error) => {
				console.error("❌ Failed to enter conversation:", error);
			});
		} else {
			console.log(
				"⏸️ Not entering conversation - missing selectedConversation or user"
			);
		}
	}, [selectedConversation, user, enterConversation]);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Mark messages as read when they become visible
	useEffect(() => {
		if (!messages.length || !user) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const messageElement = entry.target as HTMLElement;
						const messageId = parseInt(
							messageElement.dataset["messageId"] || "0"
						);
						const message = messages.find((m) => m.id === messageId);

						// Mark as read if it's not from current user and not already read
						const currentUserId = firstProduct?.usuario?.id || user?.id;
						if (
							message &&
							currentUserId &&
							message.idRemetente !== currentUserId &&
							!message.lida
						) {
							markAsRead(messageId);
						}
					}
				});
			},
			{ threshold: 0.5 }
		);

		// Observe all message elements
		const messageElements =
			messagesContainerRef.current?.querySelectorAll("[data-message-id]");
		messageElements?.forEach((element) => {
			observer.observe(element);
		});

		return () => {
			observer.disconnect();
		};
	}, [messages, user, markAsRead]);

	// Filter conversations based on search
	const filteredConversations = conversations.filter((conversation) => {
		if (!searchQuery) return true;
		const searchLower = searchQuery.toLowerCase();
		return (
			conversation.participantName.toLowerCase().includes(searchLower) ||
			conversation.lastMessage?.toLowerCase().includes(searchLower)
		);
	});

	// Handle sending message
	const handleSendMessage = useCallback(
		async (content: string) => {
			if (!content.trim() || !currentConversaId) return;

			try {
				await sendMessage(content);
				setMessageInput("");
			} catch (error) {
				toast.error("Erro ao enviar mensagem");
			}
		},
		[currentConversaId, sendMessage]
	);

	// Update conversation list with new message
	const updateConversationWithNewMessage = (_message: SignalRMessage) => {
		// Invalidate conversations query to refetch updated data
		queryClient.invalidateQueries({ queryKey: ["messaging", "conversations"] });
	};

	// Helper functions
	const getParticipantInitials = (name: string): string => {
		if (!name || name.length === 0) return "U";
		const parts = name.split(" ");
		const firstPart = parts[0];
		const lastPart = parts[parts.length - 1];
		if (parts.length >= 2 && firstPart?.[0] && lastPart?.[0]) {
			return `${firstPart[0]}${lastPart[0]}`.toUpperCase();
		}
		return name.substring(0, Math.min(name.length, 2)).toUpperCase();
	};

	const formatMessageTime = (date: string): string => {
		try {
			const messageDate = parseISO(date);
			// Convert to Brazil timezone (UTC-3)
			const brazilDate = new Date(messageDate.getTime() - 3 * 60 * 60 * 1000);

			if (isToday(brazilDate)) {
				return format(brazilDate, "HH:mm");
			} else if (isYesterday(brazilDate)) {
				return `Ontem ${format(brazilDate, "HH:mm")}`;
			} else {
				return format(brazilDate, "dd/MM/yyyy HH:mm", { locale: ptBR });
			}
		} catch {
			return "";
		}
	};

	const formatConversationTime = (date: string): string => {
		try {
			const messageDate = parseISO(date);
			// Convert to Brazil timezone (UTC-3)
			const brazilDate = new Date(messageDate.getTime() - 3 * 60 * 60 * 1000);

			if (isToday(brazilDate)) {
				return format(brazilDate, "HH:mm");
			} else if (isYesterday(brazilDate)) {
				return "Ontem";
			} else {
				return format(brazilDate, "dd/MM/yyyy", { locale: ptBR });
			}
		} catch {
			return "";
		}
	};

	const scrollToBottom = () => {
		try {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		} catch (error) {
			// Fallback for test environments where scrollIntoView might not be available
			if (messagesEndRef.current) {
				messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
			}
		}
	};

	const playNotificationSound = () => {
		try {
			const audio = new Audio("/notification.mp3");
			audio.volume = 0.3;
			audio.play().catch(() => {});
		} catch {}
	};

	const getMessageStatus = (message: SignalRMessage): JSX.Element | null => {
		const currentUserId = firstProduct?.usuario?.id || user?.id;
		if (!currentUserId || message.idRemetente !== currentUserId) return null;

		if (message.lida) {
			return <CheckCheck className="w-4 h-4 text-blue-500" />;
		}
		return <Check className="w-4 h-4 text-gray-400" />;
	};

	const [signalRService, setSignalRService] = useState<SignalRService | null>(
		null
	);

	useEffect(() => {
		if (signalRService === null) {
			setSignalRService(new SignalRService());
		} else {
			signalRService?.createConnection("chatHub", token!);

			signalRService?.on("ReceberMensagem", (mensagem) => {
				console.log("mensagem", mensagem);
			});
		}
	}, [signalRService]);

	return (
		<div className="flex h-[75vh] w-full border bg-gray-50">
			{/* Sidebar */}
			<div className="w-80 bg-white border-r border-gray-200 flex flex-col">
				{/* Header */}
				<div className="p-4 border-b border-gray-200">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
								<span className="text-sm font-medium text-gray-600">
									{firstProduct?.usuario?.nome || user?.nome
										? getParticipantInitials(
												firstProduct?.usuario?.nome || user?.nome || ""
											)
										: "U"}
								</span>
							</div>
							<div>
								<h3 className="font-medium text-gray-900">
									{firstProduct?.usuario?.nome || user?.nome || "Usuário"}
								</h3>
							</div>
						</div>
					</div>

					{/* Search Bar */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
						<input
							type="text"
							placeholder="Buscar no chat"
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
							}}
							className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>

				{/* Tabs TODO: Bring this back when we have a way to filter conversations by type */}
				{/* <div className="flex border-b border-gray-200">
					{["Clientes", "Artistas"].map((tab) => (
						<button
							key={tab}
							onClick={() => {
								setActiveTab(tab);
							}}
							className={`flex-1 py-3 px-4 text-sm font-medium ${
								activeTab === tab
									? "text-blue-600 border-b-2 border-blue-600"
									: "text-gray-500 hover:text-gray-700"
							}`}
						>
							{tab}
						</button>
					))}
				</div> */}

				{/* Contacts List */}
				<div className="flex-1 overflow-y-auto">
					{conversationsLoading ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
						</div>
					) : filteredConversations.length === 0 ? (
						<div className="flex flex-col items-center justify-center p-8 text-center">
							<MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
							<p className="text-gray-500 text-sm">
								{searchQuery
									? "Nenhuma conversa encontrada"
									: "Nenhuma conversa ainda"}
							</p>
						</div>
					) : (
						filteredConversations.map((conversation) => {
							const isSelected = selectedConversation?.id === conversation.id;
							const hasUnread = conversation.unreadCount > 0;

							return (
								<div
									key={conversation.id}
									onClick={() => {
										setSelectedConversation(conversation);
									}}
									className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
										isSelected ? "bg-blue-50" : ""
									}`}
								>
									<div className="flex items-center space-x-3">
										<div className="relative">
											<div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
												<span className="text-sm font-medium text-gray-600">
													{getParticipantInitials(conversation.participantName)}
												</span>
											</div>
											{hasUnread && (
												<div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
											)}
											{conversation.isOnline && (
												<Circle className="absolute bottom-0 right-0 w-3 h-3 text-green-500 fill-current" />
											)}
										</div>
										<div className="flex-1 min-w-0">
											<h4 className="font-medium text-gray-900 truncate">
												{currentProductId
													? conversation.contratanteName
													: conversation.participantName}
											</h4>
											<p className="text-sm text-gray-500 truncate">
												{conversation.lastMessage
													? conversation.lastMessage.length > 50
														? `${conversation.lastMessage.substring(0, 50)}...`
														: conversation.lastMessage
													: "Nenhuma mensagem ainda"}
											</p>
											{conversation.lastMessageTime && (
												<p className="text-xs text-gray-400 mt-1">
													{formatConversationTime(conversation.lastMessageTime)}
												</p>
											)}
										</div>
										{hasUnread && (
											<div className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 animate-pulse">
												{conversation.unreadCount}
											</div>
										)}
									</div>
								</div>
							);
						})
					)}
				</div>
			</div>

			{/* Chat Area */}
			<div className="flex-1 flex flex-col">
				{selectedConversation ? (
					<>
						{/* Chat Header */}
						<div className="bg-white border-b border-gray-200 p-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<div className="relative">
										<div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
											<span className="text-sm font-medium text-gray-600">
												{getParticipantInitials(
													selectedConversation.participantName
												)}
											</span>
										</div>
										{selectedConversation.isOnline && (
											<Circle className="absolute bottom-0 right-0 w-3 h-3 text-green-500 fill-current" />
										)}
									</div>
									<div>
										<h2 className="text-lg font-semibold text-gray-900">
											{selectedConversation.participantName}
										</h2>
									</div>
								</div>
								{firstProduct ? (
									activeProduct ? (
										isProfileComplete ? (
											<button
												onClick={() => {
													setIsProposalModalOpen(true);
												}}
												className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
											>
												<DollarSign className="w-4 h-4" />
												<span className="text-sm font-medium">
													Enviar Proposta
												</span>
											</button>
										) : (
											<button
												onClick={() => {
													setIsProfileIncompleteModalOpen(true);
												}}
												className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
											>
												<DollarSign className="w-4 h-4" />
												<span className="text-sm font-medium">
													Completar Perfil
												</span>
											</button>
										)
									) : (
										<button
											disabled
											className="flex items-center space-x-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
										>
											<DollarSign className="w-4 h-4" />
											<span className="text-sm font-medium">
												Enviar Proposta
											</span>
										</button>
									)
								) : null}
							</div>
						</div>

						{/* Messages */}
						<div
							ref={messagesContainerRef}
							className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
						>
							{isLoading ? (
								<div className="flex items-center justify-center h-full">
									<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
								</div>
							) : error ? (
								<div className="flex flex-col items-center justify-center h-full text-center">
									<MessageSquare className="w-12 h-12 text-red-300 mb-3" />
									<p className="text-red-500">{error}</p>
									<button
										onClick={() => {
											window.location.reload();
										}}
										className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
									>
										Recarregar
									</button>
								</div>
							) : messages.length === 0 ? (
								<div className="flex flex-col items-center justify-center h-full text-center">
									<MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
									<p className="text-gray-500">
										Inicie a conversa enviando uma mensagem
									</p>
								</div>
							) : (
								<>
									{messages.map((message) => {
										const currentUserId = firstProduct?.usuario?.id || user?.id;
										const isOwn = currentUserId
											? message.idRemetente === currentUserId
											: false;
										return (
											<div
												key={message.id}
												data-message-id={message.id}
												className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}
											>
												{isOwn ? (
													// Mensagem própria (direita)
													<div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
														<div className="flex flex-col">
															<div className="bg-blue-600 text-white px-4 py-3 rounded-l-2xl rounded-tr-2xl rounded-br-md shadow-lg">
																<p className="text-sm leading-relaxed">
																	{message.conteudo}
																</p>
															</div>
															<div className="flex items-center justify-end space-x-1 mt-1 px-1">
																<p className="text-xs text-gray-500">
																	{formatMessageTime(message.dataEnvio)}
																</p>
																{getMessageStatus(message)}
															</div>
														</div>
													</div>
												) : (
													// Mensagem de outros (esquerda)
													<div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
														<div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
															<span className="text-xs font-semibold text-white">
																{getParticipantInitials(
																	message.nomeRemetente ||
																		selectedConversation.participantName
																)}
															</span>
														</div>
														<div className="flex flex-col">
															<p className="text-xs font-medium text-gray-700 mb-1 px-1">
																{message.nomeRemetente ||
																	selectedConversation.participantName}
															</p>
															<div className="bg-white border border-gray-200 px-4 py-3 rounded-r-2xl rounded-tl-2xl rounded-bl-md shadow-lg">
																<p className="text-sm text-gray-800 leading-relaxed">
																	{message.conteudo}
																</p>
															</div>
															<div className="flex items-center space-x-1 mt-1 px-1">
																<p className="text-xs text-gray-500">
																	{formatMessageTime(message.dataEnvio)}
																</p>
															</div>
														</div>
													</div>
												)}
											</div>
										);
									})}
									<div ref={messagesEndRef} />
								</>
							)}
						</div>

						{/* Input Area */}
						<div className="bg-white border-t border-gray-200 p-4">
							<ChatInput
								value={messageInput}
								onChange={(e) => {
									setMessageInput(e.target.value);
								}}
								onSend={handleSendMessage}
								disabled={isLoading}
								placeholder={
									isLoading ? "Carregando..." : "Digite sua mensagem..."
								}
							/>
						</div>
					</>
				) : (
					<div className="flex-1 flex items-center justify-center bg-gray-50">
						<div className="text-center">
							<MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								Selecione uma conversa
							</h3>
							<p className="text-gray-500">
								Escolha uma conversa na lista ao lado para começar
							</p>
						</div>
					</div>
				)}
			</div>

			{/* SendProposalModal */}
			{selectedConversation && (
				<SendProposalModal
					isOpen={isProposalModalOpen}
					onClose={() => {
						setIsProposalModalOpen(false);
					}}
					recipientId={selectedConversation.participantId}
					conversationId={selectedConversation.id}
					onProposalSent={async (proposalDetails: string) => {
						// Send the proposal notification message to the chat
						if (sendMessage) {
							await sendMessage(proposalDetails);
						}
					}}
				/>
			)}

			{/* StartConversationModal */}
			{newConversationParticipant && (
				<StartConversationModal
					isOpen={isNewConversationModalOpen}
					onClose={() => {
						setIsNewConversationModalOpen(false);
						setNewConversationParticipant(null);
					}}
					participantId={newConversationParticipant.id}
					participantName={newConversationParticipant.name}
					onConversationStarted={() => {
						// Refresh conversations list and select the new one
						// The conversation list will be automatically refreshed by React Query
						// You could also navigate to the new conversation here
					}}
				/>
			)}

			{/* ProfileIncompleteModal */}
			<ProfileIncompleteModal
				isOpen={isProfileIncompleteModalOpen}
				onClose={() => setIsProfileIncompleteModalOpen(false)}
			/>
		</div>
	);
};

export default MessagesTab;
