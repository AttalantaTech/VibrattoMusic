import z from "zod";

/** Longest BIO a profile can save */
export const BIO_MAX_LENGTH = 1000;

export const detailsSchema = z.object({
	nome: z.string().min(1, "Nome é obrigatório"),
	idCategoria: z.number().min(1, "Categoria é obrigatória"),
	descricao: z
		.string()
		.min(10, "Descrição deve ter pelo menos 10 caracteres")
		.max(BIO_MAX_LENGTH, `A BIO pode ter até ${BIO_MAX_LENGTH} caracteres`),
	podeDeslocamento: z.boolean().default(false),
	codigoMunicipio: z.number().min(1, "Cidade é obrigatória"),
	tipoEvento: z
		.array(z.number())
		.min(1, "Selecione pelo menos um tipo de evento"),
	generoMusical: z
		.array(z.number())
		.min(1, "Selecione pelo menos um gênero musical"),
	tipoProducao: z.array(z.number()).optional(),
	numeroIntegrantes: z.number().optional(),
});

export type DetailsFormData = z.infer<typeof detailsSchema>;
