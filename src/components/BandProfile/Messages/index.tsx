import { ProfileIncompleteModal } from "../../ui/ProfileIncompleteModal/ProfileIncompleteModal";
import { SideBar } from "./components/SideBar";
import { Chat } from "./components/Chat";
import { SendProposalModal } from "./components/SendProposalModal";
import { StartConversationModal } from "./components/StartConversationModal";
import { useMessagesContext } from "@/contexts/MessagesContext";
import { useEffect } from "react";

const MessagesTab = () => {
	const messagesContext = useMessagesContext();
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
	} = messagesContext || {};

	useEffect(() => {
		scrollToBottom?.();
	}, [selectedConversation, scrollToBottom]);

	useEffect(() => {
		return () => {
			setSelectedConversation?.(null);
			setNewConversationParticipant?.(null);
		};
	}, []);

	return (
		<div className="flex h-[75vh] w-full border bg-gray-50">
			{selectedConversation && (
				<SendProposalModal
					isOpen={!!isProposalModalOpen}
					onClose={() => setIsProposalModalOpen?.(false)}
					recipientId={selectedConversation.participanteId}
					conversationId={selectedConversation.id}
					onProposalSent={async (proposalDetails: string) => {
						// Send the proposal notification message to the chat
						if (handleSendMessage) {
							await handleSendMessage(proposalDetails);
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
				onClose={() => setIsProfileIncompleteModalOpen?.(false)}
			/>

			<SideBar />
			<Chat />
		</div>
	);
};

export default MessagesTab;
