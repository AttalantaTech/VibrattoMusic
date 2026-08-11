import { useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { ProfileIncompleteModal } from "../../ui/ProfileIncompleteModal/ProfileIncompleteModal";
import { SideBar } from "./components/SideBar";
import { Chat } from "./components/Chat";
import { SendProposalModal } from "../Proposals/components/SendProposalModal";
import { StartConversationModal } from "./components/StartConversationModal";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

const MessagesTab = () => {
	const { activeProduct } = useMusicalProductStore();

	const {
		selectedConversation,
		setSelectedConversation,
		newConversationParticipant,
		setNewConversationParticipant,
		handleSendMessage,
		isProposalModalOpen,
		setIsProposalModalOpen,
		isNewConversationModalOpen,
		setIsNewConversationModalOpen,
		isProfileIncompleteModalOpen,
		setIsProfileIncompleteModalOpen,
		scrollToBottom,
	} = useChat() || {};

	useEffect(() => {
		scrollToBottom?.();
	}, [selectedConversation, scrollToBottom]);

	useEffect(() => {
		return () => {
			setSelectedConversation?.(null);
			setNewConversationParticipant?.(null);
		};
	}, [setNewConversationParticipant, setSelectedConversation]);

	return (
		<div className="flex h-[75vh] w-full border bg-gray-50">
			{selectedConversation && (
				<SendProposalModal
					isOpen={!!isProposalModalOpen}
					onClose={() => {
						setIsProposalModalOpen?.(false);
					}}
					recipientId={selectedConversation.participanteId}
					conversationId={selectedConversation.id}
					contractorId={
						selectedConversation.produtoMusicalContratanteId ??
						selectedConversation.contratanteId
					}
					contractorName={
						selectedConversation.produtoMusicalContratanteNome ??
						selectedConversation.contratanteNome
					}
					onProposalSent={async (proposalDetails: string) => {
						// Send the proposal notification message to the chat
						if (handleSendMessage) {
							await handleSendMessage(
								proposalDetails,
								activeProduct?.id ? 2 : 1,
								activeProduct?.id ? activeProduct.id : null
							);
						}
					}}
				/>
			)}

			{newConversationParticipant && (
				<StartConversationModal
					isOpen={!!isNewConversationModalOpen}
					onClose={() => {
						setIsNewConversationModalOpen?.(false);
						setNewConversationParticipant?.(null);
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

			<ProfileIncompleteModal
				isOpen={!!isProfileIncompleteModalOpen}
				onClose={() => {
					setIsProfileIncompleteModalOpen?.(false);
				}}
			/>

			<SideBar />
			<Chat />
		</div>
	);
};

export default MessagesTab;
