import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { getEnvironmentConfig } from "../config/environment";

export class SignalRService {
	private signalRConnection?: HubConnection;

	createConnection = (endpoint: string, token: string) => {
		const envConfig = getEnvironmentConfig();
		const baseUrl = envConfig.apiBaseUrl;
		// .replace(/^https/, "ws");

		this.signalRConnection = new HubConnectionBuilder()
			.withUrl(`${baseUrl}/${endpoint}`, { accessTokenFactory: () => token })
			.withAutomaticReconnect()
			.build();

		this.signalRConnection.start().catch((error) => console.error(error));
	}
    
    on = (event: string, action: (...args: any[]) => any): void => {
        this.signalRConnection?.on(event, action);
    }

    invoke = (event: string, ...args: any[]): void => {
        this.signalRConnection?.invoke(event, args);
    }
}
