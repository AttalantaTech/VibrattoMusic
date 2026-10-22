import { useQuery } from "@tanstack/react-query";
import {
	createUrlByteReader,
	epsPreviewToDataUrl,
	extractEpsPreview,
} from "@/utils/epsPreview";

/**
 * Image (data URL) of the preview embedded in an EPS stored in Azure, or
 * null when the file has none. Each file is read once and cached: the same
 * EPS shows in the media list, the profile carousel and the viewer modal
 */
export const useEpsPreview = (link: string) => {
	return useQuery({
		queryKey: ["eps-preview", link],
		queryFn: async () => {
			const preview = await extractEpsPreview(createUrlByteReader(link));
			return preview ? epsPreviewToDataUrl(preview) || null : null;
		},
		enabled: Boolean(link),
		// A stored file never changes; failures (network, CORS) keep the card
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: 30 * 60 * 1000,
		retry: false,
	});
};
