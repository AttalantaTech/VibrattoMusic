import { VibrattoApiError } from "./middleware/errorHandler";

/** A missing record: asking again won't make it appear */
export const isNotFound = (error: unknown) =>
	(error instanceof VibrattoApiError && error.statusCode === 404) ||
	(error instanceof Error && error.message === "Proposal not found");

/**
 * React Query `retry` that gives up at once on "not found". A deleted
 * proposal or contract kept the page on "Carregando..." for ~7s while it
 * asked three more times before showing the error.
 */
export const retryUnlessNotFound =
	(maxRetries: number) => (failureCount: number, error: Error) =>
		!isNotFound(error) && failureCount < maxRetries;
