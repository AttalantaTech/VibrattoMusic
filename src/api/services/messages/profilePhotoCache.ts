type Photo = string | null;

/**
 * Remembers each profile's photo for a while. The conversation list is
 * refreshed every few seconds and asked the API for the photo of every
 * conversation each time: with a dozen conversations the chat alone used up
 * the app's request limit, and the screens went blank until it was reset
 */
export const createPhotoCache = (
	fetchPhoto: (id: number) => Promise<Photo>,
	timeToLive: number,
	now: () => number = Date.now
) => {
	const entries = new Map<number, { photo: Promise<Photo>; expires: number }>();

	return (id: number): Promise<Photo> => {
		const entry = entries.get(id);
		if (entry && now() < entry.expires) return entry.photo;

		// A photo that failed to load isn't kept (the next refresh tries again)
		// and doesn't take the conversation list down with it
		const photo = fetchPhoto(id).catch(() => {
			entries.delete(id);
			return null;
		});
		entries.set(id, { photo, expires: now() + timeToLive });
		return photo;
	};
};
