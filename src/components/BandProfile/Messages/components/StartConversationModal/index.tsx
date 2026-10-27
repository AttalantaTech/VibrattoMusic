import type React from "react";
import { useState } from "react";
import { useStartConversation } from "../../../../../hooks/useMessaging";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Conversation } from "@/api/services/messages/types";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

interface StartConversationModalProps {
	isOpen: boolean;
	onClose: () => void;
	participantId: number;
	participantName: string;
	onConversationStarted?: (conversationId: number) => void;
}

export const StartConversationModal: React.FC<StartConversationModalProps> = ({
	isOpen,
	onClose,
	participantId,
	participantName,
	onConversationStarted,
}) => {
	const { activeProduct } = useMusicalProductStore();
	const [message, setMessage] = useState("");
	const { mutate: startConversation, isPending } = useStartConversation();

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();

		if (!message.trim()) {
			toast.error("Por favor, preencha todos os campos");
			return;
		}

		// Whoever starts the conversation is the contratante side (an active
		// musical product or the logged-in user) and talks to the hired product.
		const isProductContractor = Boolean(activeProduct?.id);

		startConversation(
			{
				produtoMusicalId: participantId,
				contratanteId: null,
				conteudo: message,
				senderType: isProductContractor ? 2 : 1,
				recipient: "produtoMusical",
				produtoMusicalContratanteId: activeProduct?.id || null,
			},
			{
				onSuccess: (data: Conversation) => {
					toast.success("Conversa iniciada com sucesso!");
					onConversationStarted?.(data.id);
					onClose();
					setMessage("");
				},
				onError: () => {
					toast.error("Erro ao iniciar conversa");
				},
			}
		);
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				// Stays open while the message is being sent
				if (!open && !isPending) onClose();
			}}
		>
			<DialogContent aria-describedby={undefined} className="block max-w-md">
				<DialogTitle className="mb-4 pr-8 text-xl font-semibold leading-snug">
					Iniciar conversa com {participantName}
				</DialogTitle>

				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label
							htmlFor="message"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Mensagem inicial
						</label>
						<textarea
							id="message"
							value={message}
							onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
								setMessage(event.target.value);
							}}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
							placeholder="Digite sua mensagem..."
							disabled={isPending}
						/>
					</div>

					<div className="flex justify-end space-x-3">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
							disabled={isPending}
						>
							Cancelar
						</button>
						<button
							type="submit"
							className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
							disabled={isPending}
						>
							{isPending ? "Iniciando..." : "Iniciar Conversa"}
						</button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
};
