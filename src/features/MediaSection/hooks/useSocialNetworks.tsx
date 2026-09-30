import { useMemo } from "react";

import {
	FaInstagram,
	FaFacebook,
	FaTwitter,
	FaTiktok,
	FaLinkedin,
	FaYoutube,
	FaSoundcloud,
	FaBandcamp,
} from "react-icons/fa";

import { useSocialNetworks } from "@/hooks/useFilters";
import type { SocialNetworkCatalogItem } from "../types";
import type { SocialNetworkName } from "@/api/types";

export interface SocialNetwork extends SocialNetworkCatalogItem {
	idRedeSocial: number;
}

export const socialNetworkCatalog: Array<SocialNetworkCatalogItem> = [
	{
		name: "Bandcamp",
		icon: <FaBandcamp color="#1DA1F2" size={24} />,
		placeholder: "seubandcamp",
		baseUrl: "https://",
	},
	{
		name: "Facebook",
		icon: <FaFacebook color="#1877F2" size={24} />,
		placeholder: "seuusuario",
		baseUrl: "https://facebook.com/",
	},
	{
		name: "Instagram",
		icon: <FaInstagram color="#E4405F" size={24} />,
		placeholder: "seuusuario",
		baseUrl: "https://instagram.com/",
	},
	{
		name: "LinkedIn",
		icon: <FaLinkedin color="#0A66C2" size={24} />,
		placeholder: "seuusuario",
		baseUrl: "https://linkedin.com/in/",
	},
	{
		name: "SoundCloud",
		icon: <FaSoundcloud color="#FF5500" size={24} />,
		placeholder: "seuusuario",
		baseUrl: "https://soundcloud.com/",
	},
	{
		name: "TikTok",
		icon: <FaTiktok color="#000000" size={24} />,
		placeholder: "seuusuario",
		baseUrl: "https://tiktok.com/@",
	},
	{
		name: "Twitter/X",
		icon: <FaTwitter color="#1DA1F2" size={24} />,
		placeholder: "seuusuario",
		baseUrl: "https://x.com/",
	},
	{
		name: "YouTube",
		icon: <FaYoutube color="#FA243C" size={24} />,
		placeholder: "seuusuario",
		baseUrl: "https://youtube.com/@",
	},
];

const extractBandcampUsername = (value: string) => {
	const input = value.trim();

	if (!input) {
		return "";
	}

	if (!input.includes(".")) {
		return input.replace(/^@/, "");
	}

	try {
		const url = new URL(input.startsWith("http") ? input : `https://${input}`);

		const hostname = url.hostname;

		const match = hostname.match(/^([a-zA-Z0-9-]+)\.bandcamp\.com$/i);

		return match?.[1] ?? "";
	} catch {
		return "";
	}
};

export function useSocialNetworksData() {
	const { data } = useSocialNetworks(true);

	const socialNetworks = useMemo<Array<SocialNetwork>>(() => {
		if (!data) return [];

		return data
			.map((apiItem) => {
				const catalogItem = socialNetworkCatalog.find(
					(item) =>
						item.name.toLowerCase().trim() === apiItem.Nome.toLowerCase().trim()
				);

				if (!catalogItem) {
					return null;
				}

				return {
					idRedeSocial: apiItem.Id,
					name: apiItem.Nome,
					icon: catalogItem.icon,
					placeholder: catalogItem?.placeholder,
					baseUrl: catalogItem?.baseUrl,
				};
			})
			.filter((item): item is SocialNetwork => item !== null);
	}, [data]);

	const buildSocialUrl = (
		username: string,
		networkName: SocialNetworkName,
		baseUrl: string
	): string => {
		switch (networkName) {
			case "Bandcamp":
				return `${baseUrl}${username}.bandcamp.com`;

			default:
				return `${baseUrl}${username}`;
		}
	};

	const extractUsernameFromUrl = (
		value: string,
		networkName: SocialNetworkName
	): string => {
		const input = value.trim();

		if (!input) {
			return "";
		}

		if (networkName === "Bandcamp") {
			return extractBandcampUsername(input);
		}

		try {
			const url = new URL(
				input.startsWith("http://") || input.startsWith("https://")
					? input
					: `https://${input}`
			);

			const segments = url.pathname.split("/").filter(Boolean);

			if (!segments.length) {
				return "";
			}

			if (networkName === "LinkedIn") {
				return segments[0] === "in" ? (segments[1] ?? "") : "";
			}

			return segments[0]?.replace(/^@/, "") || "";
		} catch {
			return "";
		}
	};

	const sanitizeSocialUsername = (
		value: string,
		networkName: SocialNetworkName
	): string => {
		if (value.startsWith("http") || value.includes("://")) {
			return extractUsernameFromUrl(value, networkName);
		}

		let sanitized = value.trim().replace(/^@/, "");

		sanitized = sanitized.replace(/\/$/, "");

		if (networkName === "Bandcamp") {
			return sanitized.replace(/\./g, "");
		}

		return sanitized;
	};

	return {
		socialNetworks,
		buildSocialUrl,
		sanitizeSocialUsername,
		extractUsernameFromUrl,
	};
}
