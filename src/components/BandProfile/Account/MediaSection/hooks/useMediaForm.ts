import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mediaSchema } from "../schemas/media.schema";
import type { MediaData } from "../types";
import type { MusicalProductApiResponse } from "@/api/types";

export function useMediaForm(activeProduct?: MusicalProductApiResponse | null) {
	const initialValues = useMemo<MediaData>(() => {
		return {
			videosYouTube:
				activeProduct?.videosYouTube.map((item) => item.link) ?? [],
			spotifyPlaylistId: activeProduct?.spotifyPlaylistId ?? "",
			redeSocial: activeProduct?.redeSocial ?? [],
			fotoPerfil: activeProduct?.fotoPerfil ?? null,
			valorServico: activeProduct?.valorServico?.toString() ?? null,
			exibirValorServico: activeProduct?.exibirValorServico ?? false,
			imagensCarrossel: activeProduct?.imagens ?? [],
		};
	}, [activeProduct]);

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
