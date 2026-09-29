import type { RedeSocial, SocialNetworkName } from "@/api/types";

export interface MediaData {
	videosYouTube?: Array<string>;
	spotifyPlaylistId?: string;
	redeSocial?: Array<RedeSocial>;
	fotoPerfil?: string | null;
	exibirValorServico: boolean;
	valorServico?: string | null;
	imagensCarrossel?: Array<{ id: number | null; link: string }>;
}

export interface SocialNetworkCatalogItem {
	name: SocialNetworkName;
	icon: React.ReactNode;
	placeholder: string;
	baseUrl: string;
}
