// WebSocket specific types for chat messages
export interface WebSocketMessage {
	idMensagem: number;
	idConversa: number;
	idRemetente: number;
	idDestinatario?: number;
	conteudo: string;
}

export type WebSocketEvent = "ReceberMensagem" | "MensagemLida" | "Notificar";

export type WebSocketTrigger =
	| "EntrarConversa"
	| "EnviarMensagem"
	| "MarcarMensagemComoLida";

export type WebSocketEventHandler = (...args: any[]) => any;
