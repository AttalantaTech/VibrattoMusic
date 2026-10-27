import clsx from "clsx";
import { Dropdown } from "../Dropdown/Dropdown";
import { ChevronDown, FileText } from "lucide-react";
import { useEffect, useRef } from "react";

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
		active: "bg-primary-50 text-primary-600",
		inactive: "text-gray-700 hover:text-primary-600",
	},
	underline: {
		button: "text-sm font-medium",
		active: "text-primary-600",
		inactive: "text-gray-500 hover:text-gray-700",
	},
	pills: {
		button:
			"rounded-full text-sm font-medium px-4 py-2 border transition-colors",
		active: "bg-primary-600 text-white border-primary-600",
		inactive:
			"text-gray-700 border-gray-300 hover:border-primary-600 hover:text-primary-600",
	},
};

export const TabNavigation = ({
	tabs,
	currentTab,
	variant = "default",
	onChange,
}: TabNavigationProps) => {
	const scrollerRef = useRef<HTMLDivElement>(null);

	// Brings the active tab into view (e.g. "Ajustes" opened from a link on a
	// phone). Scrolls only the tab strip: scrollIntoView could also move the page
	useEffect(() => {
		const scroller = scrollerRef.current;
		const active = scroller?.querySelector<HTMLElement>('[data-active="true"]');
		if (!scroller || !active) return;

		const scrollerBox = scroller.getBoundingClientRect();
		const activeBox = active.getBoundingClientRect();
		const isVisible =
			activeBox.left >= scrollerBox.left &&
			activeBox.right <= scrollerBox.right;
		if (isVisible) return;

		scroller.scrollTo({
			left:
				scroller.scrollLeft +
				activeBox.left -
				scrollerBox.left -
				(scrollerBox.width - activeBox.width) / 2,
			behavior: "smooth",
		});
	}, [currentTab]);

	return (
		// Tabs that don't fit scroll sideways inside the strip instead of
		// widening the whole page on phones
		<div
			ref={scrollerRef}
			className="w-full min-w-0 overflow-x-auto overscroll-x-contain scrollbar-hide"
		>
			<div
				className={`
				flex w-max items-center
				${variant === "pills" ? "gap-3" : "gap-1 sm:gap-2 lg:mx-auto lg:gap-4"}
				px-3 sm:px-4 py-2`}
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
										data-active={isActive || !!currentSubTab}
										className={clsx(
											variant === "pills"
												? "flex items-center justify-center"
												: // Phones: width follows the label so more tabs fit (the
													// 64px height keeps a comfortable touch target)
													"h-16 relative px-3 sm:px-4 py-2 font-medium min-w-[44px] sm:min-w-[120px] text-center flex items-center justify-center whitespace-nowrap",
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
										<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
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
		</div>
	);
};
