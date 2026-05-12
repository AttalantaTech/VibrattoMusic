import type React from "react";
import { useState } from "react";
import { X } from "lucide-react";
import { useStartConversation } from "../../../../../hooks/useMessaging";
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

	if (!isOpen) return null;

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();

		if (!message.trim()) {
			toast.error("Por favor, preencha todos os campos");
			return;
		}

		startConversation(
			{
				participanteId: participantId,
				conteudo: message,
				senderType: activeProduct?.id ? 2 : 1,
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
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-md">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">
						Iniciar conversa com {participantName}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

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
			</div>
		</div>
	);
};
