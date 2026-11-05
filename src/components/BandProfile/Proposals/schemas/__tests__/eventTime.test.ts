import { describe, expect, it } from "vitest";
import {
	checkAvailabilityValidationSchema,
	type CheckAvailabilityForm,
} from "../checkAvailability.schema";

const check: CheckAvailabilityForm = {
	idTipoEvento: 1,
	descricao: "",
	local: "Rio de Janeiro - RJ",
	dataEvento: "2026-12-12",
	horaInicio: "",
	duracao: "",
};

const errorsOf = (data: CheckAvailabilityForm) => {
	const result = checkAvailabilityValidationSchema.safeParse(data);
	return result.success
		? []
		: result.error.issues.map(
				(issue) => `${String(issue.path[0])}: ${issue.message}`
			);
};

// Availability check: the duration always (the band needs it to quote); the
// start time is optional
describe("event time (availability check)", () => {
	it("the duration is required", () => {
		expect(errorsOf(check)).toEqual(["duracao: Duração é obrigatória"]);
	});

	it("a duration without a start time is valid", () => {
		expect(errorsOf({ ...check, duracao: "03:00:00" })).toEqual([]);
	});

	it("a start time without a duration is refused", () => {
		expect(errorsOf({ ...check, horaInicio: "20:00" })).toEqual([
			"duracao: Duração é obrigatória",
		]);
	});

	it("start time and duration picked: valid", () => {
		expect(
			errorsOf({ ...check, horaInicio: "20:00", duracao: "01:30:00" })
		).toEqual([]);
	});
});
