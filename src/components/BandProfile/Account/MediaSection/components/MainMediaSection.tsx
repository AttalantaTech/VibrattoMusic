import { IconInput } from "@/components/forms/IconInput/IconInput";
import { MediaPlayer } from "@/components/MediaPlayer/MediaPlayer";
import { FaYoutube, FaSpotify } from "react-icons/fa";
import { SectionHeader } from "./shared/SectionHeader";

type Props = {
	youtubeUrl: string;
	spotifyUrl: string;
	onYoutubeChange: (v: string) => void;
	onSpotifyChange: (v: string) => void;
	spotifyEmbed?: string | null;
};

export function MainMediaSection({
	youtubeUrl,
	onYoutubeChange,
	spotifyUrl,
	onSpotifyChange,
	spotifyEmbed,
}: Props) {
	return (
		<div className="bg-gray-50 py-6 border-b">
			<SectionHeader title="Mídias Principais" />

			<IconInput
				className="w-full mb-1"
				icon={<FaYoutube color="#FF0000" size={24} />}
				name="youtubelink"
				placeholder="https://www.youtube.com/watch?v=..."
				value={youtubeUrl}
				onChange={onYoutubeChange}
			/>

			{youtubeUrl ? (
				<div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg mb-4">
					<MediaPlayer src={youtubeUrl} />
				</div>
			) : (
				<div className="p-6 bg-gray-50 text-gray-500 rounded-lg flex flex-col items-center gap-3 text-center">
					<FaYoutube size={40} className="text-gray-400" />
					<p className="text-sm">
						Cole uma URL do YouTube acima para visualizar
					</p>
				</div>
			)}

			<IconInput
				className="w-full mb-1"
				icon={<FaSpotify color="#1DB954" size={24} />}
				name="spotifylink"
				placeholder="https://open.spotify.com/..."
				value={spotifyUrl}
				onChange={onSpotifyChange}
			/>

			{spotifyEmbed ? (
				<div className="mb-4">
					<iframe
						src={spotifyEmbed}
						width="100%"
						height="352"
						frameBorder="0"
						allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
						loading="lazy"
					/>
				</div>
			) : (
				<div className="p-6 bg-gray-50 text-gray-500 rounded-lg flex flex-col items-center gap-3 text-center">
					<FaSpotify size={40} className="text-gray-400" />
					<p className="text-sm">Cole uma URL do Spotify acima</p>
				</div>
			)}
		</div>
	);
}
