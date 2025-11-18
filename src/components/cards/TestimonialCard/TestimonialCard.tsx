import { BadgeCheck, Star } from "lucide-react";
import { LazyImage } from "../../ui/LazyImage/LazyImage";

interface TestimonialCardProps {
	name: string;
	numberOfStars: number;
	hired: string;
}

export const TestimonialCard = ({
	name,
	numberOfStars,
	hired,
}: TestimonialCardProps) => {
	return (
		<div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-lg">
			{/* Mobile/Tablet Optimized Layout */}
			<div className="p-4 sm:p-5 lg:p-6">
				{/* Header */}
				<div className="flex items-start gap-3 sm:gap-4 mb-4">
					<LazyImage
						alt="avatar"
						className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-gray-200 flex-shrink-0 object-cover"
						src={undefined}
					/>
					<div className="flex-1 min-w-0">
						{/* Name and verification */}
						<div className="flex items-center gap-2 mb-2">
							<span className="text-sm sm:text-base font-medium text-gray-900 truncate">
								{name}
							</span>
							<BadgeCheck className="text-blue-500 flex-shrink-0" size={16} />
						</div>

						{/* Stars */}
						<div className="flex items-center gap-1 mb-2">
							{Array.from({ length: numberOfStars }).map((_, index) => (
								<Star
									key={index}
									className="w-4 h-4 text-yellow-400 fill-current"
								/>
							))}
							<span className="text-xs text-gray-500 ml-1">
								({numberOfStars}/5)
							</span>
						</div>

						{/* Hired info */}
						<div className="text-xs sm:text-sm text-gray-600">
							Contratou{" "}
							<a
								className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
								href="#"
							>
								{hired}
							</a>
						</div>
					</div>
				</div>

				{/* Content */}
				<div className="relative">
					<p className="text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed line-clamp-4 sm:line-clamp-3">
						"Desde o início, eles foram extremamente profissionais e fáceis de
						lidar. Responderam rapidamente, discutiram todos os detalhes com
						clareza e cumpriram tudo o que prometeram."
					</p>
				</div>
			</div>
		</div>
	);
};
