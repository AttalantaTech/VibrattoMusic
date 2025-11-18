import type { ApiClient } from "../core/client";

interface GenerateImageUrlRequest {
	Evento: string;
	IdCadastro: string;
	ExtensaoArquivo: string;
	IdLista?: number | null;
}

interface GenerateImageUrlResponse {
	url: string;
}

export class ImageUploadService {
	constructor(private readonly apiClient: ApiClient) {}

	/**
	 * Generate a pre-signed SAS URL for image upload
	 */
	async generateSasUrl(parameters: {
		evento: string;
		idCadastro: number;
		extensaoArquivo: string;
		idLista?: number;
	}): Promise<string> {
		const request: GenerateImageUrlRequest = {
			Evento: parameters.evento,
			IdCadastro: parameters.idCadastro.toString(),
			ExtensaoArquivo: parameters.extensaoArquivo,
			IdLista: parameters.idLista ?? null,
		};

		const response = await this.apiClient.post<GenerateImageUrlResponse>(
			"/imagem/gerar-url",
			request
		);

		return response.url;
	}

	/**
	 * Upload an image file directly to Azure Blob Storage using a SAS URL
	 * This follows the same pattern as the PowerShell script:
	 * - Uses PUT method
	 * - Sets x-ms-blob-type header to BlockBlob
	 * - Sets appropriate Content-Type
	 */
	async uploadToAzureBlob(
		sasUrl: string,
		file: File
	): Promise<{ blobUrl: string }> {
		// Extract the blob URL without the SAS token (everything before the '?')
		const blobUrl = sasUrl.split("?")[0] || sasUrl;

		// Determine content type based on file type
		const contentType = file.type || "image/jpeg";

		// Upload the file directly to Azure Blob Storage
		// We use fetch instead of the ApiClient because this is a direct upload to Azure
		const response = await fetch(sasUrl, {
			method: "PUT",
			headers: {
				"x-ms-blob-type": "BlockBlob",
				"Content-Type": contentType,
			},
			body: file,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Failed to upload image to Azure: ${response.status} ${response.statusText}. ${errorText}`
			);
		}

		return { blobUrl };
	}

	/**
	 * Complete image upload flow:
	 * 1. Generate SAS URL from backend
	 * 2. Upload file to Azure Blob Storage
	 * 3. Return the blob URL for saving
	 */
	async uploadImage(parameters: {
		file: File;
		evento: string;
		idCadastro: number;
		idLista?: number;
	}): Promise<string> {
		// Get file extension from the file name
		const fileExtension = parameters.file.name.split(".").pop()?.toLowerCase() || "jpg";

		// Step 1: Generate SAS URL
		const sasUrl = await this.generateSasUrl({
			evento: parameters.evento,
			idCadastro: parameters.idCadastro,
			extensaoArquivo: fileExtension,
			idLista: parameters.idLista,
		});

		// Step 2: Upload to Azure
		const { blobUrl } = await this.uploadToAzureBlob(sasUrl, parameters.file);

		// Step 3: Return the blob URL (without SAS token) for saving
		return blobUrl;
	}

	/**
	 * Delete an uploaded image
	 */
	async deleteImage(url: string): Promise<void> {
		await this.apiClient.delete("/imagem", { data: { url } });
	}
}