export const isProduction = import.meta.env.MODE === "production";

export const fileSizeInMB = (size: number) => {
	const sizeInMB = (size / (1024 * 1024)).toFixed(1);
	return `${sizeInMB} MB`;
};
