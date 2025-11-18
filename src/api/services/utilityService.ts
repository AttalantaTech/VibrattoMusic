import type { ApiClient } from "../core/client";

export class UtilityService {
	public constructor(private readonly apiClient: ApiClient) {}

	// File upload utilities (only methods that are actually used)
	/**
	 * Upload file
	 */
	public async uploadFile(
		file: File,
		type: "image" | "video" | "audio" | "document"
	): Promise<{
		url: string;
		filename: string;
		size: number;
		type: string;
		thumbnailUrl?: string;
	}> {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("type", type);

		return this.apiClient.post<{
			url: string;
			filename: string;
			size: number;
			type: string;
			thumbnailUrl?: string;
		}>("files/upload", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
	}

	/**
	 * Upload multiple files
	 */
	public async uploadMultipleFiles(
		files: Array<File>,
		type: "image" | "video" | "audio" | "document"
	): Promise<
		Array<{
			url: string;
			filename: string;
			size: number;
			type: string;
			thumbnailUrl?: string;
		}>
	> {
		const formData = new FormData();
		files.forEach((file, index) => {
			formData.append(`file_${index}`, file);
		});
		formData.append("type", type);

		return this.apiClient.post<
			Array<{
				url: string;
				filename: string;
				size: number;
				type: string;
				thumbnailUrl?: string;
			}>
		>("files/upload/multiple", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
	}

	/**
	 * Delete file
	 */
	public async deleteFile(url: string): Promise<void> {
		return this.apiClient.delete<void>("files/delete", { data: { url } });
	}
}
