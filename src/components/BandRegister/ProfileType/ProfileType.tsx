import { Binoculars, ChevronRight } from "lucide-react";
import { Select, type Option } from "../../forms/Select/Select";
import { Button } from "../../ui/Button/Button";
import { OnboardingHeader } from "../../BandOnboarding/OnboardingHeader/OnboardingHeader";
import { filterService } from "@/api";
import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";
import type { FilterOption } from "@/api/types";

interface ProfileTypeProps {
	onNext: () => void;
	selectedOptions: Array<Option>;
	setSelectedOptions: (options: Array<Option>) => void;
}

export const ProfileType = ({
	onNext,
	selectedOptions,
	setSelectedOptions,
}: ProfileTypeProps) => {
	const [loadingCategories, setLoadingCategories] = useState(true);
	const [categories, setCategories] = useState<Array<FilterOption>>([]);

	// Transform API data to select options with proper null checks
	const categoryOptions: Array<Option> = (categories || []).map((cat) => ({
		value: cat.Id.toString(),
		label: cat.Nome,
	}));

	const loadFilters = useCallback(async () => {
		try {
			setLoadingCategories(true);

			const categoriesResponse = await filterService.getCategorias();

			setCategories(categoriesResponse ?? []);
		} catch (loadError) {
			console.error("Failed to load filters:", loadError);
			// TODO: Replace with proper toast system
			toast.error("Erro ao carregar categorias");
		} finally {
			setLoadingCategories(false);
		}
	}, []); // Removed toast dependency as it's no longer used

	useEffect(() => {
		void loadFilters();
	}, [loadFilters]);

	return (
		<div className="flex flex-col w-screen h-screen justify-start items-center">
			<OnboardingHeader />
			<main className="flex flex-col items-center justify-start w-full h-full overflow-y-auto">
				<div className="min-h-full bg-gray-50 w-full">
					<div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 h-full flex flex-col gap-y-6 justify-center">
						<div className="flex w-full items-center justify-center">
							<Binoculars
								color="rgba(0, 123, 255, 1)"
								size={32}
								className="sm:w-10 sm:h-10"
							/>
						</div>
						<div className="flex flex-col w-full items-center justify-center text-center gap-2 sm:gap-[6px]">
							<h1 className="text-gray-900 font-bold text-xl sm:text-2xl">
								Para começar, escolha seu perfil musical
							</h1>
						</div>

						<div className="flex flex-col w-full items-center justify-center gap-8 sm:gap-12 lg:gap-16">
							<div className="w-full max-w-lg">
								<Select
									label="Escolher Perfil"
									name="profile"
									options={categoryOptions}
									placeholder={
										loadingCategories
											? "Carregando..."
											: "Selecione uma categoria"
									}
									selectedOptions={selectedOptions}
									setSelectedOptions={setSelectedOptions}
								/>
							</div>
							<div className="flex w-full items-center justify-center sm:justify-end">
								<Button className="h-12 sm:h-14 w-full" onClick={onNext}>
									<span className="flex items-center justify-center gap-2 sm:gap-3">
										<span className="font-semibold text-base sm:text-lg">
											Continuar
										</span>
										<ChevronRight size={20} className="sm:w-6 sm:h-6" />
									</span>
								</Button>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
};
