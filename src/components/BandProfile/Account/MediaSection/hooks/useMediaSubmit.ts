import { toast } from "sonner";

import { useUpdateMusicalProduct } from "@/hooks/useMusicalProducts";

import type {
	FilePropsLocal,
	MusicalProductMedia,
	RedeSocial,
} from "@/api/types";

import { extractSpotifyResource } from "@/lib/utils/cn";
import { onboardingService } from "@/api";
import { useOnboarding } from "@/contexts/hooks/useOnboarding";
import { useNavigate } from "@tanstack/react-router";

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

	const submit = async ({
		youtubeUrl,
		spotifyUrl,
		showPriceTab,
		redeSocial,
		valorServico,
		profilePhoto,
		carouselImages,
		clippings,
	}: SubmitData) => {
		if (!musicalProductId) {
			toast.error("ID do produto musical não encontrado");

			return;
		}

		try {
			const spotifyResource = extractSpotifyResource(spotifyUrl);

			const spotifyPlaylistId = spotifyResource
				? `spotify:${spotifyResource.type}:${spotifyResource.id}`
				: "";

			const mediaPayload: MusicalProductMedia = {
				videosYouTube: youtubeUrl.trim() !== "" ? [youtubeUrl] : [],
				spotifyPlaylistId,
				exibirValorServico: showPriceTab,
				valorServico: showPriceTab
					? valorServico
						? Number(valorServico)
						: null
					: null,
				redeSocial: redeSocial ?? [],
				clipagem: clippings?.map((item) => item.link) ?? [],
			};

			if (mode === "edit") {
				await updateMusicalProductMutation.mutateAsync({
					id: musicalProductId,
					...mediaPayload,
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
				const imagePayload = {
					FotoPerfil: profilePhoto ?? null,
					ImagensCarrossel:
						carouselImages?.map((item) => {
							return {
								link: item.link,
								legenda: item.legenda,
							};
						}) ?? [],
				};

				await Promise.all([
					onboardingService.saveOnboardingMedia(musicalProductId, {
						...mediaPayload,
					}),

					onboardingService.saveOnboardingImages(musicalProductId, {
						...imagePayload,
					}),
				]);

				updateData("media", mediaPayload);
				markStepComplete("3");

				toast.success("Informações de Mídia e Visibilidade salvas com sucesso");

				await navigate({ to: "/band/register/onboarding/4" });
			}
		} catch (error: unknown) {
			console.error(error);

			const errorMessage =
				error instanceof Error
					? error.message
					: ((error as any)?.response?.data?.mensagem ??
						"Erro ao salvar mídias");

			toast.error(String(errorMessage));
		}
	};

	return {
		submit,
		loading: updateMusicalProductMutation.isPending,
	};
}
