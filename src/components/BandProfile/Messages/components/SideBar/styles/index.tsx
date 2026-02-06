import { PropsWithChildren } from "react";

export const SideBarHeaderContainer = ({ children }: PropsWithChildren) => {
	return <div className="p-4 border-b border-gray-200">{children}</div>;
};

export const UserInfoContainer = ({ children }: PropsWithChildren) => {
	return (
		<div className="flex items-center justify-between mb-4">
			<div className="flex items-center space-x-3">{children}</div>
		</div>
	);
};

export const UserImageContainer = ({
	children,
	size = 10,
}: PropsWithChildren & { size?: number }) => {
	return (
		<div
			className={`w-${size} h-${size} bg-gray-300 rounded-full flex items-center justify-center`}
		>
			<span className="text-sm font-medium text-gray-600 ">{children}</span>
		</div>
	);
};

export const SearchBarContainer = ({ children }: PropsWithChildren) => {
	return <div className="relative">{children}</div>;
};

export const ConversationsListContainer = ({ children }: PropsWithChildren) => {
	return <div className="flex-1 overflow-y-auto">{children}</div>;
};

export const ConversationTabContainer = ({
	children,
	isSelected,
	onClick,
}: PropsWithChildren & {
	isSelected: boolean;
	onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}) => {
	return (
		<div
			className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
				isSelected ? "bg-blue-50" : ""
			}`}
			onClick={onClick}
		>
			<div className="flex items-center space-x-3">{children}</div>
		</div>
	);
};

export const ConversationInfoContainer = ({ children }: PropsWithChildren) => {
	return <div className="flex-1 min-w-0">{children}</div>;
};
