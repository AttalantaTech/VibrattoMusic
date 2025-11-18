import { z } from 'zod';

// Contract section schema
export const contractSectionSchema = z.object({
	numero: z.number().min(1, 'Número da seção deve ser maior que 0'),
	titulo: z
		.string()
		.min(1, 'Título é obrigatório')
		.max(200, 'Título deve ter no máximo 200 caracteres'),
	texto: z
		.string()
		.min(10, 'Texto deve ter pelo menos 10 caracteres')
		.max(10000, 'Texto deve ter no máximo 10.000 caracteres'),
});

// Contract section update request schema
export const contractSectionUpdateSchema = z.object({
	numero: z.number().min(1),
	titulo: z.string().min(1).max(200),
	texto: z.string().min(10).max(10000),
});

// Contract update request schema (array of sections)
export const contractUpdateSchema = z.object({
	SecoesContrato: z
		.array(contractSectionUpdateSchema)
		.min(1, 'Pelo menos uma seção deve ser fornecida')
		.max(20, 'No máximo 20 seções são permitidas'),
});

// Proposal rejection schema
export const proposalRejectionSchema = z.object({
	IdMotivoRejeicao: z
		.number()
		.min(1, 'Motivo de rejeição é obrigatório')
		.max(999, 'ID de motivo inválido'),
});

// Contract filter schema
export const contractFilterSchema = z.object({
	id: z.number().optional(),
	status: z
		.enum(['rascunho', 'assinatura_pendente', 'ativo', 'concluido', 'cancelado'])
		.optional(),
	dataInicio: z.string().optional(),
	dataFim: z.string().optional(),
	valorMinimo: z.number().min(0).optional(),
	valorMaximo: z.number().min(0).optional(),
});

// Contract search schema
export const contractSearchSchema = z.object({
	termo: z
		.string()
		.min(2, 'Termo de busca deve ter pelo menos 2 caracteres')
		.max(100, 'Termo de busca deve ter no máximo 100 caracteres'),
	limite: z
		.number()
		.min(1, 'Limite deve ser pelo menos 1')
		.max(100, 'Limite deve ser no máximo 100')
		.default(50),
});

// Type exports for TypeScript inference
export type ContractSectionInput = z.infer<typeof contractSectionSchema>;
export type ContractSectionUpdateInput = z.infer<typeof contractSectionUpdateSchema>;
export type ContractUpdateInput = z.infer<typeof contractUpdateSchema>;
export type ProposalRejectionInput = z.infer<typeof proposalRejectionSchema>;
export type ContractFilterInput = z.infer<typeof contractFilterSchema>;
export type ContractSearchInput = z.infer<typeof contractSearchSchema>;

