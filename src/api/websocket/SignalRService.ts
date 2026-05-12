import type { HubConnection } from "@microsoft/signalr";
import {
	HubConnectionBuilder,
	HubConnectionState,
	LogLevel,
} from "@microsoft/signalr";
import { getEnvironmentConfig } from "../config/environment";
import type { WebSocketI } from "./WebSocketI";

export class SignalRService implements WebSocketI {
	private signalRConnection?: HubConnection;

	createConnection = (endpoint: string, token?: string) => {
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
			.configureLogging(LogLevel.Trace)
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

	on = (event: string, action: (...args: Array<any>) => any): void => {
		this.signalRConnection?.on(event, action);
	};

	off = (event: string, action: (...args: Array<any>) => any): void => {
		this.signalRConnection?.off(event, action);
	};

	invoke = async (event: string, ...args: Array<any>): Promise<void> => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		await this.signalRConnection?.invoke(event, ...args);
	};

	isConnected = (): boolean => {
		return this.signalRConnection?.state === HubConnectionState.Connected;
	};
}
