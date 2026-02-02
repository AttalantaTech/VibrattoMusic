import type { Dispatch, SetStateAction } from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ChevronLeft, Loader2, Music, Info, User } from "lucide-react";
import { filterService } from "../../../../api";
import type { FilterOption } from "../../../../api/types";
import { InputField } from "../../../forms/InputField/InputField";
import { Select, type Option } from "../../../forms/Select/Select";
import { ToggleSwitch } from "../../../forms/ToggleSwitch/ToggleSwitch";
import { TextAreaField } from "../../../forms/TextAreaField/TextAreaField";
import { Button } from "../../../ui/Button/Button";
import { toast } from "sonner";
import { AccountLayout } from "../../layout/AccountLayout/AccountLayout";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { useUpdateMusicalProduct } from "@/hooks/useProfileStatus";

const detailsSchema = z.object({
	nome: z.string().min(1, "Nome é obrigatório"),
	idCategoria: z.number().min(1, "Categoria é obrigatória"),
	descricao: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
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

type DetailsFormData = z.infer<typeof detailsSchema>;

interface DetailsSectionProps {
	onActiveSection: Dispatch<SetStateAction<string>>;
}

export default function DetailsSection({
	onActiveSection,
}: DetailsSectionProps) {
	const { activeProduct } = useMusicalProductStore();

	const updateMusicalProductMutation = useUpdateMusicalProduct();

	const [loading, setLoading] = useState(false);
	const [categories, setCategories] = useState<Array<FilterOption>>([]);
	const [cities, setCities] = useState<Array<FilterOption>>([]);
	const [eventTypes, setEventTypes] = useState<Array<FilterOption>>([]);
	const [musicalGenres, setMusicalGenres] = useState<Array<FilterOption>>([]);

	// Loading states for dropdowns
	const [loadingCategories, setLoadingCategories] = useState(true);
	const [loadingCities, setLoadingCities] = useState(true);
	const [loadingEventTypes, setLoadingEventTypes] = useState(true);
	const [loadingGenres, setLoadingGenres] = useState(true);

	// State for multi-select options
	const [selectedCategoria, setSelectedCategoria] = useState<Array<Option>>([]);
	const [selectedCidade, setSelectedCidade] = useState<Array<Option>>([]);
	const [selectedGenres, setSelectedGenres] = useState<Array<Option>>([]);
	const [selectedEventTypes, setSelectedEventTypes] = useState<Array<Option>>(
		[]
	);

	const detailedValues: DetailsFormData = useMemo(() => {
		return {
			nome: activeProduct?.nome ?? "",
			idCategoria: activeProduct?.categoria.id ?? 0,
			descricao: activeProduct?.descricao ?? "",
			podeDeslocamento: activeProduct?.podeDeslocamento ?? false,
			codigoMunicipio: activeProduct?.cidade.id ?? 0,
			tipoEvento: activeProduct?.tipoEvento.map((item) => item.id) ?? [],
			generoMusical: activeProduct?.generoMusical.map((item) => item.id) ?? [],
			tipoProducao: activeProduct?.tiposProducao.map((item) => item.id) ?? [],
			numeroIntegrantes: activeProduct?.numeroIntegrantes ?? 0,
		};
	}, [activeProduct]);

	const { setValue, formState, reset, watch, handleSubmit } =
		useForm<DetailsFormData>({
			resolver: zodResolver(detailsSchema),
			defaultValues: {
				...detailedValues,
			},
		});

	// Transform API data to select options with proper null checks
	const categoriaOptions: Array<Option> = (categories || []).map((cat) => ({
		value: cat.Id.toString(),
		label: cat.Nome,
	}));

	const cidadeOptions: Array<Option> = (cities || []).map((cidade) => ({
		value: cidade.Id.toString(),
		label: cidade.Nome,
	}));

	const tipoEventoOptions: Array<Option> = (eventTypes || []).map((tipo) => ({
		value: tipo.Id.toString(),
		label: tipo.Nome,
	}));

	const generoMusicalOptions: Array<Option> = (musicalGenres || []).map(
		(genero) => ({
			value: genero.Id.toString(),
			label: genero.Nome,
		})
	);

	const loadFilters = useCallback(async () => {
		try {
			setLoadingCategories(true);
			setLoadingCities(true);
			setLoadingEventTypes(true);
			setLoadingGenres(true);

			const [
				categoriesResponse,
				citiesResponse,
				eventTypesResponse,
				genresResponse,
			] = await Promise.all([
				filterService.getCategorias(),
				filterService.getCidades(),
				filterService.getTiposEvento(),
				filterService.getGenerosMusicais(),
			]);

			setCategories(categoriesResponse ?? []);
			setCities(citiesResponse ?? []);
			setEventTypes(eventTypesResponse ?? []);
			setMusicalGenres(genresResponse ?? []);
		} catch (loadError) {
			console.error("Failed to load filters:", loadError);
			// TODO: Replace with proper toast system
			toast.error("Erro ao carregar filtros");
		} finally {
			setLoadingCategories(false);
			setLoadingCities(false);
			setLoadingEventTypes(false);
			setLoadingGenres(false);
		}
	}, []); // Removed toast dependency as it's no longer used

	useEffect(() => {
		void loadFilters();
	}, [loadFilters]);

	// Initialize select fields with previously saved data
	useEffect(() => {
		const details = { ...detailedValues };

		if (
			details &&
			categories.length &&
			cities.length &&
			eventTypes.length &&
			musicalGenres.length
		) {
			// Initialize categoria
			if (details.idCategoria) {
				const categoriaOption = categories.find(
					(cat) => cat.Id === details.idCategoria
				);
				if (categoriaOption) {
					setSelectedCategoria([
						{
							value: categoriaOption.Id.toString(),
							label: categoriaOption.Nome,
						},
					]);
				}
			}

			// Initialize cidade
			if (details.codigoMunicipio) {
				const cidadeOption = cities.find(
					(cidade) => cidade.Id === details.codigoMunicipio
				);
				if (cidadeOption) {
					setSelectedCidade([
						{ value: cidadeOption.Id.toString(), label: cidadeOption.Nome },
					]);
				}
			}

			// Initialize genres
			if (details.generoMusical?.length) {
				const genreOptions = details.generoMusical
					.map((id: number) => musicalGenres.find((genero) => genero.Id === id))
					.filter((genero): genero is FilterOption => genero !== undefined)
					.map((genero) => ({
						value: genero.Id.toString(),
						label: genero.Nome,
					}));
				setSelectedGenres(genreOptions);
			}

			// Initialize event types
			if (details.tipoEvento?.length) {
				const eventOptions = details.tipoEvento
					.map((id: number) => eventTypes.find((tipo) => tipo.Id === id))
					.filter((tipo): tipo is FilterOption => tipo !== undefined)
					.map((tipo) => ({ value: tipo.Id.toString(), label: tipo.Nome }));
				setSelectedEventTypes(eventOptions);
			}
		}
	}, [categories, cities, eventTypes, musicalGenres, detailedValues]);

	useEffect(() => {
		if (activeProduct) {
			const { categoria, cidade } = activeProduct;
			if (categoria.id > 0)
				setSelectedCategoria([
					{
						value: String(categoria.id),
						label: categoria.nome,
					},
				]);
			if (cidade.id > 0)
				setSelectedCidade([
					{
						value: String(cidade.id),
						label: cidade.nome,
					},
				]);

			setSelectedGenres(
				activeProduct.generoMusical.map((gender) => {
					return { value: String(gender.id), label: gender.nome };
				})
			);
			setSelectedEventTypes(
				activeProduct.tipoEvento.map((evento) => {
					return { value: String(evento.id), label: evento.nome };
				})
			);

			reset({ ...detailedValues });
		}
	}, [activeProduct, detailedValues, reset]);

	const onSubmit = async (data: DetailsFormData) => {
		setLoading(true);
		try {
			const details = {
				nome: data.nome,
				idCategoria: data.idCategoria,
				descricao: data.descricao,
				podeDeslocamento: data.podeDeslocamento,
				codigoMunicipio: data.codigoMunicipio,
				tipoEvento: data.tipoEvento,
				generoMusical: data.generoMusical,
				tipoProducao: data.tipoProducao ?? [],
				numeroIntegrantes: data.numeroIntegrantes ?? 0,
			};

			await updateMusicalProductMutation.mutateAsync({
				id: activeProduct?.id,
				...details,
			});

			toast.success("Informações da Banda salvas com sucesso");
		} catch (submitError) {
			console.error("Failed to submit details:", submitError);
			const errorMessage =
				submitError instanceof Error
					? submitError.message
					: "Erro ao salvar detalhes";
			console.error("❌ Erro ao salvar detalhes:", errorMessage);

			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return (
		<AccountLayout
			headerTitle="Informações da Banda"
			headerIcon={<Info color="#007bff" size={24} />}
		>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="flex flex-col w-full h-full gap-6"
			>
				<InputField
					icon={<Music size={20} />}
					label="Nome Artístico"
					name="artistic_name"
					placeholder="Digitar..."
					value={watch("nome") || ""}
					onChange={(event) => {
						setValue("nome", event.target.value);
					}}
				/>
				{formState.errors.nome && (
					<div className="text-red-500 text-sm">
						{formState.errors.nome.message}
					</div>
				)}{" "}
				<Select
					label="Categoria"
					name="categoria"
					options={categoriaOptions}
					placeholder={
						loadingCategories ? "Carregando..." : "Selecione uma categoria"
					}
					selectedOptions={selectedCategoria}
					setSelectedOptions={(options) => {
						setSelectedCategoria(options);
						if (options && options.length > 0) {
							setValue("idCategoria", Number(options[0]?.value));
						}
					}}
				/>
				{formState.errors.idCategoria && (
					<div className="text-red-500 text-sm">
						{formState.errors.idCategoria.message}
					</div>
				)}
				<Select
					label="Cidade"
					name="cidade"
					options={cidadeOptions}
					placeholder={loadingCities ? "Carregando..." : "Selecione uma cidade"}
					selectedOptions={selectedCidade}
					setSelectedOptions={(options) => {
						setSelectedCidade(options);
						if (options && options.length > 0) {
							setValue("codigoMunicipio", Number(options[0]?.value));
						}
					}}
				/>
				{formState.errors.codigoMunicipio && (
					<div className="text-red-500 text-sm">
						{formState.errors.codigoMunicipio.message}
					</div>
				)}
				<Select
					label="Gênero Musical"
					name="genres"
					multiple
					options={generoMusicalOptions}
					placeholder={loadingGenres ? "Carregando..." : "Selecione os gêneros"}
					selectedOptions={selectedGenres}
					setSelectedOptions={(options) => {
						setSelectedGenres(options);
						const values = (options || []).map((opt) => Number(opt.value));
						setValue("generoMusical", values);
					}}
				/>
				{formState.errors.generoMusical && (
					<div className="text-red-500 text-sm">
						{formState.errors.generoMusical.message}
					</div>
				)}
				<Select
					label="Tipos de Eventos"
					name="events"
					multiple
					options={tipoEventoOptions}
					placeholder={
						loadingEventTypes ? "Carregando..." : "Selecione os tipos de evento"
					}
					selectedOptions={selectedEventTypes}
					setSelectedOptions={(options) => {
						setSelectedEventTypes(options);
						const values = (options || []).map((opt) => Number(opt.value));
						setValue("tipoEvento", values);
					}}
				/>
				{formState.errors.tipoEvento && (
					<div className="text-red-500 text-sm">
						{formState.errors.tipoEvento.message}
					</div>
				)}
				<hr className="w-full" />
				<ToggleSwitch
					checked={watch("podeDeslocamento") || false}
					label="Disponível para deslocamentos a outras regiões."
					name="avaliable_for_moving"
					setChecked={(checked) => {
						setValue("podeDeslocamento", checked);
					}}
				/>
				<hr className="w-full" />
				<InputField
					icon={<User size={20} />}
					label="Número de integrantes da banda"
					min={1}
					placeholder="Ex: 3"
					type="number"
					name="numberBandMembers"
					value={String(watch("numeroIntegrantes")) || ""}
					onChange={(event) => {
						setValue("numeroIntegrantes", Number(event.target.value));
					}}
				/>
				<TextAreaField
					showCharCount
					helperText="Conte brevemente a trajetória da banda em até 300 caracteres."
					label="Bio (release)"
					name="bio"
					placeholder="Digitar..."
					value={watch("descricao") || ""}
					onChange={(event) => {
						setValue("descricao", event.target.value);
					}}
				/>
				{formState.errors.descricao && (
					<div className="text-red-500 text-sm">
						{formState.errors.descricao.message}
					</div>
				)}{" "}
				{/* Navigation buttons */}
				<div className="flex flex-col sm:flex-row w-full gap-8 items-stretch sm:items-center justify-end mt-4 md:mt-6">
					<Button
						type="button"
						variant="outline"
						className="w-full sm:w-auto"
						onClick={() => {
							onActiveSection("contact");
						}}
					>
						<div className="flex items-center gap-1">
							<ChevronLeft />
							Voltar
						</div>
					</Button>

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
