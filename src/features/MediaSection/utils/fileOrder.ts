/**
 * The list with one file moved to the place of another, the ones between
 * shifting over. Files are told apart by their link. The same list comes
 * back when there is nothing to move
 */
export const moveFile = <T extends { link: string }>(
	files: Array<T>,
	movedLink: string,
	targetLink: string
): Array<T> => {
	const from = files.findIndex((file) => file.link === movedLink);
	const to = files.findIndex((file) => file.link === targetLink);
	if (from < 0 || to < 0 || from === to) return files;

	const ordered = [...files];
	const [moved] = ordered.splice(from, 1);
	if (!moved) return files;
	ordered.splice(to, 0, moved);

	return ordered;
};
