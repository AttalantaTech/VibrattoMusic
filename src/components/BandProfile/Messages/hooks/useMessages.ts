import { SignalRMessage } from "@/api/types";
import { useAuthStore } from "@/store/authStore";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const useMessages = () => {
	const { user } = useAuthStore();
	const currentUserId = user?.id;

	const playNotificationSound = () => {
		try {
			const audio = new Audio("/notification.mp3");
			audio.volume = 0.3;
			audio.play().catch(() => {});
		} catch {}
	};

	const formatConversationTime = (date: string): string => {
		try {
			const messageDate = parseISO(date);
			// Convert to Brazil timezone (UTC-3)
			const brazilDate = new Date(messageDate.getTime() - 3 * 60 * 60 * 1000);

			if (isToday(brazilDate)) {
				return format(brazilDate, "HH:mm");
			} else if (isYesterday(brazilDate)) {
				return "Ontem";
			} else {
				return format(brazilDate, "dd/MM/yyyy", { locale: ptBR });
			}
		} catch {
			return "";
		}
	};

	const formatMessageTime = (date: string): string => {
		try {
			const messageDate = parseISO(date);
			// Convert to Brazil timezone (UTC-3)
			const brazilDate = new Date(messageDate.getTime() - 3 * 60 * 60 * 1000);

			if (isToday(brazilDate)) {
				return format(brazilDate, "HH:mm");
			} else if (isYesterday(brazilDate)) {
				return `Ontem ${format(brazilDate, "HH:mm")}`;
			} else {
				return format(brazilDate, "dd/MM/yyyy HH:mm", { locale: ptBR });
			}
		} catch {
			return "";
		}
	};

	const getParticipantInitials = (name: string): string => {
		if (!name || name.length === 0) return "U";
		const parts = name.split(" ");
		const firstPart = parts[0];
		const lastPart = parts[parts.length - 1];
		if (parts.length >= 2 && firstPart?.[0] && lastPart?.[0]) {
			return `${firstPart[0]}${lastPart[0]}`.toUpperCase();
		}
		return name.substring(0, Math.min(name.length, 2)).toUpperCase();
	};

	const isMessageRead = (message: SignalRMessage): boolean | null => {
		if (!currentUserId || message.idRemetente !== currentUserId) return null;

		return message.lida;
	};

	return {
		playNotificationSound,
		isMessageRead,
		formatConversationTime,
		formatMessageTime,
		getParticipantInitials,
	};
};
