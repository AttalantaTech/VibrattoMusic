import { useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { ProfileIncompleteModal } from "../../ui/ProfileIncompleteModal/ProfileIncompleteModal";
import { SideBar } from "./components/SideBar";
import { Chat } from "./components/Chat";
import { SendProposalModal } from "../Proposals/components/SendProposalModal";
import { StartConversationModal } from "./components/StartConversationModal";

const MessagesTab = () => {
	const {
		selectedConversation,
		setSelectedConversation,
		newConversationParticipant,
		setNewConversationParticipant,
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
					conversationId={selectedConversation.id}
					contractorId={selectedConversation.contratanteId ?? undefined}
					contractorProductId={selectedConversation.produtoMusicalContratanteId}
					contractorName={
						selectedConversation.produtoMusicalContratanteNome ??
						selectedConversation.contratanteNome
					}
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
