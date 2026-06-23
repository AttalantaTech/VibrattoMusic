import { useState, useEffect, useCallback } from "react";
import {
	Save,
	FileText,
	Edit3,
	Check,
	AlertCircle,
	Loader2,
} from "lucide-react";
import { Button } from "../../ui/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../../ui/dialog";
import { Textarea } from "../../ui/Textarea/Textarea";
import { Input } from "../../ui/Input/Input";
import { LoadingSpinner } from "../../ui/LoadingSpinner/LoadingSpinner";
import { Badge } from "../../ui/Badge/Badge";
import {
	useContractSections,
	useUpdateContractSections,
	useContractPermissions,
} from "../../../hooks/useContracts";
import { contractSectionSchema } from "../../../schemas/contractSchemas";
import type { ContractSectionUpdateInput } from "../../../schemas/contractSchemas";
import { toast } from "sonner";
import { useProposalById } from "../../../hooks/useProposals";
import type { ContractSection } from "@/api/types";

interface ContractEditorProps {
	isOpen: boolean;
	onClose: () => void;
	identificadorUnico: string | null;
}

interface EditingSection {
	numero: number;
	titulo: string;
	texto: string;
	editavel: boolean;
	isEditing: boolean;
	hasChanges: boolean;
}

export const ContractEditor = ({
	isOpen,
	onClose,
	identificadorUnico,
}: ContractEditorProps) => {
	const [editingSections, setEditingSections] = useState<Array<EditingSection>>(
		[]
	);
	const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(
		null
	);

	const {
		data: proposal,
		// isLoading: isLoadingProposal,
		// error: errorProposal,
	} = useProposalById(identificadorUnico || "");

	const {
		data: sections,
		isLoading,
		error,
	} = useContractSections(Number(proposal?.id) || 0);

	const permissionsQuery = useContractPermissions(identificadorUnico || "");
	const permissions = permissionsQuery.data;
	const updateSectionsMutation = useUpdateContractSections();

	const handleSaveAll = useCallback(async () => {
		if (!identificadorUnico) return;

		const changedSections: Array<ContractSectionUpdateInput> = editingSections
			.filter((section) => section.hasChanges)
			.map((section) => ({
				numero: section.numero,
				titulo: section.titulo,
				texto: section.texto,
			}));

		if (changedSections.length === 0) return;

		try {
			await updateSectionsMutation.mutateAsync({
				identificadorUnico,
				sections: changedSections,
			});

			// Clear hasChanges flag for saved sections
			setEditingSections((previous) =>
				previous.map((section) =>
					changedSections.some((cs) => cs.numero === section.numero)
						? { ...section, hasChanges: false }
						: section
				)
			);
		} catch (error) {
			console.error("Error saving sections:", error);
		}
	}, [identificadorUnico, editingSections, updateSectionsMutation]);

	// Initialize editing sections when data loads
	useEffect(() => {
		if (sections) {
			const initialSections: Array<EditingSection> = sections.map(
				(section: ContractSection) => ({
					...section,
					isEditing: false,
					hasChanges: false,
					editavel: true,
				})
			);
			setEditingSections(initialSections);
		}
	}, [sections]);

	// Auto-save functionality
	useEffect(() => {
		const hasUnsavedChanges = editingSections.some(
			(section) => section.hasChanges
		);

		if (hasUnsavedChanges && !autoSaveTimer) {
			// Start auto-save timer (5 seconds)
			const timer = setTimeout(() => {
				void handleSaveAll();
			}, 5000);
			setAutoSaveTimer(timer);
		} else if (!hasUnsavedChanges && autoSaveTimer) {
			// Clear timer if no changes
			clearTimeout(autoSaveTimer);
			setAutoSaveTimer(null);
		}

		return () => {
			if (autoSaveTimer) {
				clearTimeout(autoSaveTimer);
			}
		};
	}, [editingSections, autoSaveTimer, handleSaveAll]);

	const handleEditSection = (sectionNumero: number) => {
		setEditingSections((previous) =>
			previous.map((section) =>
				section.numero === sectionNumero
					? { ...section, isEditing: true }
					: section
			)
		);
	};

	const handleSaveSection = (sectionNumero: number) => {
		const section = editingSections.find(
			(s: EditingSection) => s.numero === sectionNumero
		);
		if (!section) return;

		// Validate section
		const validation = contractSectionSchema.safeParse({
			numero: section.numero,
			titulo: section.titulo,
			texto: section.texto,
		});

		if (!validation.success) {
			toast.error(
				`Erro na seção ${section.numero}: ${validation.error.issues[0]?.message || "Erro de validação"}`
			);
			return;
		}

		setEditingSections((previous) =>
			previous.map((s) =>
				s.numero === sectionNumero
					? { ...s, isEditing: false, hasChanges: false }
					: s
			)
		);

		toast.success(`Seção ${section.numero} salva localmente`);
	};

	const handleCancelEdit = (sectionNumero: number) => {
		const originalSection = sections?.find(
			(s: ContractSection) => s.numero === sectionNumero
		);
		if (!originalSection) return;

		setEditingSections((previous: Array<EditingSection>) =>
			previous.map((section: EditingSection) =>
				section.numero === sectionNumero
					? {
							...section,
							isEditing: false,
							hasChanges: false,
						}
					: section
			)
		);
	};

	const handleFieldChange = (
		sectionNumero: number,
		field: "titulo" | "texto",
		value: string
	) => {
		setEditingSections((previous: Array<EditingSection>) =>
			previous.map((section: EditingSection) =>
				section.numero === sectionNumero
					? { ...section, [field]: value, hasChanges: true }
					: section
			)
		);
	};

	const handleClose = () => {
		const hasUnsavedChanges = editingSections.some(
			(section) => section.hasChanges
		);

		if (hasUnsavedChanges) {
			const confirmClose = window.confirm(
				"Você tem alterações não salvas. Deseja sair mesmo assim?"
			);
			if (!confirmClose) return;
		}

		onClose();
	};

	const hasUnsavedChanges = editingSections.some(
		(section) => section.hasChanges
	);
	const isSaving = updateSectionsMutation.isPending;

	if (!permissions?.canEdit || !identificadorUnico) {
		return (
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent>
					<div className="flex flex-col items-center justify-center py-8">
						<AlertCircle className="w-12 h-12 text-red-500 mb-4" />
						<h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
						<p className="text-gray-600 text-center">
							Você não tem permissão para editar este contrato.
						</p>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Edit3 className="w-6 h-6 text-primary-600" />
							<DialogTitle className="text-xl font-semibold">
								Editar Contrato #{identificadorUnico?.slice(0, 8) || "N/A"}
							</DialogTitle>
							{hasUnsavedChanges && (
								<Badge className="bg-orange-100 text-orange-800">
									Alterações não salvas
								</Badge>
							)}
						</div>
					</div>
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<LoadingSpinner />
					</div>
				) : error ? (
					<div className="flex flex-col items-center justify-center py-8 text-gray-500">
						<AlertCircle className="w-12 h-12 mb-4" />
						<p>Erro ao carregar seções do contrato</p>
						<p className="text-sm text-gray-400 mt-2">{error.message}</p>
					</div>
				) : editingSections.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-8 text-gray-500">
						<FileText className="w-12 h-12 mb-4" />
						<p>Nenhuma seção editável encontrada</p>
					</div>
				) : (
					<div className="space-y-6">
						{/* Auto-save indicator */}
						{hasUnsavedChanges && (
							<div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
								<Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
								<span className="text-sm text-orange-800">
									Alterações serão salvas automaticamente em alguns segundos...
								</span>
							</div>
						)}

						{/* Sections */}
						<div className="space-y-4">
							{editingSections.map((section) => (
								<div
									key={section.numero}
									className="border rounded-lg p-6 bg-white"
								>
									<div className="flex items-center justify-between mb-4">
										<h4 className="text-lg font-semibold">
											{section.numero}.{" "}
											{section.isEditing ? (
												<Input
													value={section.titulo}
													onChange={(event) => {
														handleFieldChange(
															section.numero,
															"titulo",
															event.target.value
														);
													}}
													className="text-lg font-semibold border-none p-0 h-auto focus:ring-0"
													placeholder="Título da seção"
												/>
											) : (
												section.titulo
											)}
										</h4>

										{section.editavel && (
											<div className="flex gap-2">
												{section.isEditing ? (
													<>
														<Button
															variant="outline"
															size="sm"
															onClick={() => {
																handleCancelEdit(section.numero);
															}}
															disabled={isSaving}
														>
															Cancelar
														</Button>
														<Button
															size="sm"
															onClick={() => {
																handleSaveSection(section.numero);
															}}
															disabled={isSaving}
															className="flex items-center gap-1"
														>
															<Check className="w-3 h-3" />
															Salvar
														</Button>
													</>
												) : (
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															handleEditSection(section.numero);
														}}
														disabled={isSaving}
														className="flex items-center gap-1"
													>
														<Edit3 className="w-3 h-3" />
														Editar
													</Button>
												)}
											</div>
										)}
									</div>

									{section.isEditing ? (
										<Textarea
											value={section.texto}
											onChange={(event) => {
												handleFieldChange(
													section.numero,
													"texto",
													event.target.value
												);
											}}
											className="min-h-32 resize-none"
											placeholder="Conteúdo da seção..."
										/>
									) : (
										<div className="prose prose-sm max-w-none">
											<pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
												{section.texto}
											</pre>
										</div>
									)}
								</div>
							))}
						</div>

						{/* Actions */}
						<div className="flex justify-between items-center pt-4 border-t">
							<div className="text-sm text-gray-500">
								{hasUnsavedChanges ? (
									<span className="text-orange-600">
										{editingSections.filter((s) => s.hasChanges).length}{" "}
										seção(ões) com alterações
									</span>
								) : (
									<span>Todas as alterações foram salvas</span>
								)}
							</div>

							<div className="flex gap-3">
								<Button variant="outline" onClick={handleClose}>
									Fechar
								</Button>
								{hasUnsavedChanges && (
									<Button
										onClick={handleSaveAll}
										disabled={isSaving}
										className="flex items-center gap-2"
									>
										{isSaving ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<Save className="w-4 h-4" />
										)}
										{isSaving ? "Salvando..." : "Salvar Tudo"}
									</Button>
								)}
							</div>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};
