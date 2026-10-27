import type { Message } from "@/api/services/messages/types";
import { toBR } from "@/utils";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const playNotificationSound = () => {
	try {
		const audio = new Audio("/notification.mp3");
		audio.volume = 0.3;
		audio.play().catch(() => {});
	} catch {
		return;
	}
};

export const formatMessageTime = (
	date: string,
	options: { long?: boolean } = {}
): string => {
	try {
		const messageDate = parseISO(date);
		const brazilDate = toBR(messageDate);

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

export type MessageSender = {
	userId?: number | null;
	productId?: number | null;
};

// Professionals send as their musical product (type 2), contractors as the
// user (type 1), so "my message" depends on which profile is active
export const isOwnMessage = (
	message: Message,
	{ userId, productId }: MessageSender
): boolean => {
	const ownId = productId || userId;
	if (!ownId || message.idRemetente !== ownId) return false;

	// User and product ids come from different tables and can coincide;
	// realtime messages may arrive without the sender type
	const ownType = productId ? 2 : 1;
	return !message.tipoRemetente || message.tipoRemetente === ownType;
};

export const isMessageRead = (
	message: Message,
	sender: MessageSender
): boolean | null => {
	if (!isOwnMessage(message, sender)) return null;

	return message.lida;
};
