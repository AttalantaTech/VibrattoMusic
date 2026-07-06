import { createFileRoute } from "@tanstack/react-router";
import { BandProfile } from "../../pages/Band/Profile";
import { AuthGuard } from "../../components/auth/AuthGuard";
import { z } from "zod";

const bandProfileSearchSchema = z.object({
	tab: z
		.enum([
			"account",
			"bookings",
			"messages",
			"sales",
			"hires",
			"proposals",
			"contracts",
			"checklist",
			"favorites",
			"settings",
		])
		.optional()
		.default("messages"), // Changed default to messages
});

const ProtectedBandProfile = () => (
	<AuthGuard>
		<BandProfile />
	</AuthGuard>
);

export const Route = createFileRoute("/band/me")({
	component: ProtectedBandProfile,
	validateSearch: bandProfileSearchSchema,
});
