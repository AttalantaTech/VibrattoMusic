import { ArrowLeft, Circle, FileText, MessageSquare } from "lucide-react";
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
import { getParticipantInitials, isOwnMessage } from "../../utils/Message";
import type { Message } from "@/api/services/messages/types";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

import { MoreOptionsDropdownItem } from "@/components/ui/MoreOptionsDropdownItem";
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
									const isOwn = isOwnMessage(message, {
										userId: user?.id,
										productId: activeProduct?.id,
									});

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
						{/* Phones: "Propostas" on its own row so the message field gets
						    the full width; from sm up, side by side */}
						<div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
							{currentProductId === selectedConversation?.produtoMusicalId &&
								isProfileComplete && (
									// Menu opens from the button's left edge: centered, it went
									// past the left side of the screen on phones
									<Dropdown
										align="left"
										side="top"
										trigger={
											<button
												type="button"
												aria-haspopup="menu"
												className="inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-primary-300 bg-primary-100/50 px-3 text-sm font-medium text-primary-900 transition-colors hover:bg-primary-100/75"
											>
												<FileText size={16} />
												Propostas
											</button>
										}
									>
										<MoreOptionsDropdownItem
											onClick={() => {
												setIsProposalModalOpen?.(true);
											}}
										>
											<span className="text-sm font-medium">
												Proposta Avulsa
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
					contratanteId={selectedConversation.contratanteId || 0}
					produtoMusicalId={selectedConversation.produtoMusicalId}
					produtoMusicalContratanteId={
						selectedConversation.produtoMusicalContratanteId
					}
					conversationId={selectedConversation.id}
				/>
			)}
		</ChatContainer>
	);
};
