import type React from "react";

interface RatingBarProps {
	starCount: number;
	count: number;
	totalCount: number;
	barColor?: string;
	bgColor?: string;
	showCount?: boolean;
}

const RatingBar: React.FC<RatingBarProps> = ({
	starCount,
	count,
	totalCount,
	barColor = "bg-yellow-400",
	bgColor = "bg-gray-200",
	showCount = true,
}) => {
	const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;

	return (
		<div className="flex items-center gap-[6px] w-full">
			<span className="text-sm font-medium ">{starCount}</span>
			<div
				className={`flex-1 h-3 ${bgColor} rounded-full overflow-hidden w-full`}
			>
				<div
					className={`h-full w-full ${barColor}`}
					style={{ width: `${percentage}%` }}
				/>
			</div>
			{showCount && (
				<span className="text-sm text-gray-600 w-12">({count})</span>
			)}
		</div>
	);
};

interface RatingBarsProps {
	totalRatings: number;
	ratingDistribution: {
		fiveStars: number;
		fourStars: number;
		threeStars: number;
		twoStars: number;
		oneStar: number;
	};
	barColor?: string;
	bgColor?: string;
	showCounts?: boolean;
	title?: string;
}

export const RatingBars: React.FC<RatingBarsProps> = ({
	totalRatings,
	ratingDistribution,
	barColor,
	bgColor,
	showCounts = true,
	title = "Ordenar por nota",
}) => {
	return (
		<div className="space-y-2 w-full gap-[6px]">
			{title && <h3 className="font-semibold text-gray-600">{title}</h3>}
			<RatingBar
				barColor={barColor}
				bgColor={bgColor}
				count={ratingDistribution.fiveStars}
				showCount={showCounts}
				starCount={5}
				totalCount={totalRatings}
			/>
			<RatingBar
				barColor={barColor}
				bgColor={bgColor}
				count={ratingDistribution.fourStars}
				showCount={showCounts}
				starCount={4}
				totalCount={totalRatings}
			/>
			<RatingBar
				barColor={barColor}
				bgColor={bgColor}
				count={ratingDistribution.threeStars}
				showCount={showCounts}
				starCount={3}
				totalCount={totalRatings}
			/>
			<RatingBar
				barColor={barColor}
				bgColor={bgColor}
				count={ratingDistribution.twoStars}
				showCount={showCounts}
				starCount={2}
				totalCount={totalRatings}
			/>
			<RatingBar
				barColor={barColor}
				bgColor={bgColor}
				count={ratingDistribution.oneStar}
				showCount={showCounts}
				starCount={1}
				totalCount={totalRatings}
			/>
		</div>
	);
};
