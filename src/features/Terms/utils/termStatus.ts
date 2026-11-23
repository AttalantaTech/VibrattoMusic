import type { TermStatus } from "../types";

/**
 * The person still has to accept: the term exists, isn't accepted and came
 * with the version to accept. A term without a version can't be signed, so
 * it doesn't block anyone
 */
export const needsAcceptance = (
	status: TermStatus | null | undefined
): status is TermStatus & { versao: number } =>
	!!status && !status.assinado && typeof status.versao === "number";
