import { useEffect, useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { Eye, FileTextIcon, Plus } from "lucide-react";
import { Select, type Option } from "@/components/forms/Select/Select";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import type { CreateProposalForm } from "@/components/BandProfile/Proposals/schemas/proposal.schema";
import type { ContractModel } from "../types";
import { DEMO_BASE_MODEL } from "../hooks/useDemoContractModels";
import { useProfileContractModels } from "../hooks/useProfileContractModels";
import { CONTRACT_MODELS_LIVE } from "../config";
import { ContractPreview } from "./ContractPreview";

/** The option of Vibratto's contract: sent as idModeloContrato null */
const STANDARD = "padrao";

/**
 * "Contrato Digital Incluído" of the proposal: which contract goes with it.
 * Without models of their own, the professional just sees that Vibratto's
 * contract is used; with models, a choice that starts on their default
 */
export const ContractModelField = ({
	form,
}: {
	form: UseFormReturn<CreateProposalForm>;
}) => {
	const { activeProduct } = useMusicalProductStore();
	const navigate = useNavigate();
	const { models, defaultId, getModel } = useProfileContractModels(
		activeProduct?.id
	);
	const [preview, setPreview] = useState<ContractModel | null>(null);

	const chosen = form.watch("idModeloContrato");

	// A new proposal starts on the profile's default model; an edited one
	// keeps the model it had (unless that model no longer exists)
	useEffect(() => {
		const exists = chosen == null || models.some((m) => m.id === chosen);
		if (chosen === undefined || !exists)
			form.setValue("idModeloContrato", defaultId);
	}, [chosen, defaultId, models, form]);

	const options: Array<Option> = [
		{ value: STANDARD, label: "Contrato padrão da Vibratto" },
		...models.map((model) => ({
			value: String(model.id),
			label: model.padrao ? `${model.nome} (seu padrão)` : model.nome,
		})),
	];

	const openPreview = () => {
		setPreview(
			chosen ? (getModel(chosen) ?? DEMO_BASE_MODEL) : DEMO_BASE_MODEL
		);
	};

	return (
		<div className="flex flex-col gap-3">
			{models.length > 0 ? (
				<Controller
					control={form.control}
					name="idModeloContrato"
					render={({ field }) => (
						<Select
							label="Modelo de contrato"
							name="contractModel"
							options={options}
							placeholder="Escolher modelo"
							selectedOptions={options.filter(
								(option) =>
									option.value ===
									(field.value == null ? STANDARD : String(field.value))
							)}
							setSelectedOptions={(selected) => {
								const value = selected[0]?.value;
								field.onChange(
									!value || value === STANDARD ? null : Number(value)
								);
							}}
						/>
					)}
				/>
			) : (
				<p className="text-sm text-gray-700">
					Será usado o <strong>contrato padrão da Vibratto</strong>.
				</p>
			)}

			<div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
				<button
					type="button"
					className="inline-flex items-center gap-1 font-medium text-primary-600 hover:text-primary-500"
					onClick={openPreview}
				>
					<Eye className="h-4 w-4" aria-hidden="true" />
					Ver contrato
				</button>
				{models.length === 0 && (
					<button
						type="button"
						className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-500"
						onClick={() => {
							void navigate({ to: "/band/me", search: { tab: "contracts" } });
						}}
					>
						<Plus className="h-4 w-4" aria-hidden="true" />
						Criar um modelo próprio
					</button>
				)}
			</div>

			<div className="rounded-lg border border-green-200 bg-green-50 p-4">
				<div className="flex items-start space-x-3">
					<FileTextIcon className="mt-0.5 h-5 w-5 text-green-600" />
					<p className="text-sm text-green-700">
						Ao aceitar esta proposta, o cliente será direcionado para assinatura
						do contrato.
					</p>
				</div>
			</div>

			{!CONTRACT_MODELS_LIVE && models.length > 0 && (
				<p className="text-xs text-amber-700">
					Demonstração: por enquanto a proposta ainda vai com o contrato padrão
					da Vibratto.
				</p>
			)}

			<ContractPreview
				model={preview}
				onClose={() => {
					setPreview(null);
				}}
			/>
		</div>
	);
};
