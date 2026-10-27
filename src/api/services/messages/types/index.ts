import type { ChatUser } from "@/contexts/MessagesContext/types";

/**
 * Who we are talking to. chat/obter and chat/mensagem receive only the id
 * of the recipient (the sender is identified by the token):
 * - "contratante": IdContratante
 * - "produtoMusical": IdProdutoMusical
 * - "produtoContratante": IdProdutoMusicalContratante
 */
export type ChatRecipient =
	| "contratante"
	| "produtoMusical"
	| "produtoContratante";

export interface StartConversation {
	conteudo: string;
	senderType: number;
	recipient: ChatRecipient;
	conversationId?: number | null;
	contratanteId: number | null;
	produtoMusicalId: number | null;
	produtoMusicalContratanteId: number | null;
}
export interface Message {
	id: number;
	idConversa: number;
	idRemetente: number;
	nomeRemetente: string;
	conteudo: string;
	type?: "text" | "image" | "audio" | "file";
	lida: boolean;
	dataEnvio: string;
	idDestinatario: number;
	tipoDestinatario: number;
	tipoRemetente: number;
}

export interface Conversation {
	id: number;
	contratanteNome: string;
	contratanteId: number | null;
	produtoMusicalContratanteNome: string | null;
	produtoMusicalContratanteId: number | null;
	produtoMusicalNome: string;
	produtoMusicalId: number | null;
	pair: ChatUser;
	ultimaMensagem?: Message;
	mensagens?: Array<Message>;
	totalMensagens?: number;
	numeroMensagensNaoLidas?: number;
	online?: boolean;
}
