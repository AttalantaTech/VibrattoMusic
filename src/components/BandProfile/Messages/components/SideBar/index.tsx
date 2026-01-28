import { Circle, MessageSquare, Search } from "lucide-react";
import { SideBarProps } from "./types";
import { Loading } from "@/shared/components/Loading";
import {
	ConversationInfoContainer,
	ConversationsListContainer,
	ConversationTabContainer,
	SearchBarContainer,
	SideBarHeaderContainer,
	UserImageContainer,
	UserInfoContainer,
} from "./styles";
import { useMessagesContext } from "../../contexts/MessagesContext";
import { formatMessageTime, getParticipantInitials } from "../../utils/Message";
import { Conversation } from "@/api/types";

export const SideBar = ({ user, currentProductId }: SideBarProps) => {
	const {
		searchQuery,
		setSearchQuery,
		conversationsLoading,
		filteredConversations,
		selectedConversation,
		setSelectedConversation,
	} = useMessagesContext();

	return (
		<div className="w-80 bg-white border-r border-gray-200 flex flex-col">
			<SideBarHeaderContainer>
				<UserInfoContainer>
					<UserImageContainer>
						{user?.nome ? getParticipantInitials(user.nome) : "U"}
					</UserImageContainer>
					<h3 className="font-medium text-gray-900">
						{user?.nome || "Usuário"}
					</h3>
				</UserInfoContainer>

				<SearchBarContainer>
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
				</SearchBarContainer>
			</SideBarHeaderContainer>

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

			<ConversationsListContainer>
				{conversationsLoading && <Loading />}
				{filteredConversations.length === 0 && (
					<div className="flex flex-col items-center justify-center p-8 text-center">
						<MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
						<p className="text-gray-500 text-sm">
							{searchQuery
								? "Nenhuma conversa encontrada"
								: "Nenhuma conversa ainda"}
						</p>
					</div>
				)}
				{filteredConversations.map((conversation: Conversation) => {
					const isSelected = selectedConversation?.id === conversation.id;
					const hasUnread = !!(
						conversation.numeroNaoLidas && conversation.numeroNaoLidas > 0
					);

					return (
						<ConversationTabContainer
							key={conversation.id}
							onClick={() => {
								setSelectedConversation(conversation);
							}}
							isSelected={isSelected}
						>
							<div className="relative">
								<UserImageContainer size={12}>
									{getParticipantInitials(
										currentProductId
											? conversation.contratanteNome
											: conversation.participanteNome
									)}
								</UserImageContainer>
								{hasUnread && (
									<div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
								)}
								{conversation.online && (
									<Circle className="absolute bottom-0 right-0 w-3 h-3 text-green-500 fill-current" />
								)}
							</div>
							<ConversationInfoContainer>
								<h4 className="font-medium text-gray-900 truncate">
									{currentProductId
										? conversation.contratanteNome
										: conversation.participanteNome}
								</h4>
								<p className="text-sm text-gray-500 truncate">
									{conversation.ultimaMensagem
										? conversation.ultimaMensagem.conteudo.length > 50
											? `${conversation.ultimaMensagem.conteudo.substring(0, 50)}...`
											: conversation.ultimaMensagem.conteudo
										: "Nenhuma mensagem ainda"}
								</p>
								{conversation.ultimaMensagem?.dataEnvio && (
									<p className="text-xs text-gray-400 mt-1">
										{formatMessageTime(conversation.ultimaMensagem.dataEnvio)}
									</p>
								)}
							</ConversationInfoContainer>
							{hasUnread && (
								<div className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 animate-pulse">
									{conversation.numeroNaoLidas}
								</div>
							)}
						</ConversationTabContainer>
					);
				})}
			</ConversationsListContainer>
		</div>
	);
};
