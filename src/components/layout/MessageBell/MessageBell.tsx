import { MessageSquare } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "../../../store/authStore";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";

export const MessageBell = () => {
	const { isAuthenticated } = useAuthStore();
	const navigate = useNavigate();
	const { totalUnreadMessages } = useUnreadMessagesCount();

	// Don't render if not authenticated
	if (!isAuthenticated) {
		return null;
	}

	const handleClick = () => {
		navigate({ to: "/band/me", search: { tab: "messages" } });
	};

	return (
		<button
			className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
			onClick={handleClick}
			aria-label="Mensagens"
		>
			<MessageSquare color="#667085" size={20} />
			{totalUnreadMessages > 0 && (
				<div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
					{totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
				</div>
			)}
		</button>
	);
};
