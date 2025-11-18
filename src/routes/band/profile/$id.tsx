import { createFileRoute } from "@tanstack/react-router";
import { PublicBandProfile } from "../../../pages/Band/PublicProfile";

export const Route = createFileRoute("/band/profile/$id")({
	component: PublicBandProfile,
	params: {
		parse: (parameters) => ({
			id: parameters.id, // Keep as string, convert to number in component
		}),
		stringify: ({ id }) => ({
			id: String(id),
		}),
	},
});
