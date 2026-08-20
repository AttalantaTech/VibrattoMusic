import {
	ArrowLeft,
	Circle,
	DollarSign,
	MessageSquare,
	PlusCircle,
} from "lucide-react";
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
import { useChat } from "@/hooks/useChat";
import { getParticipantInitials } from "../../utils/Message";
import type { Message } from "@/api/services/messages/types";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

import { MoreOptionsDropdownItem } from "@/components/ui/MoreOptionsDropdownItem";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { Dropdown } from "@/components/ui/Dropdown/Dropdown";
import { BudgetListModal } from "@/components/BandProfile/Budgets/components/BudgetListModal";
import { useState } from "react";

export const Chat = () => {
	const { user } = useAuthStore();

	const { activeProduct } = useMusicalProductStore();
	const currentProductId = activeProduct?.id;
	const { isProfileComplete } = useProfileStatus();

	const [openBudgetListModal, setOpenBudgetListModal] = useState(false);

	const {
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
	} = useChat() || {};

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
									onClick={() => {
										setSelectedConversation?.(null);
									}}
								>
									<ArrowLeft />
								</div>
							)}
							<div className="relative">
								<UserImageContainer>
									{selectedConversation.pair.profileImageUrl ? (
										<img
											src={selectedConversation.pair.profileImageUrl}
											alt={selectedConversation.pair.name}
											className="w-full h-full object-cover rounded-full"
										/>
									) : (
										getParticipantInitials(
											selectedConversation.pair.name || "U"
										)
									)}
								</UserImageContainer>
								{selectedConversation.online && (
									<Circle className="absolute bottom-0 right-0 w-3 h-3 text-green-500 fill-current" />
								)}
							</div>
							<h2 className="text-md md:text-lg whitespace-nowrap text-ellipsis overflow-hidden font-semibold text-gray-900">
								{selectedConversation.pair.name ?? "Usuário"}
							</h2>
						</div>
						{activeProduct && !isProfileComplete && (
							<button
								onClick={() => {
									setIsProfileIncompleteModalOpen?.(true);
								}}
								className="flex items-center space-x-1 px-2 md:space-x-2 md:px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
							>
								<DollarSign className="w-4 h-4" />
								<span className="text-sm font-medium">Completar Perfil</span>
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
									const isOwn =
										message.idRemetente === activeProduct?.id ||
										(!activeProduct?.id && message.idRemetente === user?.id);

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
													userName={selectedConversation.pair.name || "Usuário"}
													userProfileImageUrl={
														selectedConversation.pair.profileImageUrl || null
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
						<div className="flex items-center gap-2">
							{currentProductId === selectedConversation?.participanteId &&
								isProfileComplete && (
									<Dropdown
										align="center"
										side="top"
										trigger={
											<IconButton
												variant="none"
												icon={<PlusCircle size={24} />}
											/>
										}
									>
										<MoreOptionsDropdownItem
											onClick={() => {
												setIsProposalModalOpen?.(true);
											}}
										>
											<span className="text-sm font-medium">
												Criar Proposta
											</span>
										</MoreOptionsDropdownItem>

										<MoreOptionsDropdownItem
											onClick={() => {
												setOpenBudgetListModal(true);
											}}
										>
											<span className="text-sm font-medium">
												Solicitações de Orçamentos
											</span>
										</MoreOptionsDropdownItem>
									</Dropdown>
								)}

							<ChatInput
								value={messageInput}
								onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
									setMessageInput?.(event.target.value);
								}}
								onSend={(content: string) => {
									if (handleSendMessage) {
										void handleSendMessage(
											content,
											activeProduct?.id ? 2 : 1,
											activeProduct?.id ? activeProduct.id : null
										);
									}
								}}
								disabled={isMessagesLoading}
								placeholder={
									isMessagesLoading ? "Carregando..." : "Digite sua mensagem..."
								}
							/>
						</div>
					</ChatInputContainer>
				</>
			)}

			{selectedConversation?.pair.id && (
				<BudgetListModal
					isOpen={openBudgetListModal}
					onClose={setOpenBudgetListModal}
					idProdutoMusicalConversa={selectedConversation?.pair.id}
					idDestinatario={
						selectedConversation.produtoMusicalContratanteId ||
						selectedConversation.contratanteId
					}
				/>
			)}
		</ChatContainer>
	);
};
