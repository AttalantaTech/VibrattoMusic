/**
 * Page numbers to show around the current one (at most `size`), always
 * within 1..totalPages. With 3 pages it used to start at -1 ("-1 0 1 2 3")
 * because the lower bound was taken with Math.min instead of Math.max.
 */
export const visiblePages = (
	currentPage: number,
	totalPages: number,
	size = 5
): Array<number> => {
	if (totalPages < 1) return [];

	const half = Math.floor(size / 2);
	const end = Math.min(totalPages, Math.max(currentPage + half, size));
	const start = Math.max(1, end - size + 1);

	return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};
