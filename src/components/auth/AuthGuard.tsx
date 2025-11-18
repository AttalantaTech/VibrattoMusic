import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuthStore } from "../../store/authStore";
import { LoadingSpinner } from "../ui/LoadingSpinner/LoadingSpinner";

interface AuthGuardProps {
	children: React.ReactNode;
	redirectTo?: string;
}

export const AuthGuard = ({
	children,
	redirectTo = "/login",
}: AuthGuardProps) => {
	const { isAuthenticated } = useAuthStore();
	const router = useRouter();
	useEffect(() => {
		if (!isAuthenticated) {
			const navigate = async () => {
				try {
					await router.navigate({ to: redirectTo });
				} catch (error) {
					console.error("❌ AuthGuard navigation error:", error);
				}
			};
			navigate().catch(console.error);
		}
	}, [isAuthenticated, router, redirectTo]);

	if (!isAuthenticated) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	return <>{children}</>;
};
