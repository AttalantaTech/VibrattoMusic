import { toast } from "sonner";

import { useUpdateMusicalProduct } from "@/hooks/useMusicalProducts";

import type {
	FilePropsLocal,
	MusicalProductImages,
	MusicalProductMedia,
	RedeSocial,
} from "@/api/types";

import { extractSpotifyResource } from "@/lib/utils/cn";
import { VibrattoApiError } from "@/api";
import { useOnboarding } from "@/contexts/hooks/useOnboarding";
import { useNavigate } from "@tanstack/react-router";
import {
	useSaveOnboardingImages,
	useSaveOnboardingMedia,
} from "@/hooks/useOnboarding";
import { encryptValue } from "@/utils/encryptValue";

interface SubmitData {
	youtubeUrl: string;
	spotifyUrl: string;
	showPriceTab: boolean;
	redeSocial?: Array<RedeSocial>;
	valorServico?: string | null;
	profilePhoto?: string | null;
	carouselImages?: Array<FilePropsLocal>;
	clippings?: Array<FilePropsLocal>;
}

interface Props {
	musicalProductId?: number;
	mode: "onboarding" | "edit";
}

export function useMediaSubmit({ musicalProductId, mode }: Props) {
	const navigate = useNavigate();

	const { updateData, markStepComplete } = useOnboarding();

	const updateMusicalProductMutation = useUpdateMusicalProduct();
	const saveOnboardingMediaMutation = useSaveOnboardingMedia();
	const saveOnboardingImagesMutation = useSaveOnboardingImages();

	const addProfilePhoto = async (profilePhoto?: string | null) => {
		if (mode === "edit") {
			await updateMusicalProductMutation.mutateAsync({
				id: musicalProductId,
				FotoPerfil: profilePhoto || null,
			});
		}
	};

	const addCarouselImage = async (carouselImages?: Array<FilePropsLocal>) => {
		if (mode === "edit") {
			await updateMusicalProductMutation.mutateAsync({
				id: musicalProductId,
				ImagensCarrossel:
					carouselImages?.map((item) => {
						return {
							link: item.link,
							legenda: item.legenda,
						};
					}) ?? [],
			});
		}
	};

	const addClippingFile = async (clippings?: Array<FilePropsLocal>) => {
		if (mode === "edit") {
			await updateMusicalProductMutation.mutateAsync({
				id: musicalProductId,
				clipagem:
					clippings?.map((item) => {
						return {
							link: item.link,
							legenda: item.legenda,
						};
					}) ?? [],
			});
		}
	};

	const addMediaOnboarding = async (mediaPayload: MusicalProductMedia) => {
		try {
			if (!musicalProductId) return;

			const mediaData = {
				...mediaPayload,
				clipagem:
					mediaPayload.clipagem?.map((item) => {
						return {
							link: item.link,
							legenda: item.legenda,
						};
					}) ?? [],
			};

			if (mode === "onboarding") {
				await saveOnboardingMediaMutation.mutateAsync({
					productId: musicalProductId,
					mediaData,
				});
			}
		} catch (error) {
			if (error instanceof VibrattoApiError) {
				const errorMessage = error.data?.erros.find((error_) => error_);

				if (error.statusCode === 500) {
					toast.error(
						"Erro interno do servidor. Por favor, verifique os dados e tente novamente."
					);
				} else if (errorMessage) {
					toast.error(errorMessage);
				} else {
					toast.error("Aconteceu um erro ao tentar processar sua solicitação.");
				}

				throw error;
			}
		}
	};

	const addImageOnboarding = async (imagesPayload: MusicalProductImages) => {
		try {
			if (!musicalProductId) return;

			if (mode === "onboarding") {
				const imagesData: MusicalProductImages = {
					...imagesPayload,
					ImagensCarrossel:
						imagesPayload.ImagensCarrossel?.map((item) => {
							return {
								link: item.link,
								legenda: item.legenda,
							};
						}) ?? [],
				};

				await saveOnboardingImagesMutation.mutateAsync({
					productId: musicalProductId,
					imagesData,
				});
			}
		} catch (error) {
			if (error instanceof VibrattoApiError) {
				const errorMessage = error.data?.erros.find((error_) => error_);

				if (error.statusCode === 500) {
					toast.error(
						"Erro interno do servidor. Por favor, verifique os dados e tente novamente."
					);
				} else if (errorMessage) {
					toast.error(errorMessage);
				} else {
					toast.error("Aconteceu um erro ao tentar processar sua solicitação.");
				}

				throw error;
			}
		}
	};

	const submit = async ({
		youtubeUrl,
		spotifyUrl,
		showPriceTab,
		redeSocial,
		valorServico,
		clippings,
		profilePhoto,
		carouselImages,
	}: SubmitData) => {
		if (!musicalProductId) {
			toast.error("ID do produto musical não encontrado");

			return;
		}

		const spotifyResource = extractSpotifyResource(spotifyUrl);

		const spotifyPlaylistId = spotifyResource
			? `spotify:${spotifyResource.type}:${spotifyResource.id}`
			: "";

		const mediaData: MusicalProductMedia = {
			videosYouTube: youtubeUrl.trim() !== "" ? [youtubeUrl] : [],
			spotifyPlaylistId,
			exibirValorServico: showPriceTab,
			valorServico: showPriceTab
				? valorServico
					? Number(valorServico)
					: null
				: null,
			redeSocial: redeSocial ?? [],
			clipagem:
				clippings?.map((item) => {
					return {
						link: item.link,
						legenda: item.legenda,
					};
				}) ?? [],
		};

		if (mode === "edit") {
			await updateMusicalProductMutation.mutateAsync({
				id: musicalProductId,
				...mediaData,

				FotoPerfil: profilePhoto,
				ImagensCarrossel:
					carouselImages?.map((item) => {
						return {
							link: item.link,
							legenda: item.legenda,
						};
					}) ?? [],
			});

			toast.success("Informações atualizadas com sucesso");
		} else {
			const imagesData = {
				FotoPerfil: profilePhoto ?? null,
				ImagensCarrossel:
					carouselImages?.map((item) => {
						return {
							link: item.link,
							legenda: item.legenda,
						};
					}) ?? [],
			};

			await addMediaOnboarding(mediaData);
			await addImageOnboarding(imagesData);

			updateData("media", mediaData);
			markStepComplete("3");

			toast.success("Informações de Mídia e Visibilidade salvas com sucesso");

			const search = musicalProductId
				? {
						registerId: encryptValue(musicalProductId.toString()),
					}
				: {};

			await navigate({
				to: "/band/register/onboarding/4",
				search,
			});
		}
	};

	return {
		submit,
		addProfilePhoto,
		addCarouselImage,
		addClippingFile,
		addMediaOnboarding,
		addImageOnboarding,
		loading: updateMusicalProductMutation.isPending,
	};
}
