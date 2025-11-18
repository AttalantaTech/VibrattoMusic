import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { BandRegister } from "../../pages/Band/Register";
import { AuthGuard } from "../../components/auth/AuthGuard";

const ProtectedBandRegister = () => {
	const location = useLocation();
	const isOnboardingRoute = location.pathname.includes("/onboarding/");

	return (
		<AuthGuard>
			{!isOnboardingRoute && <BandRegister />}
			<Outlet />
		</AuthGuard>
	);
};

export const Route = createFileRoute("/band/register")({
	component: ProtectedBandRegister,
});
