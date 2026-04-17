import { VibrattoLogo } from "../../VibrattoLogo/VibrattoLogo";

export const OnboardingHeader = () => {
	return (
		<nav className="flex w-full h-20 p-3 px-4 sm:px-8 border border-gray-100 items-center justify-between">
			<div className="flex items-center">
				<VibrattoLogo />
			</div>
		</nav>
	);
};
