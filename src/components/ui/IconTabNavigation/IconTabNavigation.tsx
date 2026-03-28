import clsx from "clsx";

type IconTab = {
	label: string;
	value: string;
	icon: React.ReactNode | null;
	badgeCount?: number;
};

interface IconTabNavigationProps {
	tabs: Array<IconTab>;
	currentTab: string;
	variant?: "default" | "underline" | "icon";
	onChange: (value: string) => void;
}

const styles = {
	default: {
		button:
			"rounded-lg text-xs sm:text-base font-semibold flex items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 min-w-0 flex-1 sm:flex-initial whitespace-nowrap",
		active: "bg-primary-600 text-primary-600 text-white",
		inactive: "text-gray-700 hover:text-primary-600",
	},
	underline: {
		button: "text-sm font-medium flex items-center gap-2",
		active: "text-primary-600",
		inactive: "text-gray-500 hover:text-gray-700",
	},
	icon: {
		button: "flex flex-col items-center justify-center gap-1 p-3 w-full",
		active: "text-primary-600 border-b-2 border-primary-600",
		inactive: "text-gray-500 hover:text-gray-700",
	},
};

export const IconTabNavigation = ({
	tabs,
	currentTab,
	variant = "default",
	onChange,
}: IconTabNavigationProps) => {
	return (
		<div className="flex items-center justify-start w-full overflow-x-auto">
			<div className="flex items-center justify-start border border-gray-300 rounded-lg min-w-full sm:min-w-0 sm:w-auto">
				{tabs.map((tab) => {
					const isActive = tab.value === currentTab;

					return (
						<button
							key={tab.value}
							type="button"
							className={clsx(
								"relative transition-colors",
								styles[variant].button,
								isActive ? styles[variant].active : styles[variant].inactive
							)}
							onClick={(event) => {
								event.preventDefault();
								event.stopPropagation();
								onChange(tab.value);
							}}
						>
							<div className="flex items-center justify-center gap-1 sm:gap-2">
								<div className="flex-shrink-0">{tab.icon}</div>
								{variant !== "icon" && (
									<span
										className={clsx(
											variant === "underline" ? "ml-2" : "",
											"text-xs sm:text-sm truncate"
										)}
									>
										{tab.label}
									</span>
								)}
							</div>

							{tab.badgeCount !== undefined && variant !== "icon" && (
								<span className="ml-2 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full font-semibold">
									{tab.badgeCount}
								</span>
							)}

							{variant === "underline" && isActive && (
								<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
							)}

							{variant === "icon" && (
								<span className="text-xs font-medium">{tab.label}</span>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
};
