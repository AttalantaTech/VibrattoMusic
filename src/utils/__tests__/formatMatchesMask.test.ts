import { IMask } from "react-imask";
import { describe, expect, it } from "vitest";
import {
	CEP_MASK,
	CNPJ_MASK,
	CPF_MASK,
	PHONE_MASK,
	formatCep,
	formatCpf,
	formatDocument,
	formatPhone,
} from "../validation";

// The settings form loads API values through these formatters. If the
// input's mask rewrites them, the form looks "changed" before any edit and
// "Salvar Alterações" turns on by itself
const throughMask = (value: string, mask: unknown) =>
	IMask.pipe(value, { mask } as Parameters<typeof IMask.pipe>[1]);

describe("formatters match the input masks", () => {
	it("phone", () => {
		const phone = formatPhone("19997766709");
		expect(phone).toBe("(19) 99776-6709");
		expect(throughMask(phone, PHONE_MASK)).toBe(phone);
	});

	it("CEP", () => {
		const cep = formatCep("13277151");
		expect(throughMask(cep, CEP_MASK)).toBe(cep);
	});

	it("CPF", () => {
		const cpf = formatCpf("39053344705");
		expect(throughMask(cpf, CPF_MASK)).toBe(cpf);
	});

	it("CNPJ, letters included", () => {
		const cnpj = formatDocument("AB321876000178");
		expect(throughMask(cnpj, CNPJ_MASK)).toBe(cnpj);
	});
});
