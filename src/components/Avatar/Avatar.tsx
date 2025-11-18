interface AvatarProps {
	src?: string;
	alt?: string;
	size?: number; // em pixels, opcional
}

export const Avatar = ({ src, alt = "", size = 40 }: AvatarProps) => {
	const sizeClass = `${size}px`;

	return (
		<div
			className="rounded-full overflow-hidden bg-gray-200 flex items-center justify-center"
			style={{ width: sizeClass, height: sizeClass }}
		>
			{src ? (
				<img alt={alt} className="w-full h-full object-cover" src={src} />
			) : (
				<span className="text-sm text-white">{alt?.charAt(0)}</span>
			)}
		</div>
	);
};
