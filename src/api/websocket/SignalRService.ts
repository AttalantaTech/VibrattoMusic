import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { getEnvironmentConfig } from "../config/environment";
import { WebSocketI } from "./WebSocketI";

export class SignalRService implements WebSocketI {
	private signalRConnection?: HubConnection;

	createConnection = async (endpoint: string, token?: string) => {
		const envConfig = getEnvironmentConfig();
		const baseUrl = envConfig.apiBaseUrl.endsWith("/api/")
			? envConfig.apiBaseUrl.slice(0, -4)
			: envConfig.apiBaseUrl.endsWith("/api")
				? envConfig.apiBaseUrl.slice(0, -3)
				: envConfig.apiBaseUrl;

		this.signalRConnection = new HubConnectionBuilder()
			.withUrl(`${baseUrl}/${endpoint}`, {
				accessTokenFactory: () => token || "",
			})
			.withAutomaticReconnect()
			.build();
	};

	start(): Promise<void> {
		return this.signalRConnection?.start() || Promise.resolve();
	}

	stop(): Promise<void> {
		return this.signalRConnection?.stop() || Promise.resolve();
	}

	onclose = (handler: (error?: Error) => void): void => {
		this.signalRConnection?.onclose(handler);
	};

	on = (event: string, action: (...args: any[]) => any): void => {
		this.signalRConnection?.on(event, action);
	};

	off = (event: string, action: (...args: any[]) => any): void => {
		this.signalRConnection?.off(event, action);
	};

	invoke = async (event: string, ...args: any[]): Promise<void> => {
		await this.signalRConnection?.invoke(event, ...args);
	};

	isConnected = (): boolean => {
		return this.signalRConnection?.state === "Connected";
	};
}
