import type { ContractModelSection } from "../types";

/**
 * DEMONSTRATION ONLY: Vibratto's base contract as in Cunha's prints
 * (17/11/2026), while production doesn't have it. The real one comes from
 * the API; this copy is never sent anywhere
 */
export const DEMO_BASE_SECTIONS: Array<ContractModelSection> = [
	{
		id: 1,
		numero: 0,
		titulo: "Introdução",
		texto:
			"Instrumento Particular de CONTRATO DE PRESTAÇÃO DE SERVIÇOS ARTÍSTICOS que entre si fazem, de um lado, [Contratante.Qualificacao], denominado(a) CONTRATANTE, e, do outro lado, [Contratada.Qualificacao], doravante denominada CONTRATADA, celebram o presente Contrato, nos seguintes termos:",
		editavel: false,
	},
	{
		id: 2,
		numero: 1,
		titulo: "CLÁUSULA PRIMEIRA - DO OBJETO",
		texto:
			"Constitui objeto do presente instrumento a contratação da banda [ProdutoMusical.Nome] para realização de apresentação artística, no dia [Proposta.DataInicio], no (a) [Proposta.Local], conforme as seguintes condições: [Proposta.HorarioEDuracao]",
		editavel: false,
	},
	{
		id: 3,
		numero: 2,
		titulo: "CLÁUSULA SEGUNDA - VALOR DO CONTRATO E FORMA DE PAGAMENTO",
		texto:
			"Pelos serviços ora ajustados, o CONTRATANTE pagará à CONTRATADA, [Proposta.CondicoesPagamento].",
		editavel: false,
	},
	{
		id: 4,
		numero: 3,
		titulo: "CLÁUSULA TERCEIRA - DOS ENCARGOS (IMPOSTOS)",
		texto:
			"1.1. Inexistente entre o CONTRATANTE e a CONTRATADA, qualquer vínculo de natureza trabalhista.\r\n1.2. Em todo caso de violação de quaisquer cláusulas desse contrato, a parte infratora, responderá na forma prevista no Código Civil, pelas perdas e danos que sofrer a outra parte, obrigando-se a ressarci-las das mesmas.",
		editavel: true,
	},
	{
		id: 5,
		numero: 4,
		titulo: "CLÁUSULA QUARTA - DAS OBRIGAÇÕES DO CONTRATANTE",
		texto:
			"1.1. Fornecer as bebidas (não alcoólicas) requisitadas pela banda durante a apresentação.\r\n1.2. Fornecer a alimentação para banda e seus acompanhantes, ao término da apresentação.\r\n1.3. O CONTRATANTE se compromete a pagar integralmente o valor estipulado na Cláusula Segunda deste instrumento legal pela prestação de serviços ora contratado, mesmo sem a apresentação da banda por motivo de falta de energia elétrica no local, fenômenos naturais ou demais inconveniências, sem culpa do contratado, que vieram atrapalhar a sua apresentação.\r\n1.4. Zelar pelos instrumentos musicais de propriedade da CONTRATADA, a partir do momento em que eles forem instalados no local da apresentação.\r\n1.5. O Contratante obriga-se a oferecer boas condições para melhor desempenho dos trabalhos, tais como: palco com cobertura e fechamento que comporte o equipamento, suprimento de energia elétrica suficiente para o equipamento, garantia que o trabalho não será perturbado, não se responsabilizando o contratado por danos pessoais e materiais causados por terceiros.\r\n1.6. Somente poderá permanecer no palco os componentes do grupo contratado, não sendo permitida, em hipótese alguma, a presença de estranhos ou de pessoas não autorizadas.",
		editavel: true,
	},
	{
		id: 6,
		numero: 5,
		titulo: "CLÁUSULA QUINTA - DIREITOS E OBRIGAÇÕES DO CONTRATADO",
		texto:
			"A CONTRATADA garante ao CONTRATANTE que estará presente para realização da apresentação no dia, horário e local determinado. Não caberá à contratada a devolução do valor pago pela ausência nas datas programadas, ocasionada por motivos de força maior ou caso fortuito: tempestades, desmoronamentos, catástrofes de qualquer outra natureza. Em caso de doença que venha atingir a contratada ou algum de seus representantes ou ausência por outro motivo, cabe a contratada a devolução do valor com acréscimo de multa de 50% do valor do contrato. A CONTRATADA fica autorizada a levar roadies e outras pessoas para o auxílio na montagem e desmontagem dos instrumentos e equipamentos de som.",
		editavel: true,
	},
	{
		id: 7,
		numero: 6,
		titulo: "CLÁUSULA SEXTA - DO FORO",
		texto:
			"Os contratantes elegem o foro da comarca de [ProdutoMusical.CidadeContato] para dirimir quaisquer conflitos porventura oriundos do presente instrumento.",
		editavel: true,
	},
	{
		id: 8,
		numero: 7,
		titulo: "CLÁUSULA RESPONSABILIDADES DO CONTRATANTE - CAMARIM",
		texto:
			"O CONTRATANTE se compromete a providenciar e custear a hospedagem/acomodação do CONTRATADO e de sua equipe, em condições adequadas de conforto e segurança, durante o período necessário à realização do evento, conforme previamente acordado entre as partes.",
		editavel: true,
	},
	{
		id: 9,
		numero: 8,
		titulo: "CLÁUSULA RESPONSABILIDADES DO CONTRATANTE - TRANSPORTE",
		texto:
			"O CONTRATANTE se responsabiliza por fornecer e custear o transporte necessário para o deslocamento do CONTRATADO e de sua equipe até o local do evento, bem como para o retorno ao ponto de origem ou destino previamente acordado entre as partes.",
		editavel: true,
	},
	{
		id: 10,
		numero: 9,
		titulo: "CLÁUSULA DE QUEBRA DE EQUIPAMENTOS",
		texto:
			"O CONTRATANTE se compromete a ressarcir o valor do seguro dos equipamentos em casa de briga ou falta de segurança com a banda.",
		editavel: true,
	},
	{
		id: 11,
		numero: 10,
		titulo: "Assinaturas",
		texto:
			"E, por estarem assim justas e contratadas, as partes assinam o presente instrumento digitalmente, em [ProdutoMusical.CidadeContato].\r\n\r\n______________________________________\r\nCONTRATANTE: [Contratante.Assinatura]\r\n\r\n\r\n______________________________________\r\nCONTRATADA: [Contratada.Assinatura]",
		editavel: false,
	},
];
