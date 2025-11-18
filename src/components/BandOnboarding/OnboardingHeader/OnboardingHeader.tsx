import { VibrattoLogo } from "../../VibrattoLogo/VibrattoLogo";
import { Button } from "../../ui/Button/Button";

export const OnboardingHeader = () => {
	return (
		<nav className="flex w-full h-20 p-3 px-4 sm:px-8 border border-gray-100 items-center justify-between">
			<div className="flex items-center">
				<VibrattoLogo />
			</div>
			<div className="flex items-center gap-3">
				<span className="text-gray-500 font-semibold text-sm sm:text-base">
					Já tem uma conta?
				</span>
				<a href="/login">
					<Button className="text-sm sm:text-base">Entrar</Button>
				</a>
			</div>
		</nav>
	);
};
