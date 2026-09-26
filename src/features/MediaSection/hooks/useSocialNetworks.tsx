import { useMemo } from "react";

import {
	FaInstagram,
	FaFacebook,
	FaTwitter,
	FaTiktok,
	FaLinkedin,
	FaSpotify,
	FaYoutube,
	FaSoundcloud,
	FaBandcamp,
} from "react-icons/fa";

import { SiApplemusic } from "react-icons/si";
import { Music } from "lucide-react";

import { useSocialNetworks } from "@/hooks/useFilters";

const socialNetworkCatalog = [
	{
		name: "Instagram",
		placeholder: "https://instagram.com/seuperfil",
		icon: <FaInstagram color="#E4405F" size={24} />,
	},
	{
		name: "Facebook",
		placeholder: "https://facebook.com/suapagina",
		icon: <FaFacebook color="#1877F2" size={24} />,
	},
	{
		name: "Twitter/X",
		placeholder: "https://twitter.com/seuperfil",
		icon: <FaTwitter color="#1DA1F2" size={24} />,
	},
	{
		name: "TikTok",
		placeholder: "https://tiktok.com/@seuperfil",
		icon: <FaTiktok color="#000000" size={24} />,
	},
	{
		name: "LinkedIn",
		placeholder: "https://linkedin.com/in/seuperfil",
		icon: <FaLinkedin color="#0A66C2" size={24} />,
	},
	{
		name: "Spotify",
		placeholder: "https://open.spotify.com/artist/...",
		icon: <FaSpotify color="#1DB954" size={24} />,
	},
	{
		name: "Apple Music",
		placeholder: "https://music.apple.com/artist/...",
		icon: <SiApplemusic color="#FA243C" size={24} />,
	},
	{
		name: "Deezer",
		placeholder: "https://deezer.com/artist/...",
		icon: <Music color="#FF6D42" size={24} />,
	},
	{
		name: "YouTube",
		placeholder: "https://youtube.com/artist/...",
		icon: <FaYoutube color="#FA243C" size={24} />,
	},
	{
		name: "SoundCloud",
		placeholder: "https://soundcloud.com/artist/...",
		icon: <FaSoundcloud color="#FF5500" size={24} />,
	},
	{
		name: "Bandcamp",
		placeholder: "https://bandcamp.com/artist/...",
		icon: <FaBandcamp color="#1DA1F2" size={24} />,
	},
];

export function useSocialNetworksData() {
	const { data } = useSocialNetworks(true);

	const socialNetworks = useMemo(() => {
		if (!data) return [];

		return data.map((apiItem) => {
			const catalogItem = socialNetworkCatalog.find(
				(item) =>
					item.name.toLowerCase().trim() === apiItem.Nome.toLowerCase().trim()
			);

			return {
				idRedeSocial: apiItem.Id,
				name: apiItem.Nome,
				icon: catalogItem?.icon ?? null,
				placeholder: catalogItem?.placeholder ?? "",
			};
		});
	}, [data]);

	return {
		socialNetworks,
	};
}
