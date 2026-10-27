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
		// Phones with a conversation open: the chat becomes a fixed layer from
		// under the header (h-16) to the bottom of the screen, like a chat app,
		// instead of a 75vh box inside a page that also scrolls
		<div
			className={`flex h-[75vh] w-full border bg-gray-50 ${
				selectedConversation
					? "max-md:fixed max-md:inset-x-0 max-md:top-16 max-md:bottom-0 max-md:z-30 max-md:h-auto max-md:border-0"
					: ""
			}`}
		>
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
