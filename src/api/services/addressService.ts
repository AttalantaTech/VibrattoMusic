export interface AddressData {
	cep: string;
	logradouro: string;
	bairro: string;
	cidade: string;
	estado: string;
	complemento?: string;
}

interface ViaCepResponse {
	cep: string;
	logradouro: string;
	bairro: string;
	localidade: string;
	uf: string;
	complemento?: string;
	erro?: boolean;
}

export class AddressService {
	public constructor() {}

	/**
	 * Get address data from CEP using ViaCEP API
	 */
	public async getAddressByCep(cep: string): Promise<AddressData> {
		const cleanCep = cep.replace(/\D/g, "");

		try {
			const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
			const data = (await response.json()) as ViaCepResponse;

			if (data.erro) {
				throw new Error("CEP não encontrado");
			}

			return {
				cep: data.cep,
				logradouro: data.logradouro,
				bairro: data.bairro,
				cidade: data.localidade,
				estado: data.uf,
				complemento: data.complemento || "",
			};
		} catch (error) {
			console.error("Error fetching address data:", error);
			throw new Error("Erro ao consultar CEP. Tente novamente.");
		}
	}
}

// Create singleton instance
export const addressService = new AddressService();
