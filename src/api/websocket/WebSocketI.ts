export interface WebSocketI {
    createConnection(endpoint: string, token?: string): Promise<void>;
    on(event: string, action: (...args: any[]) => any): void;
    invoke(event: string, ...args: any[]): Promise<void>;
    isConnected(): boolean;
}