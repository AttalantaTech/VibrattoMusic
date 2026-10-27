import { BadgeCheck, Heart, MapPin, Star } from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { LazyImage } from "../../ui/LazyImage/LazyImage";
import { useAuthCheck } from "../../../hooks/useAuthCheck";
import { isPngImage } from "@/utils/validation";
import { cn } from "@/lib/utils/cn";

interface ArtistCardProps {
	imgSrc?: string;
	name: string;
	genres: Array<string>;
	location: string;
	description: string;
	rating?: number;
	verified?: boolean;
	onFavoriteClick?: () => void;
	isFavorite?: boolean;
	isFavoriteLoading?: boolean;
	onProfileClick?: () => void;
	// Lists (Search, Favorites): below 640px the card becomes a compact row,
	// photo on the left, instead of a 480px tall card. Carousels keep it off
	listOnMobile?: boolean;
}

export const ArtistCard = ({
	description,
	genres,
	location,
	name,
	imgSrc,
	rating,
	verified = false,
	onFavoriteClick,
	isFavorite = false,
	isFavoriteLoading = false,
	onProfileClick,
	listOnMobile = false,
}: ArtistCardProps) => {
	const { requireAuth } = useAuthCheck();

	const handleFavoriteClick = (event: React.MouseEvent) => {
		event.stopPropagation();
		requireAuth(() => {
			onFavoriteClick?.();
		});
	};

	const handleCardClick = () => {
		onProfileClick?.();
	};

	return (
		<div
			className={cn(
				"flex flex-col w-full max-w-[420px] h-[480px] group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 cursor-pointer",
				listOnMobile &&
					"max-sm:flex-row max-sm:items-center max-sm:gap-3 max-sm:h-auto max-sm:max-w-none max-sm:p-3 max-sm:rounded-xl max-sm:shadow-sm"
			)}
			onClick={handleCardClick}
		>
			{/* Image Section */}
			<div
				className={cn(
					"h-[180px] w-full relative overflow-hidden",
					listOnMobile &&
						"max-sm:h-28 max-sm:w-28 max-sm:shrink-0 max-sm:rounded-lg"
				)}
			>
				<LazyImage
					alt={`Foto de ${name}`}
					className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-300
						${isPngImage(imgSrc || "") ? "bg-white" : "bg-black"}
						`}
					src={imgSrc}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
				{onFavoriteClick && (
					<button
						className={`absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 ${
							isFavoriteLoading ? "cursor-wait opacity-70" : ""
						}`}
						onClick={handleFavoriteClick}
						disabled={isFavoriteLoading}
					>
						<Heart
							className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${isFavoriteLoading ? "animate-pulse" : ""}`}
							style={{
								color: isFavorite ? "#dc2626" : "#6b7280",
								fill: isFavorite ? "#dc2626" : "none",
							}}
						/>
					</button>
				)}

				{/* Rating Badge */}
				{rating && (
					<div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 sm:px-3 sm:py-1 shadow-lg">
						<div className="flex items-center gap-1">
							<Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
							<span className="text-xs sm:text-sm font-semibold text-gray-800">
								{rating.toFixed(1)}
							</span>
						</div>
					</div>
				)}
			</div>

			{/* Content Section */}
			<div
				className={cn(
					"flex flex-col flex-1 w-full p-4 sm:p-5",
					listOnMobile && "max-sm:min-w-0 max-sm:p-0"
				)}
			>
				{/* Title and Verification */}
				<div
					className={cn(
						"flex items-start gap-2 mb-3",
						listOnMobile && "max-sm:mb-1"
					)}
				>
					<h3
						className={cn(
							"text-lg sm:text-xl font-bold line-clamp-2 text-primary-600 group-hover:text-primary-800 transition-colors leading-tight",
							listOnMobile && "max-sm:text-base"
						)}
					>
						{name}
					</h3>
					{verified && (
						<BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500 flex-shrink-0 mt-0.5" />
					)}
				</div>

				{/* Location */}
				<div
					className={cn(
						"flex items-center gap-2 mb-3 text-gray-600",
						listOnMobile && "max-sm:mb-1.5"
					)}
				>
					<MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
					<span className="text-xs sm:text-sm font-medium truncate line-clamp-1">
						{location}
					</span>
				</div>

				{/* Genres */}
				<div
					className={cn(
						"flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4",
						listOnMobile &&
							"max-sm:mb-1.5 max-sm:flex-nowrap max-sm:overflow-hidden"
					)}
				>
					{genres.slice(0, 2).map((genre) => (
						<span
							key={genre}
							className="bg-gradient-to-r from-primary-50 to-gray-50 text-primary-700 text-xs px-2 py-0.5 sm:px-3 sm:py-1 rounded-full font-medium border border-primary-100 whitespace-nowrap"
						>
							{genre}
						</span>
					))}
					{genres.length > 2 && (
						<span className="text-xs text-gray-500 px-1.5 sm:px-2 py-0.5 sm:py-1 whitespace-nowrap">
							+{genres.length - 2} mais
						</span>
					)}
				</div>

				{/* Description */}
				<p
					className={cn(
						"text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-3 leading-relaxed",
						listOnMobile && "max-sm:mb-0 max-sm:line-clamp-2"
					)}
				>
					{description}
				</p>

				{/* Action Button */}
				{/* In the phone row the whole card opens the profile */}
				<div className={cn("mt-auto w-full", listOnMobile && "max-sm:hidden")}>
					{/* bg-gradient-to-r from-primary-600 to-gray-800 hover:from-primary-700 hover:to-gray-800 */}
					<Button
						className="w-full  text-white bg-primary-600 hover:bg-primary-700 font-semibold py-2.5 sm:py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl text-sm sm:text-base"
						variant="primary"
					>
						Ver Perfil
					</Button>
				</div>
			</div>
		</div>
	);
};
