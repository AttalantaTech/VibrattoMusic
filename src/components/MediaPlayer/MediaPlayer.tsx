import { cn } from "@/lib/utils/cn";
import ReactPlayer from "react-player";

type MediaPlayerProps = {
	src: string;
	className?: string;
};

export function MediaPlayer({ src, className }: MediaPlayerProps) {
	return (
		<div className={cn(className, "w-full h-full")}>
			<ReactPlayer src={src} width="100%" height="100%" controls />
		</div>
	);
}
