import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mediaSchema } from "../schemas/media.schema";
import type { MediaData } from "../types";
import type { MusicalProductApiResponse } from "@/api/types";

export function useMediaForm(
	musicalProduct?: MusicalProductApiResponse | null
) {
	const initialValues = useMemo<MediaData>(() => {
		return {
			videosYouTube:
				musicalProduct?.videosYouTube.map((item) => item.link) ?? [],
			spotifyPlaylistId: musicalProduct?.spotifyPlaylistId ?? "",
			redeSocial: musicalProduct?.redeSocial ?? [],
			fotoPerfil: musicalProduct?.fotoPerfil ?? null,
			valorServico: musicalProduct?.valorServico?.toString() ?? null,
			exibirValorServico: musicalProduct?.exibirValorServico ?? false,
			imagensCarrossel: musicalProduct?.imagens ?? [],
		};
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
