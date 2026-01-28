import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { getEnvironmentConfig } from "../config/environment";
import { WebSocketI } from "./WebSocketI";

export class SignalRService implements WebSocketI {
	private signalRConnection?: HubConnection;

	createConnection = async (endpoint: string, token?: string) => {
		const envConfig = getEnvironmentConfig();
		const baseUrl = envConfig.apiBaseUrl.endsWith("/api")
			? envConfig.apiBaseUrl.slice(0, -4)
			: envConfig.apiBaseUrl;

		this.signalRConnection = new HubConnectionBuilder()
			.withUrl(`${baseUrl}/${endpoint}`, {
				accessTokenFactory: () => token || "",
			})
			.withAutomaticReconnect()
			.build();

		await this.signalRConnection.start().catch((error) => console.error(error));
	};

	on = (event: string, action: (...args: any[]) => any): void => {
		this.signalRConnection?.on(event, action);
	};

	invoke = async (event: string, ...args: any[]): Promise<void> => {
		await this.signalRConnection?.invoke(event, ...args);
	};

	isConnected = (): boolean => {
		return this.signalRConnection?.state === "Connected";
	};
}
