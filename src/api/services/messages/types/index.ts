import type { ChatUser } from "@/contexts/MessagesContext/types";

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
	contratanteId: number;
	produtoMusicalContratanteNome: string | null;
	produtoMusicalContratanteId: number | null;
	participanteNome: string;
	participanteId: number;
	pair: ChatUser;
	ultimaMensagem?: Message;
	mensagens?: Array<Message>;
	totalMensagens?: number;
	numeroMensagensNaoLidas?: number;
	online?: boolean;
}
