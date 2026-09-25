import { useEffect, useState } from "react";

import { toast } from "sonner";

import { VibrattoApiError } from "@/api";

import type { FileEventType, FilePropsLocal } from "@/api/types";
import { useQueryClient } from "@tanstack/react-query";
import { profileKeys, useProfileStatus } from "@/hooks/useProfileStatus";
import { useDeleteImage, useUploadImage } from "@/hooks/useImage";
import { onboardingKeys } from "@/hooks/useOnboarding";

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
	const { user } = useProfileStatus();
	const queryClient = useQueryClient();

	const uploadImageMutation = useUploadImage();
	const deleteImageMutation = useDeleteImage();

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

	const handleLegendClipping = (file: FilePropsLocal, legend: string) => {
		setClippings((previous) =>
			previous.map((clipping) =>
				clipping.link === file.link
					? {
							...clipping,
							legenda: legend,
						}
					: clipping
			)
		);
	};

	const uploadImage = async (
		file: File,
		type: FileEventType
	): Promise<string | null> => {
		if (!activeProductId) {
			toast.error("Perfil Profissional não encontrado");
			return null;
		}

		try {
			setUploadingType(type);

			// If you have an image in Azure, it will delete it before you can upload a new image.
			if (
				(type === "ProdutoMusicalFotoPerfil" ||
					type === "ProdutoMusicalOnboardingFotoPerfil") &&
				profilePhoto
			) {
				await deleteImageMutation.mutateAsync({
					idCadastro: activeProductId,
					tipoEvento: type,
				});
			}

			const blobUrl = await uploadImageMutation.mutateAsync({
				file,
				tipoEvento: type,
				idCadastro: activeProductId,
				idLista:
					type === "ProdutoMusicalCarrossel" ||
					type === "ProdutoMusicalOnboardingCarrossel"
						? carouselImages.length
						: type === "ProdutoMusicalOnboardingClipagem" ||
							  type === "ProdutoMusicalClipagem"
							? clippings.length
							: undefined,
			});

			if (
				type === "ProdutoMusicalFotoPerfil" ||
				type === "ProdutoMusicalOnboardingFotoPerfil"
			) {
				setProfilePhoto(blobUrl);
			}

			if (
				type === "ProdutoMusicalCarrossel" ||
				type === "ProdutoMusicalOnboardingCarrossel"
			) {
				setCarouselImages((previous) => [
					...previous,
					{
						id: null,
						link: blobUrl,
					},
				]);
			}

			if (
				type === "ProdutoMusicalClipagem" ||
				type === "ProdutoMusicalOnboardingClipagem"
			) {
				setClippings((previous) => [
					...previous,
					{
						id: null,
						link: blobUrl,
					},
				]);
			}

			return blobUrl;
		} catch (error) {
			if (error instanceof VibrattoApiError) {
				const errorMessage = error.data?.erros.find((error_) => error_);

				if (error.statusCode === 500) {
					toast.error(
						"Erro interno do servidor. Por favor, verifique os dados e tente novamente."
					);
					return null;
				} else if (errorMessage) {
					toast.error(errorMessage);
					return null;
				}
				toast.error("Aconteceu um erro ao tentar processar sua solicitação.");
				return null;
			}

			return null;
		} finally {
			setUploadingType(null);
		}
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
				await deleteImageMutation.mutateAsync({
					idCadastro: activeProductId,
					tipoEvento: type,
					idLista: imageId,
				});
			}

			if (
				type === "ProdutoMusicalFotoPerfil" ||
				type === "ProdutoMusicalOnboardingFotoPerfil"
			) {
				await deleteImageMutation.mutateAsync({
					idCadastro: activeProductId,
					tipoEvento: type,
				});

				setProfilePhoto(null);
			}

			if (
				(type === "ProdutoMusicalCarrossel" ||
					type === "ProdutoMusicalOnboardingCarrossel") &&
				index !== undefined
			) {
				setCarouselImages((previous) =>
					previous.filter((_, index_) => index_ !== index)
				);
			}

			if (
				(type === "ProdutoMusicalClipagem" ||
					type === "ProdutoMusicalOnboardingClipagem") &&
				index !== undefined
			) {
				setClippings((previous) =>
					previous.filter((_, index_) => index_ !== index)
				);
			}

			if (
				type === "ProdutoMusicalFotoPerfil" ||
				type === "ProdutoMusicalCarrossel" ||
				type === "ProdutoMusicalClipagem"
			) {
				await queryClient.invalidateQueries({
					queryKey: profileKeys.musicalProducts(user?.id),
				});
			} else {
				await queryClient.invalidateQueries({
					queryKey: onboardingKeys.pending(),
				});
			}
		} catch (error) {
			console.error(error);

			toast.error("Erro ao remover imagem");
		}
	};

	useEffect(() => {
		setProfilePhoto(initialProfilePhoto);
	}, [initialProfilePhoto]);

	useEffect(() => {
		setCarouselImages(initialCarousel);
	}, [initialCarousel]);

	useEffect(() => {
		setClippings(initialClipping);
	}, [initialClipping]);

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
		handleLegendClipping,
	};
}
