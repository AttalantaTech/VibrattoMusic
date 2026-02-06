import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Array<any>): string {
	return twMerge(clsx(inputs));
}

export const generateVideoThumbnail = (file: File): Promise<string> => {
	return new Promise((resolve) => {
		const video = document.createElement("video");
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");

		video.src = URL.createObjectURL(file);
		video.addEventListener("loadedmetadata", () => {
			const ratio = video.videoWidth / video.videoHeight;
			const width = 100;
			const height = width / ratio;

			canvas.width = width;
			canvas.height = height;

			// first second
			video.currentTime = Math.min(1, video.duration * 0.1);
		});

		video.addEventListener("seeked", () => {
			if (context) {
				context.drawImage(video, 0, 0, canvas.width, canvas.height);
				resolve(canvas.toDataURL("image/jpeg"));
			}
			URL.revokeObjectURL(video.src);
		});
	});
};

export const extractYouTubeId = (url: string): string | null => {
	if (!url) return null;

	// Se já for apenas o ID
	if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
		return url;
	}

	try {
		const parsedUrl = new URL(url);

		// youtube.com/watch?v=ID
		const v = parsedUrl.searchParams.get("v");
		if (v) return v;

		// youtu.be/ID
		if (parsedUrl.hostname === "youtu.be") {
			const id = parsedUrl.pathname.slice(1);

			return id || null;
		}

		// youtube.com/embed/ID
		if (parsedUrl.pathname.startsWith("/embed/")) {
			const id = parsedUrl.pathname.split("/embed/")[1];

			return id || null;
		}

		return null;
	} catch {
		return null;
	}
};
