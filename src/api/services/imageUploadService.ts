import type { ApiClient } from "../core/client";
import type { FileEventType, ImageDeleteRequest } from "../types";

/** Told as the file goes up: bytes sent so far and the size of the file */
export type UploadProgressListener = (loaded: number, total: number) => void;

interface GenerateImageUrlRequest {
	Evento: string;
	IdCadastro: string;
	ExtensaoArquivo: string;
	IdLista?: number | null;
}

type GenerateImageUrlResponse = string;

export class ImageUploadService {
	constructor(private readonly apiClient: ApiClient) {}

	/**
	 * Generate a pre-signed SAS URL for image upload
	 */
	async generateSasUrl(parameters: {
		evento: FileEventType;
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

		return response;
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
		file: File,
		onProgress?: UploadProgressListener
	): Promise<{ blobUrl: string }> {
		// Extract the blob URL without the SAS token (everything before the '?')
		const blobUrl = sasUrl.split("?")[0] || sasUrl;

		// Determine content type based on file type. EPS is set by extension:
		// browsers report it inconsistently ("image/x-eps", "application/eps")
		// or not at all on Windows, and the old fallback stored it as JPEG
		const isEps = file.name.toLowerCase().endsWith(".eps");
		const contentType = isEps
			? "application/postscript"
			: file.type || "image/jpeg";

		// Upload the file directly to Azure Blob Storage, not through the
		// ApiClient. With XMLHttpRequest and not fetch: fetch doesn't tell how
		// much of the file was sent, and a heavy one takes minutes
		await new Promise<void>((resolve, reject) => {
			const request = new XMLHttpRequest();
			request.open("PUT", sasUrl);
			request.setRequestHeader("x-ms-blob-type", "BlockBlob");
			request.setRequestHeader("Content-Type", contentType);

			if (onProgress) {
				request.upload.onprogress = (event) => {
					if (event.lengthComputable) onProgress(event.loaded, event.total);
				};
			}

			request.onload = () => {
				if (request.status >= 200 && request.status < 300) {
					onProgress?.(file.size, file.size);
					resolve();
					return;
				}
				reject(
					new Error(
						`Failed to upload image to Azure: ${request.status} ${request.statusText}. ${request.responseText}`
					)
				);
			};
			request.onerror = () => {
				reject(new Error("Failed to upload image to Azure: network error"));
			};
			request.onabort = () => {
				reject(new Error("Failed to upload image to Azure: aborted"));
			};

			request.send(file);
		});

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
		evento: FileEventType;
		idCadastro: number;
		idLista?: number;
		onProgress?: UploadProgressListener;
	}): Promise<string> {
		// Get file extension from the file name
		const fileExtension =
			parameters.file.name.split(".").pop()?.toLowerCase() || "jpg";

		// Step 1: Generate SAS URL
		const sasUrl = await this.generateSasUrl({
			evento: parameters.evento,
			idCadastro: parameters.idCadastro,
			extensaoArquivo: fileExtension,
			idLista: parameters.idLista,
		});

		// Step 2: Upload to Azure
		const { blobUrl } = await this.uploadToAzureBlob(
			sasUrl,
			parameters.file,
			parameters.onProgress
		);

		// Step 3: Return the blob URL (without SAS token) for saving
		return blobUrl;
	}

	/**
	 * Uploads the account's profile photo. The link comes from an endpoint
	 * without login, as the photo is chosen while the account is being created
	 */
	async uploadUserProfilePhoto(file: File): Promise<string> {
		const extensaoArquivo = file.name.split(".").pop()?.toLowerCase() || "jpg";
		const sasUrl = await this.apiClient.post<string>(
			"/imagem/gerar-url-usuario",
			{ ExtensaoArquivo: extensaoArquivo }
		);
		const { blobUrl } = await this.uploadToAzureBlob(sasUrl, file);
		return blobUrl;
	}

	/**
	 * Delete an uploaded image
	 */
	public async deleteImage(data: ImageDeleteRequest): Promise<void> {
		return this.apiClient.delete<void>("/imagem", { data });
	}
}
