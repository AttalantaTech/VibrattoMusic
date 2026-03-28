import { ArrowLeft, Circle, DollarSign, MessageSquare } from "lucide-react";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { Loading } from "@/shared/components/Loading";
import { useAuthStore } from "@/store/authStore";
import { ChatInput } from "@/components/forms/ChatInput/ChatInput";
import { UserImageContainer } from "../SideBar/styles";
import {
	ChatContainer,
	ChatHeaderContainer,
	ChatInputContainer,
	ChatMessagesContainer,
	MessageElement,
	MessageLine,
	OwnMessageElement,
} from "./styles";
import { getParticipantInitials } from "../../utils/Message";
import type { Message } from "@/api/services/messages/types";
import { useMessagesContext } from "@/contexts/MessagesContext";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

export const Chat = () => {
	const { user } = useAuthStore();
	const currentUserId = user?.id;

	const { activeProduct } = useMusicalProductStore();
	const currentProductId = activeProduct?.id;
	const { isProfileComplete } = useProfileStatus();

	const messagesContext = useMessagesContext();
	const {
		currentChatUser,
		messageInput,
		setMessageInput,
		messages,
		messagesError,
		selectedConversation,
		setSelectedConversation,
		isMessagesLoading,
		handleSendMessage,
		setIsProposalModalOpen,
		setIsProfileIncompleteModalOpen,
		messagesContainerRef,
		messagesEndRef,
	} = messagesContext || {};

	return (
		<ChatContainer isInsideConversation={!!selectedConversation}>
			{!selectedConversation && (
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
			{selectedConversation && (
				<>
					<ChatHeaderContainer>
						<div className="flex items-center space-x-1 md:space-x-3">
							{selectedConversation && (
								<div
									className="p-1 md:p-2 rounded-full transition-colors hover:bg-gray-200 bg-white flex md:hidden"
									onClick={() => setSelectedConversation?.(null)}
								>
									<ArrowLeft />
								</div>
							)}
							<div className="relative">
								<UserImageContainer>
									{getParticipantInitials(currentChatUser?.name || "Usuário")}
								</UserImageContainer>
								{selectedConversation.online && (
									<Circle className="absolute bottom-0 right-0 w-3 h-3 text-green-500 fill-current" />
								)}
							</div>
							<h2 className="text-md md:text-lg whitespace-nowrap text-ellipsis overflow-hidden font-semibold text-gray-900">
								{currentChatUser?.name || "Usuário"}
							</h2>
						</div>
						{activeProduct && !isProfileComplete && (
							<button
								onClick={() => setIsProfileIncompleteModalOpen?.(true)}
								className="flex items-center space-x-1 px-2 md:space-x-2 md:px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
							>
								<DollarSign className="w-4 h-4" />
								<span className="text-sm font-medium">Completar Perfil</span>
							</button>
						)}
						{currentProductId === selectedConversation?.participanteId &&
							isProfileComplete && (
								<button
									onClick={() => setIsProposalModalOpen?.(true)}
									className="flex items-center space-x-1 px-2 md:space-x-2 md:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
								>
									<DollarSign className="w-4 h-4" />
									<span className="text-sm font-medium">Criar Proposta</span>
								</button>
							)}
					</ChatHeaderContainer>

					<ChatMessagesContainer messagesContainerRef={messagesContainerRef}>
						{isMessagesLoading && <Loading />}
						{messagesError && (
							<div className="flex flex-col items-center justify-center h-full text-center">
								<MessageSquare className="w-12 h-12 text-red-300 mb-3" />
								<p className="text-red-500">{messagesError.message}</p>
								<button
									onClick={() => {
										window.location.reload();
									}}
									className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
								>
									Recarregar
								</button>
							</div>
						)}
						{!messages ||
							(messages.length === 0 &&
								!isMessagesLoading &&
								!messagesError && (
									<div className="flex flex-col items-center justify-center h-full text-center">
										<MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
										<p className="text-gray-500">
											Inicie a conversa enviando uma mensagem
										</p>
									</div>
								))}
						{!isMessagesLoading && !messagesError && (
							<>
								{messages?.map((message: Message) => {
									const isOwn = currentUserId
										? message.idRemetente === currentUserId
										: false;
									return (
										<MessageLine
											key={message.id}
											message={message}
											isOwn={isOwn}
										>
											{isOwn ? (
												<OwnMessageElement message={message} />
											) : (
												<MessageElement
													message={message}
													userName={
														currentUserId === selectedConversation.contratanteId
															? selectedConversation.participanteNome
															: selectedConversation.contratanteNome
													}
												/>
											)}
										</MessageLine>
									);
								})}
								<div ref={messagesEndRef} />
							</>
						)}
					</ChatMessagesContainer>

					<ChatInputContainer>
						<ChatInput
							value={messageInput}
							onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
								setMessageInput?.(event.target.value);
							}}
							onSend={handleSendMessage ?? (() => {})}
							disabled={isMessagesLoading}
							placeholder={
								isMessagesLoading ? "Carregando..." : "Digite sua mensagem..."
							}
						/>
					</ChatInputContainer>
				</>
			)}
		</ChatContainer>
	);
};
