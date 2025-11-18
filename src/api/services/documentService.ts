import type { ApiClient } from "../core/client";

export class DocumentService {
	constructor(private readonly apiClient: ApiClient) {}

	/**
	 * Get document by ID
	 */
	async getDocument(documentId: number): Promise<any> {
		return this.apiClient.get(`documento/${documentId}`);
	}
}
