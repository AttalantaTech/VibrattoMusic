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
	definirHorarioEvento: false,
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

// "Definir horário e duração": start time and duration required; no preset
describe("event time (availability check and proposal)", () => {
	it("without a defined time, neither field is required", () => {
		expect(errorsOf(check)).toEqual([]);
	});

	it("with a defined time, a missing duration is refused", () => {
		expect(
			errorsOf({ ...check, definirHorarioEvento: true, horaInicio: "20:00" })
		).toEqual(["duracao: Duração é obrigatória"]);
	});

	it("with a defined time, a missing start time is refused", () => {
		expect(
			errorsOf({ ...check, definirHorarioEvento: true, duracao: "02:00:00" })
		).toEqual(["horaInicio: Hora de início é obrigatória"]);
	});

	it("start time and duration picked: valid", () => {
		expect(
			errorsOf({
				...check,
				definirHorarioEvento: true,
				horaInicio: "20:00",
				duracao: "01:30:00",
			})
		).toEqual([]);
	});
});
