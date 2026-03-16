import type React from "react";
import { useState, useRef, useEffect } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "../../../lib/utils/cn";

export interface LazyImageProps extends Omit<
	React.ImgHTMLAttributes<HTMLImageElement>,
	"src"
> {
	src?: string | null;
	alt: string;
	aspectRatio?: "square" | "video" | "portrait" | "landscape" | "auto";
	showSkeleton?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
	src,
	alt,
	className,
	aspectRatio = "auto",
	showSkeleton = true,
	...props
}) => {
	const [loaded, setLoaded] = useState(false);
	const [inView, setInView] = useState(false);
	const [error, setError] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);

	// Check if src is valid (not null, undefined, or empty)
	const hasValidSource =
		src != null && typeof src === "string" && src.trim() !== "";
	const shouldShowImage = hasValidSource && !error;

	// Show fallback when no valid image source - more robust detection
	const showFallback = !hasValidSource;

	useEffect(() => {
		// Only set up intersection observer if we have a valid image source
		if (!hasValidSource) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry?.isIntersecting) {
					setInView(true);
					observer.disconnect();
				}
			},
			{
				threshold: 0.1,
				rootMargin: "50px",
			}
		);

		if (imgRef.current) {
			observer.observe(imgRef.current);
		}

		return () => {
			observer.disconnect();
		};
	}, [hasValidSource]);

	const aspectRatioClasses = {
		square: "aspect-square",
		video: "aspect-video",
		portrait: "aspect-[3/4]",
		landscape: "aspect-[4/3]",
		auto: "",
	};

	const containerClasses = cn(
		"relative overflow-hidden flex h-full",
		aspectRatio !== "auto" && aspectRatioClasses[aspectRatio],
		className
	);

	// Fallback component - Apple-inspired design
	const FallbackImage = () => (
		<div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-sm absolute inset-0">
			<div className="flex flex-col items-center space-y-3 p-6">
				<div className="relative">
					<ImageIcon className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
					<div className="absolute -inset-1 bg-gray-100 rounded-full opacity-20"></div>
				</div>
				<span className="text-xs text-gray-500 font-medium tracking-wide uppercase text-center">
					Sem foto
				</span>
			</div>
		</div>
	);

	// Simple debug version
	if (showFallback) {
		return (
			<div className={cn(containerClasses, "items-center justify-center")}>
				<FallbackImage />
			</div>
		);
	}

	return (
		<div className={containerClasses}>
			{/* Show skeleton only when loading a valid image */}
			{showSkeleton && shouldShowImage && (!inView || !loaded) && (
				<div
					className={cn(
						"absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]",
						"before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent before:animate-shimmer"
					)}
				/>
			)}

			{/* Render image only if we have a valid source */}
			{shouldShowImage && (
				<img
					ref={imgRef}
					src={inView ? src : undefined}
					alt={alt}
					className={cn(
						"w-full h-full object-cover transition-opacity duration-300",
						loaded ? "opacity-100" : "opacity-0",
						className
					)}
					onLoad={() => {
						setLoaded(true);
					}}
					onError={() => {
						setError(true);
					}}
					loading="lazy"
					{...props}
				/>
			)}
		</div>
	);
};
