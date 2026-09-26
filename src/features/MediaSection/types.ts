import type { RedeSocial } from "@/api/types";

export interface MediaData {
	videosYouTube?: Array<string>;
	spotifyPlaylistId?: string;
	redeSocial?: Array<RedeSocial>;
	fotoPerfil?: string | null;
	exibirValorServico: boolean;
	valorServico?: string | null;
	imagensCarrossel?: Array<{ id: number | null; link: string }>;
}
