import { useMutation } from "@tanstack/react-query";

import { imageUploadService } from "@/api";
import type { FileEventType } from "@/api/types";

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
		}: {
			file: File;
			tipoEvento: FileEventType;
			idCadastro: number;
			idLista?: number;
		}) =>
			imageUploadService.uploadImage({
				file,
				evento: tipoEvento,
				idCadastro,
				idLista,
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
