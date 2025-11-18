import { LazyImage } from "../../ui/LazyImage/LazyImage";

interface PromoCardProps {
	title: string;
	description: string;
	imgSrc?: string;
}

export const PromoCard = ({ description, title, imgSrc }: PromoCardProps) => {
	return (
		<div className="relative h-[373px] shadow-md rounded-[17.35px] overflow-hidden group">
			<LazyImage
				alt={title}
				className="w-full h-full object-cover rounded-[17.35px]"
				src={imgSrc}
				aspectRatio="portrait"
			/>

			{/* Gradient overlay */}
			<div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent rounded-[17.35px] z-10" />

			<div className="absolute bottom-0 left-0 right-0 p-6 text-white z-20">
				<h3 className="text-xl font-semibold drop-shadow-md">{title}</h3>
				<p className="font-normal mt-2 drop-shadow-md">{description}</p>
			</div>
		</div>
	);
};
