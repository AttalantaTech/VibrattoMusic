import type { FileEventType } from "@/api/types";

/** A file on its way to the storage, shown in the grid until it arrives */
export interface FileUpload {
	id: number;
	name: string;
	type: FileEventType;
	/** Bytes sent so far and the size of the file */
	loaded: number;
	total: number;
}

/** How much of the file was sent, as a whole number from 0 to 100 */
export const uploadPercent = ({
	loaded,
	total,
}: Pick<FileUpload, "loaded" | "total">): number => {
	if (total <= 0) return 0;

	return Math.min(100, Math.max(0, Math.floor((loaded / total) * 100)));
};

const CAROUSEL: Array<FileEventType> = [
	"ProdutoMusicalCarrossel",
	"ProdutoMusicalOnboardingCarrossel",
];
const CLIPPING: Array<FileEventType> = [
	"ProdutoMusicalClipagem",
	"ProdutoMusicalOnboardingClipagem",
];

/** The uploads of one section, in the profile editor or in the onboarding */
export const uploadsOf = (
	uploads: Array<FileUpload>,
	section: "carousel" | "clipping"
): Array<FileUpload> => {
	const types = section === "carousel" ? CAROUSEL : CLIPPING;

	return uploads.filter((upload) => types.includes(upload.type));
};
