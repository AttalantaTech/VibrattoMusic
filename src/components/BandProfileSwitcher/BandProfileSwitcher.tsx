import type React from "react";
import { useState, useRef, useEffect } from "react";
import {
	ChevronDown,
	Check,
	LogOut,
	Music2Icon,
	Plus,
	Loader,
} from "lucide-react";
import { Avatar } from "../Avatar/Avatar";
import { cn } from "../../lib/utils/cn";
import type { ActiveMusicalProduct } from "@/hooks/useActiveMusicalProduct";
import { useUser } from "@/hooks/useUser";
import { useOnboardingData } from "@/hooks/useOnboarding";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { userKeys } from "@/hooks/useUser";
import { useAuthStore } from "@/store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { OnboardingsPedingModal } from "../BandProfile/Account/OnboardingsPedingModal";
import { useChat } from "@/hooks/useChat";

export type MusicalProduct = ActiveMusicalProduct;

export interface BandProfileSwitcherProps {
	activeMusicalProduct: MusicalProduct | null;
	musicalProducts: Array<MusicalProduct>;
	onProductChange: (product: MusicalProduct | null) => void;
	className?: string;
	onReachEnd?: () => void;
	isLoading?: boolean;
	/** All the user's profiles, while the list loads them page by page */
	totalProducts?: number;
}

export const BandProfileSwitcher: React.FC<BandProfileSwitcherProps> = ({
	activeMusicalProduct,
	musicalProducts,
	onProductChange,
	className,
	onReachEnd,
	isLoading,
	totalProducts,
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	const { data: userData } = useUser();
	const { data: onboardings } = useOnboardingData();
	const { logout } = useAuthStore();
	const queryClient = useQueryClient();
	const { setSelectedConversation } = useChat() || {};

	const [isOpen, setIsOpen] = useState(false);
	const [openOnboardingsPending, setOpenOnboardingsPending] = useState(false);

	const containerScrollRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const onReachEndRef = useRef(onReachEnd);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	useEffect(() => {
		onReachEndRef.current = onReachEnd;
	}, [onReachEnd]);

	useEffect(() => {
		if (!isOpen) return;

		const root = containerScrollRef.current;
		const target = sentinelRef.current;

		if (!root || !target) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					onReachEndRef.current?.();
				}
			},
			{
				root,
				threshold: 0.1,
			}
		);

		observer.observe(target);

		return () => {
			observer.disconnect();
		};
	}, [isOpen]);

	const handleProductSelect = (product: MusicalProduct | null) => {
		onProductChange(product);
		setIsOpen(false);
		setSelectedConversation(null);

		if (location.pathname === "/band/me") {
			if (!product) {
				void navigate({
					to: "/band/me",
					search: { tab: "messages" },
				});
			} else {
				void navigate({
					to: "/band/me",
					search: { tab: "account" },
				});
			}
		}
	};

	const handleCreateProfessionalProfile = () => {
		setOpenOnboardingsPending(true);
	};

	const handleTriggerClick = () => {
		setIsOpen(!isOpen);
	};

	const handleLogout = async () => {
		logout();

		await queryClient.resetQueries({
			queryKey: userKeys.all,
		});

		await navigate({ to: "/" });
	};

	return (
		<div ref={dropdownRef} className={cn("relative inline-block", className)}>
			<div
				role="button"
				tabIndex={0}
				aria-haspopup="menu"
				aria-expanded={isOpen}
				aria-label={`Trocar de perfil (atual: ${activeMusicalProduct?.nome ?? userData?.nome ?? ""})`}
				onClick={handleTriggerClick}
				onKeyDown={(event) => {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						handleTriggerClick();
					}
				}}
				className="flex items-center gap-1 sm:gap-3 p-1 sm:p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
			>
				<div className="hidden sm:flex flex-col">
					<span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
						{activeMusicalProduct?.nome ?? userData?.nome ?? ""}
					</span>
				</div>

				<Avatar
					src={activeMusicalProduct?.fotoPerfil ?? ""}
					alt={activeMusicalProduct?.nome ?? userData?.nome ?? ""}
					size={32}
				/>
				<ChevronDown
					className={cn(
						"h-4 w-4 text-gray-400 transition-transform duration-200",
						isOpen && "rotate-180"
					)}
				/>
			</div>

			{isOpen && (
				<div className="absolute z-50 right-0 mt-1 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border bg-white shadow-md">
					<div className="w-full">
						<div className="px-3 py-2">
							<p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
								Perfil de Contratante
							</p>
						</div>

						<button
							onClick={() => {
								handleProductSelect(null);
							}}
							className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors ${activeMusicalProduct ? "" : "bg-gray-100"}`}
						>
							<Avatar src={""} alt={userData?.nome ?? ""} size={24} />
							<span className="text-sm text-gray-700 truncate">
								{userData?.nome ?? "Usuário"}
							</span>
							{!activeMusicalProduct && (
								<Check className="h-4 w-4 text-primary-600 ml-auto" />
							)}
						</button>

						{/* Section Musical Products */}

						<div className="px-3 py-2">
							<p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
								Perfil Profissional
							</p>
							{/* The list loads 10 at a time as it scrolls; without this
							    nothing told there were more profiles below */}
							{totalProducts && totalProducts > musicalProducts.length ? (
								<p className="mt-0.5 text-xs text-gray-400">
									Mostrando {musicalProducts.length} de {totalProducts}
								</p>
							) : null}
						</div>

						<div
							ref={containerScrollRef}
							// 5 profiles (44px each) before scrolling; the old 150px showed 3½
							className="max-h-[220px] overflow-auto"
						>
							{musicalProducts.length > 0 ? (
								musicalProducts.map((product) => (
									<button
										key={product.id}
										onClick={() => {
											handleProductSelect(product);
										}}
										className={`w-full mb-1 flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors ${product.id === activeMusicalProduct?.id ? "bg-gray-100" : ""}`}
									>
										<Avatar
											src={product.fotoPerfil ?? ""}
											alt={product.nome}
											size={24}
										/>
										<span className="text-sm text-gray-700 truncate">
											{product.nome}
										</span>
										{product.id === activeMusicalProduct?.id && (
											<Check className="h-4 w-4 text-primary-600 ml-auto" />
										)}
									</button>
								))
							) : isLoading ? null : (
								<div className="flex justify-center my-2">
									<span className="text-xs text-center font-light text-gray-400">
										Nenhum cadastrado
									</span>
								</div>
							)}

							<div
								ref={sentinelRef}
								className={`${isLoading ? "h-10" : ""} flex justify-center items-center gap-2`}
							>
								{isLoading && (
									<>
										<Loader
											size={16}
											className="animate-spin text-primary-500"
										/>
										<span className="text-xs text-gray-500">
											Carregando mais perfis…
										</span>
									</>
								)}
							</div>
						</div>
					</div>

					<div className="p-1 border-t-[1px]">
						<button
							onClick={handleCreateProfessionalProfile}
							className="w-full rounded-sm text-left px-4 py-2 bg-primary-50 hover:bg-primary-100 transition-all duration-300 flex items-center gap-2 mb-1"
						>
							<div className="flex relative">
								<Music2Icon className="w-4 h-4" />

								<span className="absolute top-1 -right-1 flex items-center justify-center w-3 h-3 font-bold text-black rounded-full">
									<Plus strokeWidth={3} className="w-2 h-3" />
								</span>
							</div>
							<span>Criar Perfil Profissional</span>
						</button>

						<button
							onClick={handleLogout}
							className="w-full rounded-sm text-left px-4 py-2  flex items-center justify-center gap-2 bg-primary-700 text-white hover:bg-primary-700/90 transition-all duration-300"
						>
							<LogOut className="w-4 h-4" />
							<span>Sair</span>
						</button>
					</div>
				</div>
			)}

			<OnboardingsPedingModal
				isOpen={openOnboardingsPending}
				setIsOpen={setOpenOnboardingsPending}
				onboardingsPedingTable={{ data: onboardings ?? [] }}
				clickComeFrom="header-menu"
			/>
		</div>
	);
};
