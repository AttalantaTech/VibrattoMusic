import type { ReactNode } from "react";

interface AccountLayoutProps {
	children: ReactNode;
	headerTitle: string;
	headerIcon: ReactNode;
	isFinishing?: boolean;
}

export const AccountLayout = ({
	children,
	headerIcon,
	headerTitle,
}: AccountLayoutProps) => {
	return (
		<div className="flex flex-col min-h-screen justify-start items-center">
			<main className="flex flex-col items-center justify-center w-full">
				<div className="flex flex-col w-full items-center justify-start">
					<div className="flex flex-col w-full h-full items-center justify-center p-4 md:p-6 lg:p-8 gap-4 md:gap-6 border border-gray-200 bg-gray-50 rounded-lg text-left">
						<div className="flex w-full items-center gap-3 md:gap-6">
							<div className="flex items-center justify-center bg-[#d6f2ff] p-2 md:p-3 rounded">
								{headerIcon}
							</div>
							<h1 className="text-gray-900 font-bold text-lg md:text-xl lg:text-2xl">
								{headerTitle}
							</h1>
						</div>
						<hr className="w-full" />

						{children}
					</div>
				</div>
			</main>
		</div>
	);
};
