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

	const patterns = [
		/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/)|youtu\.be\/)([^"&?/\\s]{11})/i,
		/^([^"&?/\\s]{11})$/i, // Apenas o ID
		/[?&]v=([^"&?/\\s]{11})/i, // URL com parâmetro v=
		/[?&]vi?=([^"&?/\\s]{11})/i, // URL com parâmetro vi=
		/embed\/([^"&?/\\s]{11})/i, // URL de embed
		/\/v\/([^"&?/\\s]{11})/i, // URL com /v/
	];

	for (const pattern of patterns) {
		// const match = url.match(pattern);
		// if (match && match[1]) {
		// 	return match[1];
		// }
	}

	return null;
};
