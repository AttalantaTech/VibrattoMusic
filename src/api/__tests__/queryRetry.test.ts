import { describe, expect, it } from "vitest";
import { VibrattoApiError } from "../middleware/errorHandler";
import { retryUnlessNotFound } from "../queryRetry";

const apiError = (statusCode: number) =>
	new VibrattoApiError({
		code: "X",
		message: "Erro",
		statusCode,
		timestamp: new Date().toISOString(),
	});

// A deleted proposal/contract should show "not found" at once
describe("retryUnlessNotFound", () => {
	const retry = retryUnlessNotFound(2);

	it("gives up at once on a 404", () => {
		expect(retry(0, apiError(404))).toBe(false);
	});

	it("gives up at once when the proposal isn't found", () => {
		expect(retry(0, new Error("Proposal not found"))).toBe(false);
	});

	it("still retries other failures, up to the limit", () => {
		expect(retry(0, apiError(503))).toBe(true);
		expect(retry(1, apiError(503))).toBe(true);
		expect(retry(2, apiError(503))).toBe(false);
	});
});
