import { Circle, DollarSign, MessageSquare } from "lucide-react";
import { useActiveMusicalProduct } from "@/hooks/useActiveMusicalProduct";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { Loading } from "@/shared/components/Loading";
import { useAuthStore } from "@/store/authStore";
import { ChatInput } from "@/components/forms/ChatInput/ChatInput";
import { useMessagesContext } from "../../contexts/MessagesContext";
import { UserImageContainer } from "../SideBar/styles";
import {
	ChatHeaderContainer,
	ChatInputContainer,
	ChatMessagesContainer,
	Message,
	MessageLine,
	OwnMessage,
} from "./styles";
import { useMessages } from "../../hooks/useMessages";

export const Chat = () => {
	const { user } = useAuthStore();
	const currentUserId = user?.id;

	const { activeProduct } = useActiveMusicalProduct();
	const currentProductId = activeProduct?.id;
	const { isProfileComplete } = useProfileStatus();

	const {
		messages,
		error,
		isLoading,
		messagesContainerRef,
		selectedConversation,
		setIsProposalModalOpen,
		setIsProfileIncompleteModalOpen,
		messagesEndRef,
		messageInput,
		setMessageInput,
		handleSendMessage,
	} = useMessagesContext();

	const { getParticipantInitials } = useMessages();

	return (
		<div className="flex-1 flex flex-col">
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
						<div className="flex items-center space-x-3">
							<div className="relative">
								<UserImageContainer>
									{getParticipantInitials(
										currentProductId
											? selectedConversation.contratanteName
											: selectedConversation.participantName
									)}
								</UserImageContainer>
								{selectedConversation.isOnline && (
									<Circle className="absolute bottom-0 right-0 w-3 h-3 text-green-500 fill-current" />
								)}
							</div>
							<h2 className="text-lg font-semibold text-gray-900">
								{currentProductId
									? selectedConversation.contratanteName
									: selectedConversation.participantName}
							</h2>
						</div>
						{activeProduct && !isProfileComplete && (
							<button
								onClick={() => {
									setIsProfileIncompleteModalOpen(true);
								}}
								className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
							>
								<DollarSign className="w-4 h-4" />
								<span className="text-sm font-medium">Completar Perfil</span>
							</button>
						)}
						{isProfileComplete && (
							<button
								disabled={!!activeProduct}
								onClick={() => {
									setIsProposalModalOpen(true);
								}}
								className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
							>
								<DollarSign className="w-4 h-4" />
								<span className="text-sm font-medium">Enviar Proposta</span>
							</button>
						)}
					</ChatHeaderContainer>

					<ChatMessagesContainer messagesContainerRef={messagesContainerRef}>
						{isLoading && <Loading />}
						{error && (
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
						)}
						{messages.length === 0 && !isLoading && !error && (
							<div className="flex flex-col items-center justify-center h-full text-center">
								<MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
								<p className="text-gray-500">
									Inicie a conversa enviando uma mensagem
								</p>
							</div>
						)}
						{!isLoading && !error && (
							<>
								{messages.map((message) => {
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
												<OwnMessage message={message} />
											) : (
												<Message
													message={message}
													participantName={selectedConversation.participantName}
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
							onChange={(e) => {
								setMessageInput(e.target.value);
							}}
							onSend={handleSendMessage}
							disabled={isLoading}
							placeholder={
								isLoading ? "Carregando..." : "Digite sua mensagem..."
							}
						/>
					</ChatInputContainer>
				</>
			)}
		</div>
	);
};
