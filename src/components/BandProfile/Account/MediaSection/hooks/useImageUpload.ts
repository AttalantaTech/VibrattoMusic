import { useState } from "react";

import { toast } from "sonner";

import { imageUploadService } from "@/api";

import type { FileEventType, FilePropsLocal } from "@/api/types";

interface Props {
	activeProductId?: number;
	initialProfilePhoto?: string | null;
	initialCarousel?: Array<FilePropsLocal>;
	initialClipping?: Array<FilePropsLocal>;
}

export function useImageUpload({
	activeProductId,
	initialProfilePhoto = null,
	initialCarousel = [],
	initialClipping = [],
}: Props) {
	const [uploadingType, setUploadingType] = useState<FileEventType | null>(
		null
	);

	const [profilePhoto, setProfilePhoto] = useState<string | null>(
		initialProfilePhoto
	);

	const [carouselImages, setCarouselImages] =
		useState<Array<FilePropsLocal>>(initialCarousel);

	const [clippings, setClippings] =
		useState<Array<FilePropsLocal>>(initialClipping);

	const handleLegendImage = (file: FilePropsLocal, legend: string) => {
		setCarouselImages((previous) =>
			previous.map((carousel) =>
				carousel.link === file.link
					? {
							...carousel,
							legenda: legend,
						}
					: carousel
			)
		);
	};

	const uploadImage = async (file: File, type: FileEventType) => {
		if (!activeProductId) {
			toast.error("Perfil Profissional não encontrado");
			return;
		}

		try {
			setUploadingType(type);

			// If you have an image in Azure, it will delete it before you can upload a new image.
			if (type === "ProdutoMusicalFotoPerfil" && profilePhoto) {
				await imageUploadService.deleteImage({
					idCadastro: activeProductId,
					evento: type,
				});
			}

			const blobUrl = await imageUploadService.uploadImage({
				file,
				evento: type,
				idCadastro: activeProductId,
				idLista:
					type === "ProdutoMusicalCarrossel" ||
					type === "ProdutoMusicalClipagem"
						? carouselImages.length
						: undefined,
			});

			if (type === "ProdutoMusicalFotoPerfil") {
				setProfilePhoto(blobUrl);
			}

			if (type === "ProdutoMusicalCarrossel") {
				setCarouselImages((previous) => [
					...previous,
					{
						id: null,
						link: blobUrl,
					},
				]);
			}

			if (type === "ProdutoMusicalClipagem") {
				setClippings((previous) => [
					...previous,
					{
						id: null,
						link: blobUrl,
					},
				]);
			}
		} catch (error) {
			console.error(error);

			toast.error("Erro ao fazer upload");

			return;
		} finally {
			setUploadingType(null);
		}

		// try {
		// 	setUploadingType(type);

		// 	const blobUrl = await imageUploadService.uploadImage({
		// 		file,
		// 		evento: type,
		// 		idCadastro: activeProductId,
		// 		idLista:
		// 			type === "ProdutoMusicalCarrossel" ||
		// 			type === "ProdutoMusicalClipagem"
		// 				? carouselImages.length
		// 				: undefined,
		// 	});

		// 	if (type === "ProdutoMusicalFotoPerfil") {
		// 		setProfilePhoto(blobUrl);
		// 	}

		// 	if (type === "ProdutoMusicalCarrossel") {
		// 		setCarouselImages((previous) => [
		// 			...previous,
		// 			{
		// 				id: null,
		// 				link: blobUrl,
		// 			},
		// 		]);
		// 	}

		// 	if (type === "ProdutoMusicalClipagem") {
		// 		setClippings((previous) => [
		// 			...previous,
		// 			{
		// 				id: null,
		// 				link: blobUrl,
		// 			},
		// 		]);
		// 	}
		// } catch (error) {
		// 	console.error(error);

		// 	toast.error("Erro ao fazer upload");

		// 	return;
		// } finally {
		// 	setUploadingType(null);
		// }
	};

	const removeImage = async (
		type: FileEventType,
		imageId?: number | null,
		index?: number
	) => {
		if (!activeProductId) {
			toast.error("Produto não encontrado");
			return;
		}

		try {
			if (imageId) {
				await imageUploadService.deleteImage({
					idCadastro: activeProductId,
					evento: type,
					idLista: imageId,
				});
			}

			if (type === "ProdutoMusicalFotoPerfil") {
				await imageUploadService.deleteImage({
					idCadastro: activeProductId,
					evento: type,
				});

				setProfilePhoto(null);
			}

			if (type === "ProdutoMusicalCarrossel" && index !== undefined) {
				setCarouselImages((previous) =>
					previous.filter((_, index_) => index_ !== index)
				);
			}

			if (type === "ProdutoMusicalClipagem" && index !== undefined) {
				setClippings((previous) =>
					previous.filter((_, index_) => index_ !== index)
				);
			}
		} catch (error) {
			console.error(error);

			toast.error("Erro ao remover imagem");
		}
	};

	return {
		uploadImage,
		removeImage,
		profilePhoto,
		setProfilePhoto,
		carouselImages,
		setCarouselImages,
		clippings,
		setClippings,
		uploadingType,
		handleLegendImage,
	};
}
