import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { validateImageFile } from "@/utils/validation";

/**
 * A profile photo picked on a form but only sent when the form is saved.
 * `savedUrl` is the photo already stored (none on the registration)
 */
export const useProfilePhotoDraft = (savedUrl?: string | null) => {
	const [file, setFile] = useState<File | null>(null);
	const [removed, setRemoved] = useState(false);

	const preview = useMemo(
		() => (file ? URL.createObjectURL(file) : null),
		[file]
	);
	useEffect(
		() => () => {
			if (preview) URL.revokeObjectURL(preview);
		},
		[preview]
	);

	const select = (picked: File | null) => {
		if (!picked) return;
		const { valid, error } = validateImageFile(picked);
		if (!valid) {
			toast.error(error);
			return;
		}
		setFile(picked);
		setRemoved(false);
	};

	const remove = () => {
		setFile(null);
		setRemoved(true);
	};

	/** Back to the stored photo, after saving or discarding */
	const clear = () => {
		setFile(null);
		setRemoved(false);
	};

	const stored = savedUrl || null;

	return {
		file,
		/** What the form shows: the new pick, else the stored photo */
		currentImage: preview ?? (removed ? null : stored),
		/** The stored photo will be replaced or removed on save */
		isChanged: !!file || (removed && !!stored),
		stored,
		select,
		remove,
		clear,
	};
};
