import type {
	MusicalProductApiResponse,
	OnboardingApiResponse,
} from "@/api/types";
import { useOnboarding } from "@/contexts/hooks/useOnboarding";
import { useUpdateMusicalProduct } from "@/hooks/useMusicalProducts";
import { useSaveOnboardingContact } from "@/hooks/useOnboarding";
import { useAuthStore } from "@/store/authStore";
import { encryptValue } from "@/utils/encryptValue";
import type {
	ContactFormData,
	OnboardingContactData,
} from "@/utils/validation";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

interface UseContactStepSubmit {
	setLoading: (value: boolean) => void;
	musicalProduct: OnboardingApiResponse | MusicalProductApiResponse | null;
}

export function useContactStepSubmit({
	setLoading,
	musicalProduct,
}: UseContactStepSubmit) {
	const navigate = useNavigate();
	const { markStepComplete } = useOnboarding();
	const saveOnboardingContactMutation = useSaveOnboardingContact();
	const updateMusicalProductMutation = useUpdateMusicalProduct();

	const { user } = useAuthStore();

	const onSubmitOnboarding = async (data: ContactFormData) => {
		setLoading(true);
		try {
			// Remove non-digit characters from telefone and ensure only 11 digits
			const cleanedTelefone = (data.telefone || "")
				.replace(/\D/g, "")
				.slice(0, 11);

			// Clean CEP to remove mask (only digits)
			const cleanedCep = (data.cepContato || "").replace(/\D/g, "");

			// Remove email field since it's not collected in this form, but add user's email
			const { usaCnpj, ...contactData } = data;

			const legalEntity = {
				cnpj: usaCnpj
					? contactData?.cnpj
						? contactData.cnpj.replace(/\D/g, "")
						: null
					: null,
				razaoSocial: usaCnpj ? contactData?.razaoSocial : null,
				nomeFantasia: usaCnpj ? contactData?.nomeFantasia : null,
				cpfResponsavelLegal: usaCnpj
					? contactData?.cpfResponsavelLegal
						? contactData.cpfResponsavelLegal.replace(/\D/g, "")
						: null
					: null,
				nomeResponsavelLegal: usaCnpj
					? contactData?.nomeResponsavelLegal
					: null,
			};

			const naturalPerson = {
				cpf: !usaCnpj
					? contactData?.cpf
						? contactData.cpf.replace(/\D/g, "")
						: null
					: null,
				nome: !usaCnpj ? contactData?.nome : null,
			};

			const payload: OnboardingContactData = {
				id: musicalProduct?.id ?? 0,

				...contactData,

				usaCnpj,
				...legalEntity,
				...naturalPerson,

				telefone: cleanedTelefone,
				cepContato: cleanedCep,
				email: user?.email || "",
			};

			await saveOnboardingContactMutation.mutateAsync(payload);

			markStepComplete("1");

			toast.success("Informações de contato salvas com sucesso");

			// Navigate to next step
			const search = musicalProduct?.id
				? {
						registerId: encryptValue(musicalProduct.id.toString()),
					}
				: {};

			await navigate({
				to: "/band/register/onboarding/2",
				search,
			});
		} catch (error: unknown) {
			console.error("Error saving contact data:", error);
			toast.error("Erro ao salvar informações de contato");
		} finally {
			setLoading(false);
		}
	};

	const onSubmitProfileUpdate = async (data: ContactFormData) => {
		setLoading(true);
		try {
			// Remove non-digit characters from telefone and ensure only 11 digits
			const cleanedTelefone = (data.telefone || "")
				.replace(/\D/g, "")
				.slice(0, 11);

			// Clean CEP to remove mask (only digits)
			const cleanedCep = (data.cepContato || "").replace(/\D/g, "");

			// Remove email field since it's not collected in this form, but add user's email
			const { usaCnpj, ...contactData } = data;

			const legalEntity = {
				cnpj: usaCnpj
					? contactData?.cnpj
						? contactData.cnpj.replace(/\D/g, "")
						: null
					: null,
				razaoSocial: usaCnpj ? contactData?.razaoSocial : null,
				nomeFantasia: usaCnpj ? contactData?.nomeFantasia : null,
				cpfResponsavelLegal: usaCnpj
					? contactData?.cpfResponsavelLegal
						? contactData.cpfResponsavelLegal.replace(/\D/g, "")
						: null
					: null,
				nomeResponsavelLegal: usaCnpj
					? contactData?.nomeResponsavelLegal
					: null,
			};

			const naturalPerson = {
				cpf: !usaCnpj
					? contactData?.cpf
						? contactData.cpf.replace(/\D/g, "")
						: null
					: null,
				nome: !usaCnpj ? contactData?.nome : null,
			};

			const contact = {
				id: musicalProduct?.id ?? 0,

				...contactData,

				usaCnpj,
				...legalEntity,
				...naturalPerson,

				telefone: cleanedTelefone,
				cepContato: cleanedCep,
				email: user?.email || "",
			};

			await updateMusicalProductMutation.mutateAsync({ ...contact });

			toast.success("Informações de contato salvas com sucesso");
		} catch (error: unknown) {
			console.error("Error saving contact data:", error);
			toast.error("Erro ao salvar informações de contato");
		} finally {
			setLoading(false);
		}
	};

	return { onSubmitOnboarding, onSubmitProfileUpdate };
}
