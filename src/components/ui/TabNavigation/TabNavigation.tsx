import clsx from "clsx";
import { Dropdown } from "../Dropdown/Dropdown";
import { ChevronDown, FileText } from "lucide-react";

type Tab = {
	label: string;
	subTabs?: Array<Tab>;
	value: string;
	badgeCount?: number;
	mobileLabel?: string;
};

interface TabNavigationProps {
	tabs: Array<Tab>;
	currentTab: string;
	variant?: "default" | "underline" | "pills";
	onChange: (value: string) => void;
}

const styles = {
	default: {
		button:
			"rounded-lg text-sm sm:text-base font-medium h-10 min-w-[84px] flex items-center justify-center",
		active: "bg-blue-50 text-blue-600",
		inactive: "text-gray-700 hover:text-blue-600",
	},
	underline: {
		button: "text-sm font-medium",
		active: "text-blue-600",
		inactive: "text-gray-500 hover:text-gray-700",
	},
	pills: {
		button:
			"rounded-full text-sm font-medium px-4 py-2 border transition-colors",
		active: "bg-blue-600 text-white border-blue-600",
		inactive:
			"text-gray-700 border-gray-300 hover:border-blue-600 hover:text-blue-600",
	},
};

export const TabNavigation = ({
	tabs,
	currentTab,
	variant = "default",
	onChange,
}: TabNavigationProps) => {
	return (
		<div
			className={`
				flex w-full items-center
				${variant === "pills" ? "justify-start gap-3" : "justify-start lg:justify-center gap-2 lg:gap-4"} 
				px-3 sm:px-4 py-2 overflow-x-scroll`}
		>
			{tabs.map((tab) => {
				const isActive = tab.value === currentTab;
				const currentSubTab = tab.subTabs?.find(
					(subTab) => subTab.value === currentTab
				);

				return (
					<Dropdown
						key={tab.value}
						align="left"
						trigger={
							<>
								<button
									key={tab.value}
									className={clsx(
										variant === "pills"
											? "flex items-center justify-center"
											: "h-16 relative px-3 sm:px-4 py-2 font-medium min-w-[100px] sm:min-w-[120px] text-center flex items-center justify-center whitespace-nowrap",
										styles[variant].button,
										isActive || currentSubTab
											? styles[variant].active
											: styles[variant].inactive
									)}
									onClick={() => {
										if (!tab.subTabs) {
											onChange(tab.value);
										}
									}}
								>
									{tab.label}
									{tab.subTabs && <ChevronDown className="ml-1 h-4 w-4" />}
								</button>
								{tab.badgeCount !== undefined && (
									<span className="ml-1 sm:ml-2 text-xs text-gray-600 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-full font-semibold">
										{tab.badgeCount}
									</span>
								)}
								{variant === "underline" && (isActive || currentSubTab) && (
									<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
								)}
							</>
						}
						className="text-sm"
					>
						{tab.subTabs &&
							tab.subTabs.map((subTab) => (
								<button
									onClick={() => {
										onChange(subTab.value);
									}}
									className={`flex gap-2 items-center m-0.5 p-2 rounded-md hover:bg-gray-200
										${subTab.value === currentTab && "bg-gray-200"}`}
									key={"subtab" + subTab.value}
								>
									<FileText color="gray" size={16} />
									{subTab.label}
								</button>
							))}
					</Dropdown>
				);
			})}
		</div>
	);
};
