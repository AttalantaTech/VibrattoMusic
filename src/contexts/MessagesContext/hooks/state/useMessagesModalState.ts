import { useState } from "react";

export const useMessagesModalState = () => {
	const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
	const [isNewConversationModalOpen, setIsNewConversationModalOpen] =
		useState(false);
	const [isProfileIncompleteModalOpen, setIsProfileIncompleteModalOpen] =
		useState(false);
	const [shouldLoadCurrentConversation, setShouldLoadCurrentConversation] =
		useState(false);
	const [shouldLoadConversations, setShouldLoadConversations] = useState(true);

	return {
		isProposalModalOpen,
		setIsProposalModalOpen,
		isNewConversationModalOpen,
		setIsNewConversationModalOpen,
		isProfileIncompleteModalOpen,
		setIsProfileIncompleteModalOpen,
		shouldLoadCurrentConversation,
		setShouldLoadCurrentConversation,
		shouldLoadConversations,
		setShouldLoadConversations,
	};
};
