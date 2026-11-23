import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTermStatus, signTerm } from "@/api/services/termsService";
import type { TermCode, TermStatus } from "../types";

export const termKeys = {
	status: (code: TermCode, userId: number | undefined) =>
		["terms", code, userId] as const,
};

/** Whether the logged person accepted the current version of the term */
export const useTermStatus = (
	code: TermCode,
	userId: number | undefined,
	enabled: boolean
) =>
	useQuery({
		queryKey: termKeys.status(code, userId),
		queryFn: () => getTermStatus(code),
		enabled,
		staleTime: 5 * 60 * 1000,
		retry: false,
	});

/** Accepts the version shown; the status becomes "accepted" right away */
export const useSignTerm = (code: TermCode, userId: number | undefined) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (versao: number) => signTerm(code, versao),
		onSuccess: () => {
			queryClient.setQueryData<TermStatus>(termKeys.status(code, userId), {
				assinado: true,
			});
		},
	});
};
