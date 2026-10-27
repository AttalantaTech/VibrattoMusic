// src/features/messaging/useSendStatusMessage.ts
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { messagingKeys, useStartConversation } from "@/hooks/useMessaging";
import type { ChatRecipient } from "@/api/services/messages/types";
import {
	buildStatusMessage,
	type MessageLink,
	type StatusMessageType,
	type StatusPayloads,
} from "../utils/messageTemplates";

type SendStatusMessageParameters<K extends StatusMessageType> = {
	type: K;
	produtoMusicalId: number | null;
	produtoMusicalName: string;
	contratanteId: number | null;
	produtoMusicalContratanteId: number | null;
	senderType: 1 | 2;
	/** Who we are talking to (decides which single id is sent to the API) */
	recipient: ChatRecipient;
	conversationId?: number | null;
	link?: MessageLink;
	payload: StatusPayloads[K];
	successMessage?: string;
	errorMessage?: string;
	redirectToMessages?: boolean;
	onSuccess?: () => void;
};

export const useSendStatusMessage = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { mutate: startConversation, isPending } = useStartConversation();

	const sendStatusMessage = <K extends StatusMessageType>({
		type,
		contratanteId,
		produtoMusicalId,
		produtoMusicalContratanteId,
		produtoMusicalName,
		senderType,
		recipient,
		conversationId,
		link,
		payload,
		successMessage,
		errorMessage = "Erro ao enviar mensagem",
		redirectToMessages = false,
		onSuccess,
	}: SendStatusMessageParameters<K>) => {
		const conteudo = buildStatusMessage(type, {
			recipientName: produtoMusicalName,
			link,
			...payload,
		});

		startConversation(
			{
				produtoMusicalId,
				contratanteId,
				conteudo,
				senderType,
				recipient,
				conversationId,
				produtoMusicalContratanteId,
			},
			{
				onSuccess: () => {
					if (successMessage) toast.success(successMessage);

					/** Updates the sidebar with the new message */
					void queryClient.invalidateQueries({
						queryKey: messagingKeys.conversations(),
					});

					if (redirectToMessages) {
						void navigate({ to: "/band/me", search: { tab: "messages" } });
					}
					onSuccess?.();
				},
				onError: () => {
					toast.error(errorMessage);
				},
			}
		);
	};

	return { sendStatusMessage, isSending: isPending };
};
