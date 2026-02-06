import { WebSocketEvent, WebSocketTrigger } from "./types";

export interface WebSocketI {
	createConnection(endpoint: string, token?: string): Promise<void>;
	start(): Promise<void>;
	stop(): Promise<void>;
	onclose(handler: (error?: Error) => void): void;
	on(event: WebSocketEvent, action: (...args: any[]) => any): void;
	off(event: WebSocketEvent, action: (...args: any[]) => any): void;
	invoke(trigger: WebSocketTrigger, ...args: any[]): Promise<void>;
	isConnected(): boolean;
}