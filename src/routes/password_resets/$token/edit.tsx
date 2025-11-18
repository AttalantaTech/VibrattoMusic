import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/password_resets/$token/edit")({
	beforeLoad: ({ params }) => {
		// Extract token from path parameter and redirect to reset-password with query parameter
		throw redirect({
			to: "/reset-password",
			search: {
				token: params.token,
			},
		});
	},
});