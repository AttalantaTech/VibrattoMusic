import Logo from "../../assets/images/Logomark.png";

export const VibrattoLogo = () => {
	return (
		<a
			className="flex w-[112.87px] h-8 justify-center items-center gap-2"
			href="/"
		>
			<img alt="Vibratto logo" className="w-[19.33px] h-[32px]" src={Logo} />
			<h1 className="font-semibold text-base text-[#007BFF]">Vibratto</h1>
		</a>
	);
};
