import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mediaSchema } from "../schemas/media.schema";
import type { MediaData } from "../types";
import type { MusicalProductApiResponse } from "@/api/types";
import { useSocialNetworksData } from "./useSocialNetworks";

export function useMediaForm(
	musicalProduct?: MusicalProductApiResponse | null
) {
	const { extractUsernameFromUrl } = useSocialNetworksData();

	const initialValues = useMemo<MediaData>(() => {
		const socialNetworkFormatted =
			musicalProduct?.redeSocial.map((item) => {
				return {
					...item,
					link: extractUsernameFromUrl(item.link, item.nomeRedeSocial),
					baseUrl: item.baseUrl ?? "",
				};
			}) || [];

		return {
			videosYouTube:
				musicalProduct?.videosYouTube.map((item) => item.link) ?? [],
			spotifyPlaylistId: musicalProduct?.spotifyPlaylistId ?? "",
			redeSocial: socialNetworkFormatted,
			fotoPerfil: musicalProduct?.fotoPerfil ?? null,
			valorServico: musicalProduct?.valorServico?.toString() ?? null,
			exibirValorServico: musicalProduct?.exibirValorServico ?? false,
			imagensCarrossel: musicalProduct?.imagens ?? [],
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [musicalProduct]);

	const form = useForm<MediaData>({
		resolver: zodResolver(mediaSchema),
		defaultValues: initialValues,
	});

	useEffect(() => {
		form.reset(initialValues);
	}, [initialValues, form]);

	return {
		form,
		initialValues,
	};
}
