// WebSocket specific types for chat messages
export type WebSocketEvent = "ReceberMensagem" | "MensagemLida" | "Notificar";

export type WebSocketTrigger =
	| "EntrarConversa"
	| "EnviarMensagem"
	| "MarcarMensagemComoLida";

export type WebSocketEventHandler = (...args: Array<any>) => any;
