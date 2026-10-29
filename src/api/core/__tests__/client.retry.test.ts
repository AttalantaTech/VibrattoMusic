import { describe, expect, it, vi } from "vitest";
import { AxiosError, type AxiosAdapter, type AxiosResponse } from "axios";

vi.mock("../../../services/tokenRefreshService", () => ({
	tokenRefreshService: {
		shouldRefreshBeforeRequest: () => false,
		refreshToken: vi.fn(),
	},
}));

import { ApiClient, isSafeMethod } from "../client";

/** A server that always fails with `status`, counting what reaches it */
const failingServer = (status: number) => {
	const calls: Array<string> = [];
	const adapter: AxiosAdapter = (config) => {
		calls.push(`${config.method?.toUpperCase()} ${config.url}`);
		const response = {
			status,
			statusText: "Error",
			data: {},
			headers: {},
			config,
		} as AxiosResponse;
		return Promise.reject(
			new AxiosError("Server error", "ERR_BAD_RESPONSE", config, null, response)
		);
	};
	return { adapter, calls };
};

/** Client with no wait between attempts, talking to the fake server */
const clientFor = (adapter: AxiosAdapter) => {
	const client = new ApiClient("https://api.test/", 3, 0);
	(
		client as unknown as { api: { defaults: { adapter: AxiosAdapter } } }
	).api.defaults.adapter = adapter;
	return client;
};

// When the server fails, only reads are sent again. A write may have been
// applied even though its response failed, so sending it again duplicates it
describe("API client retries", () => {
	it("sends a proposal (POST) only once when the server answers 500", async () => {
		const server = failingServer(500);

		await expect(
			clientFor(server.adapter).post("produtomusical/1/proposta", {})
		).rejects.toBeTruthy();

		expect(server.calls).toEqual(["POST produtomusical/1/proposta"]);
	});

	it.each(["put", "patch", "delete"] as const)(
		"doesn't resend %s either",
		async (method) => {
			const server = failingServer(503);
			const client = clientFor(server.adapter);

			await expect(
				method === "delete"
					? client.delete("recurso/1")
					: client[method]("recurso/1", {})
			).rejects.toBeTruthy();

			expect(server.calls).toHaveLength(1);
		}
	);

	it("still retries a read (GET) up to 3 more times", async () => {
		const server = failingServer(500);

		await expect(
			clientFor(server.adapter).get("produtomusical/listarPropostas-get")
		).rejects.toBeTruthy();

		expect(server.calls).toHaveLength(4);
	});

	it("doesn't retry errors that won't change (e.g. 400)", async () => {
		const server = failingServer(400);

		await expect(
			clientFor(server.adapter).get("recurso/validacao")
		).rejects.toBeTruthy();

		expect(server.calls).toHaveLength(1);
	});
});

describe("isSafeMethod", () => {
	it.each(["get", "GET", "head", "options", undefined])(
		"%s only reads",
		(m) => {
			expect(isSafeMethod(m)).toBe(true);
		}
	);

	it.each(["post", "put", "patch", "delete"])("%s changes data", (m) => {
		expect(isSafeMethod(m)).toBe(false);
	});
});
