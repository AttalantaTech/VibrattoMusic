import { createFileRoute } from "@tanstack/react-router";
import { ProfileTypePage } from "../../pages/Band/ProfileType";
import { AuthGuard } from "../../components/auth/AuthGuard";

const ProtectedProfileType = () => (
	<AuthGuard>
		<ProfileTypePage />
	</AuthGuard>
);

export const Route = createFileRoute("/band/profile-type")({
	component: ProtectedProfileType,
});
