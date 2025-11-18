import { useMutation } from "@tanstack/react-query";
import { utilityService } from "../api";

/**
 * Hook to upload a single file
 */
export const useFileUpload = () => {
	return useMutation({
		mutationFn: ({
			file,
			type,
		}: {
			file: File;
			type: "image" | "video" | "audio" | "document";
		}) => utilityService.uploadFile(file, type),
	});
};

/**
 * Hook to upload multiple files
 */
export const useMultipleFileUpload = () => {
	return useMutation({
		mutationFn: ({
			files,
			type,
		}: {
			files: Array<File>;
			type: "image" | "video" | "audio" | "document";
		}) => utilityService.uploadMultipleFiles(files, type),
	});
};

/**
 * Hook to delete a file
 */
export const useFileDelete = () => {
	return useMutation({
		mutationFn: (url: string) => utilityService.deleteFile(url),
	});
};
