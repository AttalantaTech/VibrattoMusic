export const isProduction = import.meta.env.MODE === "production";

export const fileSizeInMB = (size: number) => {
	// Under 1 MB, show KB: small images showed "0.0 MB"
	if (size < 1024 * 1024) {
		return `${Math.max(1, Math.round(size / 1024))} KB`;
	}

	const sizeInMB = (size / (1024 * 1024)).toFixed(1);
	return `${sizeInMB} MB`;
};
