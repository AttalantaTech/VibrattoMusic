import {
	HelpCircle,
	Search,
	LogOut,
	User,
	Music,
	Music2Icon,
	Plus,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Button } from "../../ui/Button/Button";
import { VibrattoLogo } from "../../VibrattoLogo/VibrattoLogo";
import { NotificationBell } from "../NotificationBell";
import { MessageBell } from "../MessageBell";
import { useAuthStore } from "../../../store/authStore";
import { useState, useRef, useEffect, useMemo } from "react";
import { BandProfileSwitcher } from "../../BandProfileSwitcher";
import { useOnboardingData } from "@/hooks/useMusicalProducts";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { useSyncMusicalProducts } from "@/hooks/useSyncMusicalProducts";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import type { OnboardingApiResponse } from "@/api/types";

export const Header = () => {
	const { isAuthenticated, logout } = useAuthStore();
	const location = useLocation();
	const navigate = useNavigate();
	const [showDropdown, setShowDropdown] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useSyncMusicalProducts();

	const { activeProduct, availableProducts, setActiveProduct } =
		useMusicalProductStore();
	const { musicalProducts } = useProfileStatus();

	const { data } = useOnboardingData();
	const onboardingData = useMemo<OnboardingApiResponse | undefined>(() => {
		return data?.find((item) => item);
	}, [data]);

	const isOnboardingPage = location.pathname.includes("/onboarding");
	const showNotifications = isAuthenticated && !isOnboardingPage;
	const showSearchButton =
		!isOnboardingPage && !location.pathname.includes("/search");

	useEffect(() => {
		// if (!musicalProducts?.dados.length) return;
		// const musicalProduct = musicalProducts.dados.find((item) => item);
		// if (musicalProduct) setActiveProduct(musicalProduct);
	}, [musicalProducts, setActiveProduct]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setShowDropdown(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const handleLogout = async () => {
		logout();
		await navigate({ to: "/" });
	};

	const handleProfile = async () => {
		setShowDropdown(false);

		if (activeProduct) {
			await navigate({
				to: "/band/me",
				search: { tab: "account" },
			});
		} else if (musicalProducts && musicalProducts.dados.length > 0) {
			await navigate({
				to: "/band/me",
				search: { tab: "messages" },
			});
		} else if (onboardingData?.etapaCadastro) {
			const etapaCadastro =
				onboardingData.etapaCadastro === 6
					? onboardingData.etapaCadastro
					: onboardingData.etapaCadastro + 1;

			await navigate({
				to: `/band/register/onboarding/${etapaCadastro}`,
			});
		} else {
			await navigate({
				to: `/band/register/onboarding/1`,
			});
		}
	};

	return (
		<header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
			<nav className="flex flex-row w-full h-16 justify-between items-center px-4 sm:px-6 lg:px-8 max-w-9xl mx-auto">
				{/* Logo */}
				<div className="flex-shrink-0">
					<VibrattoLogo />
				</div>

				{/* Actions */}
				<div className="flex flex-row items-center gap-2 sm:gap-3 flex-shrink-0">
					{/* Band Profile Switcher - For musicians with at least one product */}
					{isAuthenticated && (
						<BandProfileSwitcher
							activeMusicalProduct={activeProduct}
							musicalProducts={availableProducts}
							onProductChange={setActiveProduct}
						/>
					)}

					{/* Search button - Always visible */}
					{showSearchButton && (
						<Link to="/search">
							<Button variant="transparent" size="sm" className="p-2">
								<Search className="w-5 h-5 text-gray-600" />
							</Button>
						</Link>
					)}

					{/* Messages */}
					{showNotifications && <MessageBell />}

					{/* Notifications */}
					{showNotifications && <NotificationBell />}

					{/* Auth buttons */}
					{isAuthenticated ? (
						<div className="relative" ref={dropdownRef}>
							<Button
								variant="transparent"
								className="w-10 h-10 p-0 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center"
								onClick={() => {
									setShowDropdown(!showDropdown);
								}}
							>
								{activeProduct?.id ? (
									<Music className="w-5 h-5 text-gray-600" />
								) : (
									<User className="w-5 h-5 text-gray-600" />
								)}
							</Button>

							{showDropdown && (
								<div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200">
									<button
										onClick={handleProfile}
										className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
									>
										{activeProduct?.id ? (
											<Music className="w-4 h-4" />
										) : (
											<User className="w-4 h-4" />
										)}
										<span>Meu Perfil</span>
									</button>
									<button
										onClick={async () => {
											await navigate({
												to: `/band/register/onboarding/1`,
												search: {
													type: "new-onboarding",
												},
											});
										}}
										className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
									>
										<div className="flex relative">
											<Music2Icon className="w-4 h-4" />
											{/* <span
												className="absolute -top-1.5 pb-0.5 -right-1 flex items-center justify-center
        w-3 h-3 text-[9px] font-bold bg-black text-white rounded-full border border-white"
											>
												+
											</span> */}
											<span
												className="absolute top-1 -right-1 flex items-center justify-center
        w-3 h-3 font-bold text-black rounded-full"
											>
												<Plus strokeWidth={3} className="w-2 h-3" />
											</span>
										</div>
										<span>Criar Novo Perfil</span>
									</button>
									{/* Help link */}
									<a
										href="mailto:ayav@ic.ufal.br"
										target="_blank"
										onClick={() => {
											setShowDropdown(false);
										}}
										className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-gray-700"
									>
										<HelpCircle className="w-4 h-4" />
										<span>Preciso de ajuda</span>
									</a>
									<button
										onClick={handleLogout}
										className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-600"
									>
										<LogOut className="w-4 h-4" />
										<span>Sair</span>
									</button>
								</div>
							)}
						</div>
					) : (
						<div className="flex gap-1 sm:gap-2">
							<Link to="/login">
								<Button
									variant="transparent"
									size="sm"
									className="text-sm sm:text-base px-2 sm:px-4"
								>
									Entrar
								</Button>
							</Link>
							<Link to="/welcome">
								<Button
									variant="gradient"
									size="sm"
									className="text-sm sm:text-base px-2 sm:px-4"
								>
									Cadastre-se
								</Button>
							</Link>
						</div>
					)}
				</div>
			</nav>
		</header>
	);
};
