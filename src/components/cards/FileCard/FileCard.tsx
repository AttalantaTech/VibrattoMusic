import { Button } from "@/components/ui/Button/Button";
import { Trash2, File } from "lucide-react";

interface PromoCardProps {
	title?: string;
	description?: string;
	src?: string;
	onClick?: () => void;
}

export const FileCard = ({ description, title, onClick }: PromoCardProps) => {
	return (
		<div className="flex justify-between items-center rounded-[8px] p-4 bg-white border border-gray-200">
			<div className="flex gap-4">
				<div className="flex justify-center items-center p-1 rounded-sm bg-gray-100">
					<File className="w-7 h-7 text-primary-600" />
				</div>
				<div className="flex flex-col justify-center">
					{title && (
						<h3 className="text-sm font-medium text-gray-700">{title}</h3>
					)}
					{description && (
						<p className="text-xs font-normal text-gray-600">{description}</p>
					)}
				</div>
			</div>

			<Button
				type="button"
				variant="transparent"
				className="h-10 w-10 p-0"
				onClick={onClick}
			>
				<Trash2 className="h-4 w-4" />
			</Button>
		</div>
	);
};
