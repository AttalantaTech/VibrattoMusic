import { Star, Verified } from "lucide-react";
import { LazyImage } from "../ui/LazyImage/LazyImage";

type Comment = {
	author: string;
	numStars: number;
	date: string;
	comment: string;
};

interface RatingCommentProps {
	comment: Comment;
}

export const RatingComment = ({ comment }: RatingCommentProps) => {
	return (
		<div className="flex flex-col w-full items-center py-4 gap-4">
			<div className="flex w-full gap-4">
				{" "}
				<LazyImage
					alt="Profile picture"
					className="rounded-md w-[90px] h-[83.18px] object-cover"
					src={undefined}
				/>
				<div className="flex flex-col items-center w-full gap-[6px] pt-1">
					<div className="flex w-full gap-[6px] text-xs text-gray-900 items-center">
						<span>
							Enviado por{" "}
							<span className="font-semibold">{comment.author}</span>
						</span>
						<Verified color="#3E97FF" size={16} />
					</div>

					<p className="w-full text-gray-900 text-xs">{comment.date}</p>
					<div className="flex w-full items-center justify-start">
						{Array.from({ length: comment.numStars }).map((_, index) => (
							<Star
								key={index}
								className="text-yellow-500"
								fill="currentColor"
								size={17}
							/>
						))}
					</div>
				</div>
			</div>
			<p className="text-gray-600 lg:text-justify">{comment.comment}</p>
		</div>
	);
};
