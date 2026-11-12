import { useMutation } from "@tanstack/react-query";

import { imageUploadService } from "@/api";
import type { FileEventType } from "@/api/types";
import type { UploadProgressListener } from "@/api/services/imageUploadService";

/**
 * Hook to upload image
 */
export const useUploadImage = () => {
	return useMutation({
		mutationFn: ({
			file,
			tipoEvento,
			idCadastro,
			idLista,
			onProgress,
		}: {
			file: File;
			tipoEvento: FileEventType;
			idCadastro: number;
			idLista?: number;
			onProgress?: UploadProgressListener;
		}) =>
			imageUploadService.uploadImage({
				file,
				evento: tipoEvento,
				idCadastro,
				idLista,
				onProgress,
			}),
	});
};

/**
 * Hook to upload image
 */
export const useDeleteImage = () => {
	return useMutation({
		mutationFn: ({
			tipoEvento,
			idCadastro,
			idLista,
		}: {
			tipoEvento: FileEventType;
			idCadastro: number;
			idLista?: number;
		}) =>
			imageUploadService.deleteImage({
				idCadastro,
				evento: tipoEvento,
				idLista,
			}),
	});
};
