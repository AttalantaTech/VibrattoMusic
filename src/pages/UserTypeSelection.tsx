import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "../components/ui/Button/Button";
import LogoVibratto from "../assets/images/Logo_Vibratto.png";
import VibrattoName from "../assets/images/Vibratto.png";
import { useAuthStore } from "../store/authStore";
import { setStoredUserType } from "../utils/userType";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";

// Updated to allow multiple selections
type UserRole = "contratante" | "musico";

export const UserTypeSelection = () => {
	const [selectedRoles, setSelectedRoles] = useState<Set<UserRole>>(new Set());
	const navigate = useNavigate();
	const { user, updateUser } = useAuthStore();

	const handleRoleToggle = (role: UserRole) => {
		const newSelectedRoles = new Set(selectedRoles);
		if (newSelectedRoles.has(role)) {
			newSelectedRoles.delete(role);
		} else {
			newSelectedRoles.add(role);
		}
		setSelectedRoles(newSelectedRoles);
	};

	const handleContinue = () => {
		if (selectedRoles.size === 0) return;

		// Determine the primary role based on selection
		const roleArray = Array.from(selectedRoles);
		const primaryRole =
			roleArray.length === 2 ? "ambos" : roleArray[0] || "contratante";

		// Map frontend user role to backend user type
		const userTypeMap: Record<string, "cliente" | "produto_musical"> = {
			contratante: "cliente",
			musico: "produto_musical",
			ambos: "produto_musical", // both paths include musician onboarding
		};

		// Store the user choice temporarily for use after registration
		const userType = userTypeMap[primaryRole];
		if (userType) {
			localStorage.setItem("temp-user-choice", userType);
		}

		// If the user is already authenticated, reflect the selection immediately
		if (user && userTypeMap[primaryRole]) {
			updateUser({ userType: userTypeMap[primaryRole] });
			setStoredUserType(userTypeMap[primaryRole]);
		}

		// Navigate based on authentication status
		if (user) {
			// User is already authenticated, navigate based on selection
			if (primaryRole === "musico" || primaryRole === "ambos") {
				void navigate({ to: "/band/register/onboarding/1" });
			} else {
				void navigate({ to: "/" });
			}
		} else {
			// User is not authenticated, always go to register first
			void navigate({ to: "/register" });
		}
	};

	return (
		<div className="flex flex-col min-h-[100dvh] w-full justify-center items-center bg-gradient-to-br from-blue-50 to-white px-4 py-8 sm:py-12">
			<div className="w-full max-w-4xl">
				{/* Header */}
				<div className="flex flex-col justify-center items-center gap-6 mb-8 sm:mb-12">
					<div className="flex items-center justify-around">
						<img
							alt="Vibratto logo"
							className="w-auto h-8"
							src={LogoVibratto}
						/>
						<img
							alt="Vibratto logo"
							className="w-auto h-3 sm:h-4"
							src={VibrattoName}
						/>
					</div>
					<div className="text-center">
						<h1 className="text-3xl font-bold text-gray-900 mb-3">
							Como você quer usar a plataforma?
						</h1>
					</div>
				</div>

				{/* Role Selection Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-2xl mx-auto">
					{/* Contratar Profissionais Card */}
					<div
						className={`relative p-6 border-2 rounded-xl ${
							selectedRoles.has("contratante")
								? "border-primary-500 bg-primary-50"
								: "border-gray-200 bg-white"
						}`}
					>
						<div className="absolute top-3 right-3 w-5 h-5  flex items-center justify-center">
							<Checkbox
								onClick={() => {
									handleRoleToggle("contratante");
								}}
							/>
						</div>
						<div className="flex items-start text-start h-full space-x-4">
							<div className="w-9 h-9 bg-[#f3f4f6] rounded-lg flex items-center justify-center mb-4">
								<svg
									className="w-5 h-5 text-[#505767]"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
							</div>
							<div>
								<h3 className="font-semibold text-lg text-gray-900 mb-2">
									Contratar profissionais
								</h3>
								<p className="text-gray-600 text-sm">
									Quero contratar músicos para serviços
								</p>
							</div>
						</div>
					</div>

					{/* Oferecer Serviços Card */}
					<div
						className={`relative p-6 border-2 rounded-xl ${
							selectedRoles.has("musico")
								? "border-primary-500 bg-primary-50"
								: "border-gray-200 bg-white"
						}`}
					>
						<div className="absolute top-3 right-3 w-5 h-5 flex items-center justify-center">
							<Checkbox
								onClick={() => {
									handleRoleToggle("musico");
								}}
							/>
						</div>

						<div className="flex items-start text-start h-full space-x-4">
							<div className="w-9 h-9 bg-[#f3f4f6] rounded-lg flex items-center justify-center mb-4">
								<svg
									className="w-6 h-6 text-[#505767]"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
									/>
								</svg>
							</div>
							<div>
								<h3 className="font-semibold text-lg text-gray-900 mb-2">
									Oferecer meus serviços
								</h3>
								<p className="text-gray-600 text-sm">
									Quero oferecer meus serviços musicais
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Info Text */}
				<div className="flex items-center justify-center mb-8">
					<div className="flex items-start sm:items-center text-gray-600 text-sm">
						<svg
							className="w-4 h-4 mr-2 mt-0.5 sm:mt-0 shrink-0"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fillRule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
								clipRule="evenodd"
							/>
						</svg>
						Você pode selecionar ambas as opções se quiser contratar e oferecer
						serviços
					</div>
				</div>

				{/* Continue Button */}
				<div className="flex justify-center mb-8">
					<Button
						onClick={handleContinue}
						disabled={selectedRoles.size === 0}
						className="w-full sm:w-auto px-8 py-3 text-lg font-semibold min-w-[200px]"
					>
						Continuar
					</Button>
				</div>

				{/* Login Link */}
				<div className="text-center">
					<p className="text-gray-600">
						Já tem uma conta?{" "}
						<button
							onClick={() => navigate({ to: "/login" })}
							className="text-primary-600 hover:text-primary-700 font-medium underline"
						>
							Faça login
						</button>
					</p>
				</div>
			</div>
		</div>
	);
};
