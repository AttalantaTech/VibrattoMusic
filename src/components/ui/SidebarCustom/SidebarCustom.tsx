import type { Dispatch, SetStateAction } from "react";
import { ChevronRight } from "lucide-react";

interface Item {
	id: string;
	label: string;
}

interface SidebarCustomProps {
	items: Array<Item>;
	activeItem: string;
	setActiveItem: Dispatch<SetStateAction<string>>;
}

export const SidebarCustom = ({
	items,
	activeItem,
	setActiveItem,
}: SidebarCustomProps) => {
	return (
		<div className="w-full lg:w-2/5 xl:w-[40%] border border-gray-200 bg-gray-50 rounded-lg px-4 md:px-6 lg:px-7 py-1 md:py-2 lg:py-3  lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
			<nav className="space-y-1">
				{items.map((item, index) => (
					<div key={item.id}>
						<button
							onClick={() => {
								setActiveItem(item.id);
							}}
							className={`w-full flex justify-center lg:justify-between items-center gap-3 px-3  rounded-lg transition-colors py-4 md:py-6 lg:py-7 ${
								activeItem === item.id
									? "text-primary-600"
									: "text-gray-700 hover:bg-gray-50"
							}`}
						>
							<span className="font-medium">{item.label}</span>

							<ChevronRight
								className={`hidden lg:block ${
									activeItem === item.id
										? "text-primary-600"
										: "text-gray-700 hover:bg-gray-50"
								}`}
								size={24}
							/>
						</button>

						{index !== items.length - 1 && (
							<hr className="w-full border-t border-gray-200 my-1" />
						)}
					</div>
				))}
			</nav>
		</div>
	);
};
