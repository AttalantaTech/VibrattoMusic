import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, Trash2, Save, FileText } from "lucide-react";
import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { Textarea } from "../../components/ui/Textarea/Textarea";
import { MainLayout } from "../../components/layout/MainLayout/MainLayout";
import { useActiveMusicalProduct } from "../../hooks/useActiveMusicalProduct";
import { useUpdateContractSections } from "../../hooks/useContracts";
import { toast } from "sonner";
import type { ContractSectionUpdateRequest } from "../../api/types";

interface ContractSection {
	numero: number;
	titulo: string;
	texto: string;
}

const defaultSections: Array<ContractSection> = [
	{
		numero: 0,
		titulo: "Introdução",
		texto:
			"Instrumento Particular de CONTRATO DE PRESTAÇÃO DE SERVIÇOS ARTÍSTICOS que entre si fazem, de um lado, [NOME DO CONTRATANTE], inscrito (a) no CPF sob o nº [CPF DO CONTRATANTE], residente e domiciliado na [ENDEREÇO COMPLETO DO CONTRATANTE], bairro [BAIRRO], [CIDADE DO CONTRATANTE]-[UF], denominado CONTRATANTE e, do outro lado, [NOME DA BANDA], neste ato representada por [NOME DA EMPRESA], inscrita no CNPJ sob o nº [CNPJ DA EMPRESA], com sede na [ENDEREÇO DA EMPRESA], CEP: [CEP DA EMPRESA], doravante denominada CONTRATADA, celebram o presente Contrato, nos seguintes termos:",
	},
	{
		numero: 1,
		titulo: "CLÁUSULA PRIMEIRA – DO OBJETO",
		texto:
			"Constitui objeto do presente instrumento a contratação da banda [NOME DA BANDA] para realização de apresentação artística, no dia [DATA DO EVENTO], no (a) [LOCAL DO EVENTO], conforme as seguintes condições: O show acontecerá na data acima mencionada com duração de [DURAÇÃO DO SHOW] horas ininterruptas.",
	},
	{
		numero: 2,
		titulo: "CLÁUSULA SEGUNDA – VALOR DO CONTRATO E FORMA DE PAGAMENTO",
		texto:
			"Pelos serviços ora ajustados, o CONTRATANTE pagará à CONTRATADA, o valor de R$ [VALOR TOTAL],00 ([VALOR POR EXTENSO]) em [NÚMERO DE PARCELAS] parcelas, sendo a primeira no valor de R$ [VALOR DA PRIMEIRA PARCELA],00 ([VALOR POR EXTENSO]) até [DATA DO VENCIMENTO DA PRIMEIRA PARCELA] e a segunda e última parcela no valor de R$ [VALOR DA ÚLTIMA PARCELA],00 ([VALOR POR EXTENSO]) até a data do evento antes do início da apresentação.",
	},
	{
		numero: 3,
		titulo: "CLÁUSULA TERCEIRA – DOS ENCARGOS",
		texto:
			"3.1. Inexistente entre o CONTRATANTE e a CONTRATADA, qualquer vínculo de natureza trabalhista.\r\n3.2. Em todo caso de violação de quaisquer cláusulas desse contrato, a parte infratora, responderá na forma prevista no Código Civil, pelas perdas e danos que sofrer a outra parte, obrigando-se a ressarci-las das mesmas.",
	},
	{
		numero: 4,
		titulo: "CLÁUSULA QUARTA – DAS OBRIGAÇÕES DO CONTRATANTE",
		texto:
			"4.1. Fornecer as bebidas (não alcoólicas) requisitadas pela banda durante a apresentação.\r\n4.2. Fornecer a alimentação para banda e seus acompanhantes, ao término da apresentação.\r\n4.3. O CONTRATANTE se compromete a pagar integralmente o valor estipulado na Cláusula Segunda deste instrumento legal pela prestação de serviços ora contratado, mesmo sem a apresentação da banda por motivo de falta de energia elétrica no local, fenômenos naturais ou demais inconveniências, sem culpa do contratado, que vieram atrapalhar a sua apresentação.\r\n4.4. Zelar pelos instrumentos musicais de propriedade da CONTRATADA, a partir do momento em que eles forem instalados no local da apresentação.\r\n4.5. O Contratante obriga-se a oferecer boas condições para melhor desempenho dos trabalhos, tais como: palco com cobertura e fechamento que comporte o equipamento, suprimento de energia elétrica suficiente para o equipamento, garantia que o trabalho não será perturbado, não se responsabilizando o contratado por danos pessoais e materiais causados por terceiros.\r\n4.6. Somente poderá permanecer no palco os componentes do grupo contratado, não sendo permitida, em hipótese alguma, a presença de estranhos ou de pessoas não autorizadas.",
	},
	{
		numero: 5,
		titulo: "CLÁUSULA QUINTA – DIREITOS E OBRIGAÇÕES DO CONTRATADO",
		texto:
			"A CONTRATADA garante ao CONTRATANTE que estará presente para realização da apresentação no dia, horário e local determinado. Não caberá à contratada a devolução do valor pago pela ausência nas datas programadas, ocasionada por motivos de força maior ou caso fortuito: tempestades, desmoronamentos, catástrofes de qualquer outra natureza. Em caso de doença que venha atingir a contratada ou algum de seus representantes ou ausência por outro motivo, cabe a contratada a devolução do valor com acréscimo de multa de 50% do valor do contrato. A CONTRATADA fica autorizada a levar roadies e outras pessoas para o auxílio na montagem e desmontagem dos instrumentos e equipamentos de som.",
	},
	{
		numero: 6,
		titulo: "CLÁUSULA SEXTA – DO FORO",
		texto:
			"Os contratantes elegem o foro da comarca de [CIDADE DO FORO] para dirimir quaisquer conflitos porventura oriundos do presente instrumento.",
	},
	{
		numero: 7,
		titulo: "CLÁUSULA SÉTIMA – RESPONSABILIDADES DO CONTRATANTE – CAMARIM",
		texto:
			"O CONTRATANTE se compromete a providenciar e custear a hospedagem/acomodação do CONTRATADO e de sua equipe, em condições adequadas de conforto e segurança, durante o período necessário à realização do evento, conforme previamente acordado entre as partes.",
	},
	{
		numero: 8,
		titulo: "CLÁUSULA OITAVA – RESPONSABILIDADES DO CONTRATANTE – TRANSPORTE",
		texto:
			"O CONTRATANTE se responsabiliza por fornecer e custear o transporte necessário para o deslocamento do CONTRATADO e de sua equipe até o local do evento, bem como para o retorno ao ponto de origem ou destino previamente acordado entre as partes.",
	},
	{
		numero: 9,
		titulo: "CLÁUSULA NONA – RESPONSABILIDADES DO CONTRATANTE – ACOMODAÇÃO",
		texto:
			"O CONTRATANTE se compromete a providenciar e custear a hospedagem/acomodação do CONTRATADO e de sua equipe, em condições adequadas de conforto e segurança, durante o período necessário à realização do evento, conforme previamente acordado entre as partes.",
	},
	{
		numero: 10,
		titulo: "CLÁUSULA DÉCIMA – ASSINATURAS",
		texto:
			"E, por estarem assim justas e contratadas, as partes assinam o presente instrumento digitalmente, em [CIDADE DA ASSINATURA], na data de [DATA DA ASSINATURA].\r\n\r\n_________________________________________\r\nCONTRATANTE: [NOME DO CONTRATANTE]\r\nCPF/CNPJ: [CPF/CNPJ DO CONTRATANTE]\r\n\r\n\r\n_________________________________________\r\nCONTRATADA: [NOME DA BANDA]\r\nCNPJ: [CNPJ DA EMPRESA]",
	},
];

export const ContractCreate = () => {
	const navigate = useNavigate();
	const { activeProduct } = useActiveMusicalProduct();
	const updateSections = useUpdateContractSections();

	const [sections, setSections] =
		useState<Array<ContractSection>>(defaultSections);
	const [isSaving, setIsSaving] = useState(false);

	const handleAddSection = () => {
		const newSection: ContractSection = {
			numero: sections.length,
			titulo: `Nova Seção ${sections.length + 1}`,
			texto: "",
		};
		setSections([...sections, newSection]);
	};

	const handleRemoveSection = (index: number) => {
		const updated = sections.filter(
			(_, currentIndex) => currentIndex !== index
		);
		// Renumber sections
		const renumbered = updated.map((section, currentIndex) => ({
			...section,
			numero: currentIndex,
		}));
		setSections(renumbered);
	};

	const handleUpdateSection = (
		index: number,
		field: "titulo" | "texto",
		value: string
	) => {
		const updated = [...sections];
		if (updated[index]) {
			updated[index] = {
				numero: updated[index].numero,
				titulo: field === "titulo" ? value : updated[index].titulo,
				texto: field === "texto" ? value : updated[index].texto,
			};
			setSections(updated);
		}
	};

	const handleSave = async () => {
		if (!activeProduct) {
			toast.error("Nenhuma banda selecionada");
			return;
		}

		// Validate that all sections have titles and text
		const invalidSections = sections.filter(
			(s) => !s.titulo.trim() || !s.texto.trim()
		);
		if (invalidSections.length > 0) {
			toast.error("Todas as seções devem ter título e texto");
			return;
		}

		setIsSaving(true);

		try {
			// Convert to the format expected by the API
			const apiSections: Array<ContractSectionUpdateRequest> = sections.map(
				(s) => ({
					numero: s.numero,
					titulo: s.titulo,
					texto: s.texto,
				})
			);

			await updateSections.mutateAsync({
				identificadorUnico: String(activeProduct.id),
				sections: apiSections,
			});

			toast.success("Contrato criado com sucesso!");
			void navigate({ to: "/band/me", search: { tab: "contracts" } });
		} catch (error) {
			console.error("Error saving contract:", error);
			toast.error("Erro ao salvar contrato. Tente novamente.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => {
		void navigate({ to: "/band/me", search: { tab: "contracts" } });
	};

	if (!activeProduct) {
		return (
			<MainLayout>
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							Nenhuma Banda Selecionada
						</h3>
						<p className="text-gray-600 mb-4">
							Selecione uma banda para criar um contrato
						</p>
						<Button onClick={handleCancel}>Voltar</Button>
					</div>
				</div>
			</MainLayout>
		);
	}

	return (
		<MainLayout>
			<div className="w-full max-w-5xl mx-auto p-6">
				{/* Header */}
				<div className="mb-8">
					<Button
						variant="outline"
						onClick={handleCancel}
						className="mb-4 -ml-2"
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar para Contratos
					</Button>

					<div className="flex justify-between items-start">
						<div>
							<h1 className="text-3xl font-bold text-gray-900 mb-2">
								Criar Modelo de Contrato
							</h1>
							<p className="text-gray-600">
								Crie um modelo de contrato padrão para{" "}
								<span className="font-semibold">{activeProduct.nome}</span>
							</p>
						</div>

						<div className="flex gap-3">
							<Button variant="outline" onClick={handleCancel}>
								Cancelar
							</Button>
							<Button
								onClick={handleSave}
								disabled={isSaving}
								className="flex items-center gap-2"
							>
								<Save className="h-4 w-4" />
								{isSaving ? "Salvando..." : "Salvar Contrato"}
							</Button>
						</div>
					</div>
				</div>

				{/* Sections */}
				<div className="space-y-6">
					{sections.map((section, index) => (
						<div
							key={section.numero}
							className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
						>
							<div className="flex justify-between items-start mb-4">
								<h3 className="text-sm font-semibold text-gray-500">
									Seção {section.numero + 1}
								</h3>
								{sections.length > 1 && (
									<Button
										variant="transparent"
										size="sm"
										onClick={() => {
											handleRemoveSection(index);
										}}
										className="text-red-600 hover:text-red-700 hover:bg-red-50"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
							</div>

							<div className="space-y-4">
								<div>
									<label
										htmlFor={`titulo-${index}`}
										className="block text-sm font-medium text-gray-700 mb-2"
									>
										Título da Seção
									</label>
									<Input
										id={`titulo-${index}`}
										value={section.titulo}
										onChange={(event) => {
											handleUpdateSection(index, "titulo", event.target.value);
										}}
										placeholder="Ex: CLÁUSULA PRIMEIRA - DO OBJETO"
										className="w-full"
									/>
								</div>

								<div>
									<label
										htmlFor={`texto-${index}`}
										className="block text-sm font-medium text-gray-700 mb-2"
									>
										Conteúdo
									</label>
									<Textarea
										id={`texto-${index}`}
										value={section.texto}
										onChange={(event) => {
											handleUpdateSection(index, "texto", event.target.value);
										}}
										placeholder="Digite o conteúdo desta seção do contrato..."
										rows={6}
										className="w-full font-mono text-sm"
									/>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Add Section Button */}
				<div className="mt-6">
					<Button
						variant="outline"
						onClick={handleAddSection}
						className="w-full flex items-center justify-center gap-2 border-dashed"
					>
						<Plus className="h-4 w-4" />
						Adicionar Nova Seção
					</Button>
				</div>

				{/* Bottom Actions */}
				<div className="flex justify-end gap-3 mt-8 pt-6 border-t">
					<Button variant="outline" onClick={handleCancel}>
						Cancelar
					</Button>
					<Button
						onClick={handleSave}
						disabled={isSaving}
						className="flex items-center gap-2"
					>
						<Save className="h-4 w-4" />
						{isSaving ? "Salvando..." : "Salvar Contrato"}
					</Button>
				</div>
			</div>
		</MainLayout>
	);
};
