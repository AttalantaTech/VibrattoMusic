import { Loader2 } from "lucide-react";

export const Loading = () => {
	return (
		<div className="flex items-center justify-center p-8">
			<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
		</div>
	);
};
