// src/features/messaging/useSendStatusMessage.ts
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { messagingKeys, useStartConversation } from "@/hooks/useMessaging";
import {
	buildStatusMessage,
	type MessageLink,
	type StatusMessageType,
	type StatusPayloads,
} from "../utils/messageTemplates";

type SendStatusMessageParameters<K extends StatusMessageType> = {
	type: K;
	produtoMusicalId: number;
	produtoMusicalName: string;
	contratanteId: number;
	produtoMusicalContratanteId: number | null;
	senderType: 1 | 2;
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
		produtoMusicalId,
		produtoMusicalName,
		contratanteId,
		produtoMusicalContratanteId,
		senderType,
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
				produtoMusicalContratanteId,
			},
			{
				onSuccess: () => {
					if (successMessage) toast.success(successMessage);

					console.log("2 - produtoMusicalId:...", produtoMusicalId);
					console.log("2 - contratanteId:...", contratanteId);
					console.log("2 - senderType:...", senderType);
					console.log(
						"2 - produtoMusicalContratanteId:...",
						produtoMusicalContratanteId
					);

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
