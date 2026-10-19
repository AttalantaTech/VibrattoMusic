import { useMemo } from "react";
import { useSearch } from "@tanstack/react-router";
import { Loader2, UserIcon, ChevronRight } from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { StepLayout } from "../layout/StepLayout/StepLayout";
import { useOnboardingData } from "../../../hooks/useOnboarding";
import { useUser } from "@/hooks/useUser";
import { mapOnboardingData } from "@/utils/mapOnboardingData";
import { ContactFields } from "@/features/MusicalProfile/components/ContactFields";
import { useContactStepForm } from "@/features/MusicalProfile/hooks/useContactForm";
import { useContactStepSubmit } from "@/features/MusicalProfile/hooks/useContactSubmit";

export default function ContactStep() {
	const { data } = useOnboardingData();
	const { data: userData } = useUser();
	const searchParameters = useSearch({ from: "/band/register/onboarding/1" });

	const onboardingData = useMemo(
		() => mapOnboardingData({ searchParameters, data }),
		[data, searchParameters]
	);

	const {
		form,
		handleCepChange,
		handleRegistrationDataButton,
		loading,
		setLoading,
		buttonToggle,
	} = useContactStepForm({ musicalProduct: onboardingData ?? null, userData });

	const { onSubmitOnboarding } = useContactStepSubmit({
		setLoading,
		musicalProduct: onboardingData ?? null,
	});

	const { handleSubmit } = form;

	return (
		<StepLayout
			currentStep={1}
			onClick={handleRegistrationDataButton}
			buttonTitle={
				buttonToggle % 2 === 0
					? "Usar Dados do Cadastro"
					: "Limpar Dados do Cadastro"
			}
			headerTitle="Informações de contato"
			headerIcon={<UserIcon className="text-primary-700" size={24} />}
		>
			<form
				onSubmit={handleSubmit(onSubmitOnboarding)}
				className="flex flex-col w-full h-full gap-6"
			>
				<ContactFields
					form={form}
					onCepChange={handleCepChange}
					lockPersonalData
				/>

				{/* Navigation buttons */}
				<div className="flex flex-col sm:flex-row w-full gap-3 items-stretch sm:items-center justify-between mt-4 md:mt-6">
					<div className="w-full sm:w-auto">
						{/* Empty div for consistent layout - first step has no "Anterior" */}
					</div>
					<Button type="submit" disabled={loading} className="w-full sm:w-auto">
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

						<div className="flex items-center gap-1">
							{loading ? "Salvando..." : "Continuar"}
							<ChevronRight />
						</div>
					</Button>
				</div>
			</form>
		</StepLayout>
	);
}
