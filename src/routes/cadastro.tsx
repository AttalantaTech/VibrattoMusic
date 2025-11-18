import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cadastro")({
	beforeLoad: () => {
		// Redirect to welcome page as the first step
		throw redirect({
			to: "/welcome",
			replace: true,
		});
	},
});