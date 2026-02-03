import { useAuthStore } from "../../../store/authStore";
import { useActiveMusicalProduct } from "../../../hooks/useActiveMusicalProduct";
import { ProfileIncompleteModal } from "../../ui/ProfileIncompleteModal/ProfileIncompleteModal";
import { SideBar } from "./components/SideBar";
import { Chat } from "./components/Chat";
import { SendProposalModal } from "./components/SendProposalModal";
import { StartConversationModal } from "./components/StartConversationModal";
import { useMessagesContext } from "@/contexts/MessagesContext";

const MessagesTab = () => {
	// Auth store - using same approach as BandProfile account tab
	const { user } = useAuthStore();

	// Active Musical Product
	const { activeProduct } = useActiveMusicalProduct();
	const currentProductId = activeProduct?.id
		? Number(activeProduct.id)
		: undefined;

	const {
		selectedConversation,
		newConversationParticipant,
		setNewConversationParticipant,
		sendMessage,
		isProposalModalOpen,
		setIsProposalModalOpen,
		isNewConversationModalOpen,
		setIsNewConversationModalOpen,
		isProfileIncompleteModalOpen,
		setIsProfileIncompleteModalOpen,
	} = useMessagesContext();

	return (
		<div className="flex h-[75vh] w-full border bg-gray-50">
			{selectedConversation && (
				<SendProposalModal
					isOpen={isProposalModalOpen}
					onClose={() => {
						setIsProposalModalOpen(false);
					}}
					recipientId={selectedConversation.participantId}
					conversationId={selectedConversation.id}
					onProposalSent={async (proposalDetails: string) => {
						// Send the proposal notification message to the chat
						if (sendMessage) {
							await sendMessage(proposalDetails);
						}
					}}
				/>
			)}

			{newConversationParticipant && (
				<StartConversationModal
					isOpen={isNewConversationModalOpen}
					onClose={() => {
						setIsNewConversationModalOpen(false);
						setNewConversationParticipant(null);
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
				isOpen={isProfileIncompleteModalOpen}
				onClose={() => setIsProfileIncompleteModalOpen(false)}
			/>

			<SideBar user={user} currentProductId={currentProductId} />
			<Chat />
		</div>
	);
};

export default MessagesTab;
