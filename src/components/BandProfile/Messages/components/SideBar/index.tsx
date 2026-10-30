import { Circle, MessageSquare, Search } from "lucide-react";
import { Loading } from "@/shared/components/Loading";
import {
	ConversationInfoContainer,
	ConversationsListContainer,
	ConversationTabContainer,
	SearchBarContainer,
	SideBarContainer,
	SideBarHeaderContainer,
	UserImageContainer,
	UserInfoContainer,
} from "./styles";
import { formatMessageTime, getParticipantInitials } from "../../utils/Message";
import { useChat } from "@/hooks/useChat";
import { stripHtml } from "@/utils/stripHtml";
import { withoutReplyQuote } from "@/features/message/utils/replyQuote";

export const SideBar = () => {
	const {
		currentChatUser,
		searchQuery,
		setSearchQuery,
		isConversationsLoading,
		filteredConversations,
		selectedConversation,
		setSelectedConversation,
	} = useChat() || {};

	return (
		<SideBarContainer isInsideConversation={!!selectedConversation}>
			<SideBarHeaderContainer>
				<UserInfoContainer>
					<UserImageContainer>
						{currentChatUser?.name
							? getParticipantInitials(currentChatUser.name)
							: "U"}
					</UserImageContainer>
					<h3 className="font-medium text-gray-900">
						{currentChatUser?.name || "Usuário"}
					</h3>
				</UserInfoContainer>

				<SearchBarContainer>
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
					<input
						type="text"
						placeholder="Buscar no chat"
						value={searchQuery}
						onChange={
							setSearchQuery
								? (event: React.ChangeEvent<HTMLInputElement>) => {
										setSearchQuery(event.target.value);
									}
								: () => {}
						}
						className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
					/>
				</SearchBarContainer>
			</SideBarHeaderContainer>

			<ConversationsListContainer>
				{isConversationsLoading && <Loading />}
				{filteredConversations?.length === 0 && (
					<div className="flex flex-col items-center justify-center p-8 text-center">
						<MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
						<p className="text-gray-500 text-sm">
							{searchQuery
								? "Nenhuma conversa encontrada"
								: "Nenhuma conversa ainda"}
						</p>
					</div>
				)}
				{filteredConversations?.map((conversation) => {
					const isSelected = selectedConversation?.id === conversation.id;

					const unreadCount = conversation.numeroMensagensNaoLidas || 0;

					return (
						<ConversationTabContainer
							key={conversation.id}
							onClick={() => {
								setSelectedConversation?.(conversation);
							}}
							isSelected={isSelected}
						>
							<div className="relative">
								<UserImageContainer size={12}>
									{conversation.pair.profileImageUrl ? (
										<img
											src={conversation.pair.profileImageUrl}
											alt={conversation.pair.name}
											className="w-full h-full object-cover rounded-full"
										/>
									) : (
										getParticipantInitials(conversation.pair.name || "U")
									)}
								</UserImageContainer>
								{unreadCount > 0 && (
									<div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
								)}
								{conversation.online && (
									<Circle className="absolute bottom-0 right-0 w-3 h-3 text-green-500 fill-current" />
								)}
							</div>
							<ConversationInfoContainer>
								<h4 className="font-medium text-gray-900 truncate">
									{conversation.pair.name}
								</h4>
								<p className="text-sm text-gray-500 truncate">
									{/* Always as plain text: short formatted messages showed
									    their tags ("<b>Oi</b>"). A reply shows only the answer,
									    not the quote of the message it answers */}
									{conversation.ultimaMensagem
										? stripHtml(
												withoutReplyQuote(conversation.ultimaMensagem.conteudo)
											)
										: "Nenhuma mensagem ainda"}
								</p>
								{conversation.ultimaMensagem?.dataEnvio && (
									<p className="text-xs text-gray-400 mt-1">
										{formatMessageTime(conversation.ultimaMensagem.dataEnvio)}
									</p>
								)}
							</ConversationInfoContainer>
							{unreadCount > 0 && (
								<div
									className={`bg-primary-500 text-white text-xs rounded-full ${unreadCount ? "px-2 py-1" : "w-3 h-3"} animate-pulse`}
								>
									{unreadCount || ""}
								</div>
							)}
						</ConversationTabContainer>
					);
				})}
			</ConversationsListContainer>
		</SideBarContainer>
	);
};
