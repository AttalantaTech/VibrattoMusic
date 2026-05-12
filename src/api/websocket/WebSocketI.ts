import type { WebSocketEvent, WebSocketTrigger } from "./types";

export interface WebSocketI {
	createConnection(endpoint: string, token?: string): void;
	start(): Promise<void>;
	stop(): Promise<void>;
	onclose(handler: (error?: Error) => void): void;
	on(event: WebSocketEvent, action: (...args: Array<any>) => any): void;
	off(event: WebSocketEvent, action: (...args: Array<any>) => any): void;
	invoke(trigger: WebSocketTrigger, ...args: Array<any>): Promise<void>;
	isConnected(): boolean;
}
