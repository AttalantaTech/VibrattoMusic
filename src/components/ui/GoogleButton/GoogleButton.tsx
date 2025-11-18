export const GoogleButton = () => {
	return (
		<button className="flex items-center justify-center gap-3 max-w-sx border border-gray-300 rounded-lg py-2 px-4 hover:bg-gray-100 transition-colors">
			<img
				alt="Google logo"
				className="w-5 h-5"
				src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
			/>
			<span className="text-base font-semibold text-gray-800">
				Cadastre-se com o Google
			</span>
		</button>
	);
};
