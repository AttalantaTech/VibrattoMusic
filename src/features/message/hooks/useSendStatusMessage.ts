// src/features/messaging/useSendStatusMessage.ts
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { messagingKeys, useStartConversation } from "@/hooks/useMessaging";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import {
	buildStatusMessage,
	type MessageLink,
	type StatusMessageType,
	type StatusPayloads,
} from "../utils/messageTemplates";

type SendStatusMessageParameters<K extends StatusMessageType> = {
	type: K;
	recipientId: number;
	recipientName?: string;
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
	const { activeProduct } = useMusicalProductStore();
	const { mutate: startConversation, isPending } = useStartConversation();

	const sendStatusMessage = <K extends StatusMessageType>({
		type,
		recipientId,
		recipientName,
		link,
		payload,
		successMessage,
		errorMessage = "Erro ao enviar mensagem",
		redirectToMessages = false,
		onSuccess,
	}: SendStatusMessageParameters<K>) => {
		const conteudo = buildStatusMessage(type, {
			recipientName,
			link,
			...payload,
		});

		startConversation(
			{
				participanteId: recipientId,
				conteudo,
				senderType: activeProduct?.id ? 2 : 1,
				produtoMusicalContratanteId: activeProduct?.id || null,
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
