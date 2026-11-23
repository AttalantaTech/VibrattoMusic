import { useState } from "react";
import type { AnyRouter } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";
import { TERM_CODES } from "../types";
import { useSignTerm, useTermStatus } from "../hooks/useTerm";
import { needsAcceptance } from "../utils/termStatus";
import { termErrorMessage } from "../utils/termError";
import { TermsDialog } from "./TermsDialog";

/**
 * Anyone logged in (client or professional) accepts the terms of use before
 * going on: right after the sign-up, at the next visit of who had an account
 * before the terms, and again at each new version. Rendered outside
 * RouterProvider (App.tsx), so it gets the router as a prop
 */
export const TermsOfUseGate = ({ router }: { router: AnyRouter }) => {
	const token = useAuthStore((state) => state.token);
	const userId = useAuthStore((state) => state.user?.id);
	const logout = useAuthStore((state) => state.logout);
	const [error, setError] = useState<string | null>(null);

	const code = TERM_CODES.use;
	const status = useTermStatus(code, userId, !!token);
	const sign = useSignTerm(code, userId);

	if (!token || !needsAcceptance(status.data)) return null;
	const { versao, texto = "" } = status.data;

	return (
		<TermsDialog
			isOpen
			code={code}
			version={versao}
			html={texto}
			isSigning={sign.isPending}
			error={error}
			isDismissible={false}
			secondaryLabel="Sair da conta"
			onSecondary={() => {
				setError(null);
				logout();
				void router.navigate({ to: "/login" });
			}}
			onAccept={() => {
				setError(null);
				sign.mutate(versao, {
					onError: (failure) => {
						setError(termErrorMessage(failure));
						// The version may have changed meanwhile: show the current one
						void status.refetch();
					},
				});
			}}
		/>
	);
};
