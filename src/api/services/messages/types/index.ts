export interface Message {
	id: number;
	idConversa: number;
	idRemetente: number;
	nomeRemetente: string;
	conteudo: string;
	type?: "text" | "image" | "audio" | "file";
	lida: boolean;
	dataEnvio: string;
}

export interface Conversation {
	id: number;
	contratanteNome: string;
	contratanteId: number;
	produtoMusicalContratanteNome: string | null;
	produtoMusicalContratanteId: number | null;
	participanteNome: string;
	participanteId: number;
	ultimaMensagem?: Message;
	mensagens?: Message[];
	totalMensagens?: number;
	numeroMensagensNãoLidasContratante?: number;
	numeroMensagensNãoLidasContratado?: number;
	online?: boolean;
}
