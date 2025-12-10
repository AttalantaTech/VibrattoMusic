import ReactPlayer from "react-player";

type MediaPlayerProps = {
	src: string;
};

export function MediaPlayer({ src }: MediaPlayerProps) {
	return (
		<div className="w-full h-full">
			<ReactPlayer src={src} width="100%" height="100%" controls />
		</div>
	);
}
