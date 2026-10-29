import { HelpCircle, User, Music, Settings } from "lucide-react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Button } from "../../ui/Button/Button";
import { VibrattoLogo } from "../../VibrattoLogo/VibrattoLogo";
import { NotificationBell } from "../NotificationBell";
import { MessageBell } from "../MessageBell";
import { useAuthStore } from "../../../store/authStore";
import { useState, useRef, useEffect } from "react";
import { BandProfileSwitcher } from "../../BandProfileSwitcher";
import { useSyncMusicalProducts } from "@/hooks/useSyncMusicalProducts";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { SUPPORT_WHATSAPP_URL, openSupportWhatsapp } from "@/utils/support";

export const Header = () => {
	const { isAuthenticated } = useAuthStore();
	const location = useLocation();
	const navigate = useNavigate();
	const [showDropdown, setShowDropdown] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const [profilePage, setProfilePage] = useState(1);
	const [hasMoreProfiles, setHasMoreProfiles] = useState(true);

	const {
		musicalProducts,
		user,
		isLoading: isFetchingProfiles,
	} = useProfileStatus({
		pagina: profilePage,
		tamanhoPagina: 10,
		ordenarPorAvaliacao: true,
	});

	useSyncMusicalProducts({
		musicalProducts,
		user,
		isLoading: isFetchingProfiles,
		setHasMoreProfiles,
		profilePage,
		profilePageSize: 10,
	});

	const { activeProduct, availableProducts, setActiveProduct } =
		useMusicalProductStore();

	const isOnboardingPage = location.pathname.includes("/onboarding");
	const showNotifications = isAuthenticated && !isOnboardingPage;

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

	const handleProfile = async () => {
		setShowDropdown(false);

		if (activeProduct) {
			await navigate({
				to: "/band/me",
				search: { tab: "account" },
			});
		} else {
			await navigate({
				to: "/band/me",
				search: { tab: "messages" },
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
				<div className="flex flex-row items-center gap-1 sm:gap-3 flex-shrink-0">
					{/* Messages */}
					{showNotifications && <MessageBell />}

					{/* Notifications */}
					{showNotifications && <NotificationBell />}

					{/* Auth buttons */}
					{isAuthenticated ? (
						<div className="relative" ref={dropdownRef}>
							<Button
								variant="transparent"
								className="w-9 h-9 p-2 rounded-full flex items-center justify-center"
								onClick={() => {
									setShowDropdown(!showDropdown);
								}}
							>
								<Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
							</Button>

							{showDropdown && (
								<div className="absolute right-0 mt-2 w-60 bg-white rounded-md shadow-lg border border-gray-200">
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

									{/* Help link: opens the support WhatsApp */}
									{SUPPORT_WHATSAPP_URL && (
										<button
											type="button"
											onClick={() => {
												setShowDropdown(false);
												openSupportWhatsapp();
											}}
											className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-gray-700"
										>
											<HelpCircle className="w-4 h-4" />
											<span>Preciso de ajuda</span>
										</button>
									)}
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
						</div>
					)}

					{/* Band Profile Switcher - For musicians with at least one product */}
					{isAuthenticated && (
						<BandProfileSwitcher
							activeMusicalProduct={activeProduct}
							musicalProducts={availableProducts}
							onProductChange={setActiveProduct}
							onReachEnd={() => {
								if (!hasMoreProfiles || isFetchingProfiles) {
									return;
								}

								setProfilePage((previous) => previous + 1);
							}}
							isLoading={isFetchingProfiles}
							totalProducts={musicalProducts?.paginacao?.totalItens}
						/>
					)}
				</div>
			</nav>
		</header>
	);
};
