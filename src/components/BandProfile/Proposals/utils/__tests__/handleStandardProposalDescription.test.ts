import { describe, expect, it } from "vitest";
import {
	handleStandardProposalDescription,
	proposalLegalParty,
} from "../handleStandardProposalDescription";

const personUser = {
	nome: "Danilo Palma",
	cpfOuCnpj: "37451186857",
	nomeResponsavelLegal: null,
	cpfResponsavelLegal: null,
};
const companyUser = {
	nome: "Produtora XYZ",
	cpfOuCnpj: "11222333000181",
	nomeResponsavelLegal: "Maria Souza",
	cpfResponsavelLegal: "52998224725",
};
const cpfProfile = { usaCnpj: false, cnpj: null, razaoSocial: null };

// "neste ato representada por …, inscrita no CPF/CNPJ …"
describe("proposalLegalParty", () => {
	it("a CPF profile of a person answers with the person's name and CPF", () => {
		expect(
			proposalLegalParty({ product: cpfProfile, user: personUser })
		).toEqual({ legalName: "Danilo Palma", document: "37451186857" });
	});

	it("a CPF profile of a company account answers with its legal representative", () => {
		expect(
			proposalLegalParty({ product: cpfProfile, user: companyUser })
		).toEqual({ legalName: "Maria Souza", document: "52998224725" });
	});

	it("a CNPJ profile answers as the company", () => {
		expect(
			proposalLegalParty({
				product: {
					usaCnpj: true,
					cnpj: "11222333000181",
					razaoSocial: "Banda Ltda",
				},
				user: personUser,
			})
		).toEqual({ legalName: "Banda Ltda", document: "11222333000181" });
	});

	it("shows a dash only when the data really is missing", () => {
		expect(proposalLegalParty({ product: cpfProfile, user: null })).toEqual({
			legalName: "-",
			document: "-",
		});
	});
});

describe("handleStandardProposalDescription", () => {
	it("writes the person and the formatted CPF in the text", () => {
		const text = handleStandardProposalDescription({
			category: "DJ",
			artisticName: "DJ Danilo",
			...proposalLegalParty({ product: cpfProfile, user: personUser }),
		});

		expect(text).toBe(
			"Conforme solicitação, segue proposta orçamentária para contratação da apresentação artística da(o) DJ - DJ Danilo, neste ato representada por Danilo Palma, inscrita no CPF/CNPJ 374.511.868-57"
		);
		expect(text).not.toContain("representada por -");
	});
});
