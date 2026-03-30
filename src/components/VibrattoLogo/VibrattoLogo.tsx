import LogoVibratto from "../../assets/images/Logo_Vibratto.png";
import VibrattoName from "../../assets/images/Vibratto.png";

export const VibrattoLogo = () => {
	return (
		<a className="flex h-10 justify-center items-center gap-2" href="/">
			<img
				alt="Vibratto logo"
				className="w-auto h-5 sm:h-10"
				src={LogoVibratto}
			/>
			<div>
				<img
					alt="Vibratto logo"
					className="w-auto h-2 sm:h-7"
					src={VibrattoName}
				/>
			</div>
		</a>
	);
};
