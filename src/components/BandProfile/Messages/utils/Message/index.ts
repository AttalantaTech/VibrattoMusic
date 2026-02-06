import { Message } from "@/api/services/messages/types";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const playNotificationSound = () => {
	try {
		const audio = new Audio("/notification.mp3");
		audio.volume = 0.3;
		audio.play().catch(() => {});
	} catch {}
};

export const formatMessageTime = (
	date: string,
	options: { long?: boolean } = {}
): string => {
	try {
		const messageDate = parseISO(date);
		// Convert to Brazil timezone (UTC-3)
		const brazilDate = new Date(messageDate.getTime() - 3 * 60 * 60 * 1000);

		if (isToday(brazilDate)) {
			return format(brazilDate, "HH:mm");
		} else if (isYesterday(brazilDate)) {
			return "Ontem" + (options.long ? ` ${format(brazilDate, "HH:mm")}` : "");
		} else {
			return format(brazilDate, "dd/MM/yyyy" + (options.long ? " HH:mm" : ""), {
				locale: ptBR,
			});
		}
	} catch {
		return "";
	}
};

export const getParticipantInitials = (name: string): string => {
	if (!name || name.length === 0) return "U";
	const parts = name.split(" ");
	const firstPart = parts[0];
	const lastPart = parts[parts.length - 1];
	if (parts.length >= 2 && firstPart?.[0] && lastPart?.[0]) {
		return `${firstPart[0]}${lastPart[0]}`.toUpperCase();
	}
	return name.substring(0, Math.min(name.length, 2)).toUpperCase();
};

export const isMessageRead = (
	message: Message,
	currentUserId?: number | null
): boolean | null => {
	if (!currentUserId || message.idRemetente !== currentUserId) return null;

	return message.lida;
};
