import z from "zod";

export const mediaSchema = z.object({
	videosYouTube: z.array(z.string().url("URL inválida")).optional(),
	spotifyPlaylistId: z.string().optional(),
	exibirValorServico: z.boolean(),
	valorServico: z.string().nullable(),
	redeSocial: z
		.array(
			z
				.object({
					idRedeSocial: z.number(),
					link: z
						.string()
						.min(1, "O campo é obrigatório caso esteja visível")
						.optional(),
					idProdutoMusical: z.number(),
					nomeRedeSocial: z.string(),
					baseUrl: z.string(),
				})
				.optional()
		)
		.optional(),
	imagensCarrossel: z
		.array(
			z.object({
				id: z.number().nullable(),
				link: z.string(),
				legenda: z.string(),
			})
		)
		.optional(),
});
