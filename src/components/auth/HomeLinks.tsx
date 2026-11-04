import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import LogoVibratto from "@/assets/images/Logo_Vibratto.png";
import VibrattoName from "@/assets/images/Vibratto.png";

// Login and sign-up pages have no site header, so these are the way out.
// Both always go to the Home: the visitor may have arrived from an outside
// link, where "back one page" would leave the site

export const BackToHomeLink = () => (
	<Link
		className="mb-6 inline-flex items-center gap-1 self-start text-sm text-gray-500 hover:text-primary-600"
		to="/"
	>
		<ArrowLeft className="h-4 w-4" />
		Voltar para o início
	</Link>
);

type HomeLogoLinkProps = {
	/** Size of the symbol; the name keeps its size on every page */
	symbolClassName?: string;
};

export const HomeLogoLink = ({
	symbolClassName = "h-5 sm:h-10",
}: HomeLogoLinkProps) => (
	<Link
		aria-label="Ir para a página inicial"
		className="flex items-center justify-around"
		to="/"
	>
		<img
			alt="Vibratto logo"
			className={`w-auto ${symbolClassName}`}
			src={LogoVibratto}
		/>
		<img alt="Vibratto logo" className="w-auto h-3 sm:h-4" src={VibrattoName} />
	</Link>
);
