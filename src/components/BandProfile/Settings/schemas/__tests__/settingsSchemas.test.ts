import { describe, expect, it } from "vitest";
import {
	profileSettingsSchema,
	type ProfileSettingsFormData,
} from "../settingsSchemas";

const person: ProfileSettingsFormData = {
	nome: "Fernanda Duarte Nogueira",
	razaoSocial: "",
	celular: "(21) 99123-4567",
	tipoDocumento: "cpf",
	cpfOuCnpj: "390.533.447-05",
	nomeResponsavelLegal: "",
	cpfResponsavelLegal: "",
	cep: "20040-009",
	logradouro: "Avenida Rio Branco",
	numero: "156",
	complemento: "Loja 3",
	bairro: "Centro",
	cidade: "Rio de Janeiro",
	estado: "RJ",
};

const company: ProfileSettingsFormData = {
	...person,
	nome: "Bistrô da Praia",
	tipoDocumento: "cnpj",
	cpfOuCnpj: "45.321.876/0001-78",
	razaoSocial: "Maré Alta Gastronomia e Eventos LTDA",
	nomeResponsavelLegal: "Fernanda Duarte Nogueira",
	cpfResponsavelLegal: "390.533.447-05",
};

const errorsOf = (data: ProfileSettingsFormData) => {
	const result = profileSettingsSchema.safeParse(data);
	return result.success ? [] : result.error.issues.map((i) => i.path[0]);
};

// Settings: same rule as the sign-up, a company keeps both names
describe("profile settings form", () => {
	it("a person (CPF) needs no razão social", () => {
		expect(errorsOf(person)).toEqual([]);
	});

	it("a company (CNPJ) with razão social and nome fantasia is valid", () => {
		expect(errorsOf(company)).toEqual([]);
	});

	it("a company (CNPJ) without razão social is refused", () => {
		expect(errorsOf({ ...company, razaoSocial: " " })).toContain(
			"razaoSocial"
		);
	});

	it("the nome fantasia is still required", () => {
		expect(errorsOf({ ...company, nome: "" })).toContain("nome");
	});
});
