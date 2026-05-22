import { toast } from "sonner";

import { useUpdateMusicalProduct } from "@/hooks/useMusicalProducts";

import type {
	FilePropsLocal,
	MusicalProductMedia,
	RedeSocial,
} from "@/api/types";

import { extractSpotifyResource } from "@/lib/utils/cn";

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

export function useMediaSubmit(activeProductId?: number) {
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
		if (!activeProductId) {
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

			await updateMusicalProductMutation.mutateAsync({
				id: activeProductId,
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

			toast.success("Informações salvas com sucesso");
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
