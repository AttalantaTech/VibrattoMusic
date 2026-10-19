import { Loader2, UserIcon } from "lucide-react";
import { Button } from "../../../ui/Button/Button";
import { AccountLayout } from "../../layout/AccountLayout/AccountLayout";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { ContactFields } from "@/features/MusicalProfile/components/ContactFields";
import { useContactStepForm } from "@/features/MusicalProfile/hooks/useContactForm";
import { useContactStepSubmit } from "@/features/MusicalProfile/hooks/useContactSubmit";
import { useUser } from "@/hooks/useUser";

export default function ContactSection() {
	const { activeProduct } = useMusicalProductStore();
	const { data: userData } = useUser();

	const { form, handleCepChange, loading, setLoading } = useContactStepForm({
		musicalProduct: activeProduct,
		userData,
	});

	const { onSubmitProfileUpdate } = useContactStepSubmit({
		musicalProduct: activeProduct,
		setLoading,
	});

	const { handleSubmit } = form;

	return (
		<AccountLayout
			headerTitle="Informações de contato"
			headerIcon={<UserIcon className="text-primary-700" size={24} />}
		>
			<form
				onSubmit={handleSubmit(onSubmitProfileUpdate)}
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
							{loading ? "Salvando..." : "Salvar"}
						</div>
					</Button>
				</div>
			</form>
		</AccountLayout>
	);
}
