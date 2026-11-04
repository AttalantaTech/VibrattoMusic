import { describe, expect, it } from "vitest";
import { registerSchema, type RegisterFormData } from "../registerSchema";

const base: RegisterFormData = {
	email: "contato@bistrodapraia.com.br",
	nome: "Bistrô da Praia",
	razaoSocial: "",
	tipoDocumento: "cpf",
	cpfOuCnpj: "390.533.447-05",
	nomeResponsavelLegal: "",
	cpfResponsavelLegal: "",
	celular: "(21) 99123-4567",
	cep: "20040-009",
	logradouro: "Avenida Rio Branco",
	numero: "156",
	bairro: "Centro",
	cidade: "Rio de Janeiro",
	estado: "RJ",
	complemento: "Loja 3",
	senha: "Vibr@tto#2026x",
	confirmarSenha: "Vibr@tto#2026x",
};

const company: RegisterFormData = {
	...base,
	tipoDocumento: "cnpj",
	cpfOuCnpj: "45.321.876/0001-78",
	razaoSocial: "Maré Alta Gastronomia e Eventos LTDA",
	nomeResponsavelLegal: "Fernanda Duarte Nogueira",
	cpfResponsavelLegal: "390.533.447-05",
};

const errorsOf = (data: RegisterFormData) => {
	const result = registerSchema.safeParse(data);
	return result.success ? [] : result.error.issues.map((i) => i.path[0]);
};

// Sign-up: a company (CNPJ) gives its legal name and its trade name
describe("register form", () => {
	it("a person (CPF) needs no razão social", () => {
		expect(errorsOf(base)).toEqual([]);
	});

	it("a company (CNPJ) with razão social and nome fantasia is valid", () => {
		expect(errorsOf(company)).toEqual([]);
	});

	it("a company (CNPJ) without razão social is refused", () => {
		expect(errorsOf({ ...company, razaoSocial: "  " })).toContain(
			"razaoSocial"
		);
	});

	it("the nome fantasia is still required", () => {
		expect(errorsOf({ ...company, nome: "" })).toContain("nome");
	});
});
