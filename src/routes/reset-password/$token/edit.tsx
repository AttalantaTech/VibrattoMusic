import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * The old reset link (e-mails sent before 24/11/2026). The password is now
 * reset with a code: the link only opens the new page, to ask for one
 */
export const Route = createFileRoute("/reset-password/$token/edit")({
	beforeLoad: () => {
		// TanStack Router redirects by throwing redirect()
		// eslint-disable-next-line @typescript-eslint/only-throw-error
		throw redirect({ to: "/forgot-password", replace: true });
	},
});
