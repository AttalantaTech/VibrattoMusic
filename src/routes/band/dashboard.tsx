import { createFileRoute } from "@tanstack/react-router";
import { BandProfile } from "../../pages/Band/Profile";
import { AuthGuard } from "../../components/auth/AuthGuard";

const ProtectedBandProfile = () => (
	<AuthGuard>
		<BandProfile />
	</AuthGuard>
);

export const Route = createFileRoute("/band/dashboard")({
	component: ProtectedBandProfile,
});
