import { useState, useEffect, useCallback } from "react";
import {
	DollarSignIcon,
	CalendarIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	FileTextIcon,
	CheckCircleIcon,
} from "lucide-react";
import { Button } from "../../../../ui/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../../../ui/dialog";
import { Input } from "../../../../ui/Input/Input";
import { Label } from "../../../../ui/Label/Label";
import { Textarea } from "../../../../ui/Textarea/Textarea";
import { Switch } from "../../../../ui/switch";
import { SingleSelect } from "../../../../forms/SingleSelect/SingleSelect";
import { useCreateProposal } from "../../../../../hooks/useProposals";
import { filterService } from "../../../../../api";
import type {
	CreateProposalRequest,
	FilterOption,
} from "../../../../../api/types";
import { useAuthStore } from "../../../../../store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { messagingKeys } from "../../../../../hooks/useMessaging";
import {
	createProposalSchema,
	validateProposalDates,
	validateProposalTimes,
} from "../../../../../schemas/proposalSchema";
import { toast } from "sonner";
import { useProfileStatus } from "../../../../../hooks/useProfileStatus";
import { ProfileIncompleteModal } from "../../../../ui/ProfileIncompleteModal/ProfileIncompleteModal";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

type AccordionSectionProps = {
	title: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	description: string;
	isExpanded: boolean;
	isComplete: boolean;
	onToggle: () => void;
};

const AccordionSection = ({
	title,
	icon,
	children,
	description,
	isExpanded,
	isComplete,
	onToggle,
}: AccordionSectionProps) => {
	return (
		<div className="border border-gray-200 rounded-lg">
			<button
				type="button"
				onClick={onToggle}
				className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
			>
				<div className="flex items-center space-x-3">
					<div className="flex-shrink-0">{icon}</div>
					<div>
						<h3 className="font-medium text-gray-900">{title}</h3>
						<p className="text-sm text-gray-600">{description}</p>
					</div>
				</div>
				<div className="flex items-center space-x-2">
					{isComplete && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
					{isExpanded ? (
						<ChevronUpIcon className="h-5 w-5 text-gray-400" />
					) : (
						<ChevronDownIcon className="h-5 w-5 text-gray-400" />
					)}
				</div>
			</button>
			{isExpanded && (
				<div className="px-4 pb-4 space-y-4 border-t border-gray-100">
					{children}
				</div>
			)}
		</div>
	);
};

interface SendProposalModalProps {
	isOpen: boolean;
	onClose: () => void;
	recipientId?: number; // ID do destinatário da proposta (opcional para contexto)
	contractorId?: number;
	conversationId?: number; // ID da conversa para enviar mensagem
	onProposalSent?: (proposalDetails: string) => Promise<void>; // Callback para enviar mensagem após proposta
}

export const SendProposalModal = ({
	isOpen,
	onClose,
	// recipientId: _recipientId, // Prefixed with _ to indicate it's intentionally unused for now
	contractorId,
	conversationId,
	onProposalSent,
}: SendProposalModalProps) => {
	const { user } = useAuthStore();
	const { isProfileComplete, refetch: refetchProfile } = useProfileStatus();
	const queryClient = useQueryClient();
	const [eventTypes, setEventTypes] = useState<Array<FilterOption>>([]);
	const [paymentMethods, setPaymentMethods] = useState<Array<FilterOption>>([]);
	const [paymentConditions, setPaymentConditions] = useState<
		Array<FilterOption>
	>([]);
	const [showProfileIncompleteModal, setShowProfileIncompleteModal] =
		useState(false);

	// Accordion sections state
	const [expandedSections, setExpandedSections] = useState({
		eventData: true,
		paymentConditions: false,
		includedServices: false,
		digitalContract: false,
	});

	// Use the currently active musical product
	const { activeProduct } = useMusicalProductStore();
	const userProductId = activeProduct?.id
		? Number(activeProduct.id)
		: undefined;

	// Helper function to get contractor ID
	const getContractorId = useCallback(() => {
		// First try the prop and user.id
		if (contractorId) return contractorId;
		if (user?.id) return user.id;

		// Fallback to extracting from token
		try {
			const { token } = useAuthStore.getState();
			if (!token) return 0;

			const tokenParts = token.split(".");
			if (tokenParts.length !== 3) return 0;

			const payloadString = tokenParts[1];
			if (!payloadString) return 0;

			const payload = JSON.parse(atob(payloadString)) as {
				sub?: string;
				userId?: string | number;
				nameid?: string;
				unique_name?: string;
			};

			// Try different common JWT fields for user ID
			const possibleIds = [
				payload.sub,
				payload.userId,
				payload.nameid,
				payload.unique_name,
			];

			for (const id of possibleIds) {
				if (id) {
					const numericId = Number(id);
					if (!isNaN(numericId) && numericId > 0) {
						return numericId;
					}
				}
			}
		} catch (error) {
			console.warn("⚠️ Could not extract user ID from token:", error);
		}

		return 0;
	}, [contractorId, user]);

	// Local UI form state (PascalCase in UI, mapped to camelCase when sending)
	type ProposalFormData = {
		IdContratante: number;
		NomeContratante?: string;
		TipoDocumentoContratante?: string;
		DocumentoContratante?: string;
		IdTipoEvento?: number;
		Descricao: string;
		Valor: number;
		Local: string;
		DataInicio: string;
		DataFim: string;
		HoraInicio: string;
		HoraFim: string;
		TransporteIncluso?: boolean;
		AcomodacaoInclusa?: boolean;
		IdFormaPagamento?: number;
		IdCondicoesPagamento?: number;
		IdCondicoesPagamentoRestante?: number | null;
		TipoSinalPagamento?: "P" | "V" | null;
		ValorSinalPagamento?: number | null;
		DataVencimentoSinalPagamento?: string | null;
	};

	const [formData, setFormData] = useState<ProposalFormData>({
		IdContratante: getContractorId(),
		NomeContratante: user?.nome || "",
		TipoDocumentoContratante: "",
		DocumentoContratante: "",
		IdTipoEvento: 0,
		Descricao: "",
		Valor: 0,
		Local: "",
		DataInicio: "",
		DataFim: "",
		HoraInicio: "",
		HoraFim: "",
		TransporteIncluso: false,
		AcomodacaoInclusa: false,
		IdFormaPagamento: 0,
		IdCondicoesPagamento: 0,
	});

	const createProposalMutation = useCreateProposal();

	// Load event types and payment options on mount
	useEffect(() => {
		const loadOptions = async () => {
			try {
				const [types, formas, condicoes] = await Promise.all([
					filterService.getTiposEvento(),
					filterService.getFormasPagamento(),
					filterService.getCondicoesPagamento(),
				]);
				setEventTypes(types);
				setPaymentMethods(formas);
				setPaymentConditions(condicoes);
			} catch (error) {
				console.error("Error loading event types:", error);
			}
		};
		void loadOptions();
	}, []);

	// Reset form ONLY when modal opens
	useEffect(() => {
		if (!isOpen) return;
		setFormData({
			IdContratante: getContractorId(),
			NomeContratante: user?.nome || "",
			TipoDocumentoContratante: "",
			DocumentoContratante: "",
			IdTipoEvento: 0,
			Descricao: "",
			Valor: 0,
			Local: "",
			DataInicio: "",
			DataFim: "",
			HoraInicio: "",
			HoraFim: "",
			TransporteIncluso: false,
			AcomodacaoInclusa: false,
			IdFormaPagamento: 0,
			IdCondicoesPagamento: 0,
		});
	}, [getContractorId, isOpen, user?.nome]);

	const handleInputChange = (
		field: keyof ProposalFormData,
		value: string | number | boolean
	) => {
		setFormData((previous) => ({ ...previous, [field]: value }));
	};

	const toggleSection = (section: keyof typeof expandedSections) => {
		setExpandedSections((previous) => ({
			...previous,
			[section]: !previous[section],
		}));
	};

	// Helper function to format document number
	const formatDocument = (value: string, type: string): string => {
		// Remove all non-numeric characters
		const numbers = value.replace(/\D/g, "");

		if (type === "cpf") {
			// Format CPF: 000.000.000-00
			if (numbers.length <= 11) {
				return numbers
					.replace(/(\d{3})(\d)/, "$1.$2")
					.replace(/(\d{3})(\d)/, "$1.$2")
					.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
			}
		} else if (type === "cnpj") {
			// Format CNPJ: 00.000.000/0000-00
			if (numbers.length <= 14) {
				return numbers
					.replace(/(\d{2})(\d)/, "$1.$2")
					.replace(/(\d{3})(\d)/, "$1.$2")
					.replace(/(\d{3})(\d)/, "$1/$2")
					.replace(/(\d{4})(\d{1,2})$/, "$1-$2");
			}
		}

		return numbers; // Return just numbers if format doesn't match
	};

	// Handler específico para campo documento
	const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (!formData.TipoDocumentoContratante) return;

		const rawValue = event.target.value;
		const formattedValue = formatDocument(
			rawValue,
			formData.TipoDocumentoContratante
		);
		handleInputChange("DocumentoContratante", formattedValue);
	};

	// Handler para o valor da apresentação (sem negativos e sem setas)
	const handleValorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		let raw = event.target.value || "";
		// Permite apenas dígitos, vírgula e ponto; remove qualquer outro caractere
		raw = raw.replace(/[^0-9.,]/g, "");
		// Troca vírgula por ponto para parse
		raw = raw.replace(/,/g, ".");
		if (raw.startsWith(".")) raw = `0${raw}`;
		// Remove sinal negativo em qualquer posição
		raw = raw.replace(/-/g, "");
		const numericValue = parseFloat(raw);
		if (isNaN(numericValue) || numericValue < 0) {
			handleInputChange("Valor", 0);
		} else {
			handleInputChange("Valor", numericValue);
		}
	};

	// Helper to check if all required fields in a section are filled
	const isSectionComplete = (
		section: keyof typeof expandedSections
	): boolean => {
		switch (section) {
			case "eventData":
				return !!(
					formData.IdTipoEvento &&
					formData.IdTipoEvento > 0 &&
					formData.NomeContratante &&
					formData.Descricao &&
					formData.Local &&
					formData.DataInicio &&
					formData.DataFim &&
					formData.HoraInicio &&
					formData.HoraFim
				);
			case "paymentConditions":
				return !!(
					formData.Valor &&
					formData.Valor > 0 &&
					formData.IdFormaPagamento &&
					formData.IdFormaPagamento > 0 &&
					formData.IdCondicoesPagamento &&
					formData.IdCondicoesPagamento > 0
				);
			case "includedServices":
				return true; // Optional section
			case "digitalContract":
				return true; // Always complete
			default:
				return false;
		}
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		// Refresh profile data to ensure we have the latest information
		await refetchProfile();

		// Check if user has a complete profile
		if (!isProfileComplete) {
			setShowProfileIncompleteModal(true);
			return;
		}

		// Check if user has a musical product
		if (!userProductId) {
			toast.error(
				"Você precisa ter um produto musical cadastrado para enviar propostas."
			);
			return;
		}

		// Helper function to extract user ID from JWT token
		const getUserIdFromToken = (): number | null => {
			try {
				const { token } = useAuthStore.getState();
				if (!token) return null;

				const tokenParts = token.split(".");
				if (tokenParts.length !== 3) return null;

				const payloadString = tokenParts[1];
				if (!payloadString) return null;

				const payload = JSON.parse(atob(payloadString)) as {
					sub?: string;
					userId?: string | number;
					nameid?: string;
					unique_name?: string;
				};

				// Try different common JWT fields for user ID
				const possibleIds = [
					payload.sub,
					payload.userId,
					payload.nameid,
					payload.unique_name,
				];

				for (const id of possibleIds) {
					if (id) {
						const numericId = Number(id);
						if (!isNaN(numericId) && numericId > 0) {
							return numericId;
						}
					}
				}

				return null;
			} catch (error) {
				console.warn("⚠️ Could not extract user ID from token:", error);
				return null;
			}
		};

		// Try multiple sources for contractor ID
		const contractorIdToUse =
			contractorId ||
			formData.IdContratante ||
			user?.id ||
			getUserIdFromToken();

		// Set contractor ID to current user if not already set
		const finalFormData = {
			...formData,
			IdContratante: contractorIdToUse || 0,
		};

		// Validate contractor ID more robustly
		if (!finalFormData.IdContratante || finalFormData.IdContratante === 0) {
			// More specific error messages
			if (!user) {
				toast.error("Você precisa estar logado para enviar uma proposta.");
			} else {
				toast.error(
					"Erro: Não foi possível identificar o usuário. Por favor, faça login novamente."
				);
			}
			return;
		}

		// Helpers to format date/time to API format
		const ensureHHMMSS = (timeString: string): string => {
			if (!timeString) return "";
			const parts = timeString.split(":");
			const h = parts[0]?.padStart(2, "0") || "00";
			const m = parts[1]?.padStart(2, "0") || "00";
			const s = (parts[2] ?? "00").padStart(2, "0");
			return `${h}:${m}:${s}`;
		};
		const combineDateTime = (
			dateString: string,
			timeString: string
		): string => {
			if (!dateString) return "";
			const t = ensureHHMMSS(timeString || "00:00:00");
			return `${dateString}T${t}`;
		};

		// Debug raw form data before processing
		console.log("🔍 Debug - Raw form data:", finalFormData);

		// Build payload in camelCase exactly as API expects
		const proposalData: CreateProposalRequest = {
			idConversa: Number(conversationId) || 0,
			nomeContratante: String(
				finalFormData.NomeContratante || user?.nome || ""
			),
			idProdutoMusical: Number(userProductId),
			idTipoEvento: Number(finalFormData.IdTipoEvento) || 0,
			descricao: String(finalFormData.Descricao || ""),
			valor: Number(finalFormData.Valor) || 0,
			local: String(finalFormData.Local || ""),
			dataInicio: combineDateTime(
				String(finalFormData.DataInicio || "").trim(),
				String(finalFormData.HoraInicio || "").trim()
			),
			dataFim: combineDateTime(
				String(finalFormData.DataFim || "").trim(),
				String(finalFormData.HoraFim || "").trim()
			),
			horaInicio: ensureHHMMSS(String(finalFormData.HoraInicio || "").trim()),
			horaFim: ensureHHMMSS(String(finalFormData.HoraFim || "").trim()),
			idFormaPagamento: Number(finalFormData.IdFormaPagamento || 0),
			idCondicoesPagamento: Number(finalFormData.IdCondicoesPagamento || 0),
			idCondicoesPagamentoRestante:
				finalFormData.IdCondicoesPagamentoRestante ?? null,
			tipoSinalPagamento: finalFormData.TipoSinalPagamento ?? null,
			valorSinalPagamento: finalFormData.ValorSinalPagamento ?? null,
			dataVencimentoSinalPagamento:
				finalFormData.DataVencimentoSinalPagamento ?? null,
			transporteIncluso: Boolean(finalFormData.TransporteIncluso),
			acomodacaoInclusa: Boolean(finalFormData.AcomodacaoInclusa),
			camarimIncluso: false,
		};

		try {
			// Debug: Log the exact payload being sent
			console.log("🔍 Debug - Payload being sent:", {
				productId: userProductId,
				proposalData,
				endpoint: `produtomusical/${userProductId}/proposta`,
			});

			// Additional validation for common issues
			const additionalValidations = {
				hasValidConversation: proposalData.idConversa > 0,
				hasValidProduct: proposalData.idProdutoMusical > 0,
				hasValidEventType: proposalData.idTipoEvento > 0,
				hasDescription: proposalData.descricao.length >= 1,
				hasValidValue: proposalData.valor > 0,
				hasLocation: proposalData.local.length >= 1,
				hasValidDates: proposalData.dataInicio && proposalData.dataFim,
				hasValidTimes: proposalData.horaInicio && proposalData.horaFim,
				dateFormat:
					proposalData.dataInicio.includes("T") &&
					proposalData.dataFim.includes("T"),
				timeFormat:
					proposalData.horaInicio.includes(":") &&
					proposalData.horaFim.includes(":"),
			};

			// Debug: Check each field individually for empty values
			console.log("🔍 Debug - Field by field analysis:", {
				idConversa: {
					value: proposalData.idConversa,
					type: typeof proposalData.idConversa,
					isEmpty: !proposalData.idConversa,
				},
				nomeContratante: {
					value: proposalData.nomeContratante,
					type: typeof proposalData.nomeContratante,
					isEmpty: !proposalData.nomeContratante,
				},
				idProdutoMusical: {
					value: proposalData.idProdutoMusical,
					type: typeof proposalData.idProdutoMusical,
					isEmpty: !proposalData.idProdutoMusical,
				},
				idTipoEvento: {
					value: proposalData.idTipoEvento,
					type: typeof proposalData.idTipoEvento,
					isEmpty: !proposalData.idTipoEvento,
				},
				descricao: {
					value: proposalData.descricao,
					type: typeof proposalData.descricao,
					isEmpty: !proposalData.descricao,
				},
				valor: {
					value: proposalData.valor,
					type: typeof proposalData.valor,
					isEmpty: !proposalData.valor,
				},
				local: {
					value: proposalData.local,
					type: typeof proposalData.local,
					isEmpty: !proposalData.local,
				},
				dataInicio: {
					value: proposalData.dataInicio,
					type: typeof proposalData.dataInicio,
					isEmpty: !proposalData.dataInicio,
				},
				dataFim: {
					value: proposalData.dataFim,
					type: typeof proposalData.dataFim,
					isEmpty: !proposalData.dataFim,
				},
				horaInicio: {
					value: proposalData.horaInicio,
					type: typeof proposalData.horaInicio,
					isEmpty: !proposalData.horaInicio,
				},
				horaFim: {
					value: proposalData.horaFim,
					type: typeof proposalData.horaFim,
					isEmpty: !proposalData.horaFim,
				},
				idFormaPagamento: {
					value: proposalData.idFormaPagamento,
					type: typeof proposalData.idFormaPagamento,
					isEmpty: !proposalData.idFormaPagamento,
				},
				idCondicoesPagamento: {
					value: proposalData.idCondicoesPagamento,
					type: typeof proposalData.idCondicoesPagamento,
					isEmpty: !proposalData.idCondicoesPagamento,
				},
			});

			console.log("🔍 Debug - Additional validations:", additionalValidations);
			console.log("🔍 Debug - Formatted payload comparison:", {
				originalDate: finalFormData.DataInicio,
				formattedDate: proposalData.dataInicio,
				originalTime: finalFormData.HoraInicio,
				formattedTime: proposalData.horaInicio,
			});

			// Validate with Zod schema
			const validationResult = createProposalSchema.safeParse(proposalData);
			if (!validationResult.success) {
				const firstError = validationResult.error.errors[0];
				if (firstError) {
					// Special handling for event type error
					if (firstError.path.includes("idTipoEvento")) {
						toast.error("Por favor, selecione um tipo de evento");
					} else {
						toast.error(firstError.message);
					}
				} else {
					toast.error("Erro na validação do formulário");
				}
				return;
			}

			// Custom date validation
			if (
				!validateProposalDates(proposalData.dataInicio, proposalData.dataFim)
			) {
				toast.error(
					"Datas inválidas. Verifique se a data de início não está no passado e a data de fim não é anterior à data de início."
				);
				return;
			}

			// Custom time validation
			if (
				!validateProposalTimes(
					proposalData.horaInicio,
					proposalData.horaFim,
					proposalData.dataInicio,
					proposalData.dataFim
				)
			) {
				toast.error(
					"Horários inválidos. A hora de fim deve ser posterior à hora de início."
				);
				return;
			}

			// Ensure required IDs are present
			if (!(Number(conversationId) > 0) || !(Number(userProductId) > 0)) {
				toast.error(
					"Dados da conversa/produto indisponíveis. Abra uma conversa e tente novamente."
				);
				return;
			}

			await createProposalMutation.mutateAsync({
				productId: userProductId,
				data: proposalData,
			});

			// Send automatic message to chat if callback is provided
			if (onProposalSent) {
				try {
					// Format proposal details for the chat message
					const eventTypeName =
						eventTypes.find((type) => type.Id === proposalData.idTipoEvento)
							?.Nome || "Evento";

					const formatDate = (dateString: string) => {
						if (!dateString) return "";
						const date = new Date(dateString);
						return date.toLocaleDateString("pt-BR");
					};

					const formatTime = (timeString: string) => {
						if (!timeString) return "";
						// Remove seconds if present
						return timeString.substring(0, 5);
					};

					const proposalMessage =
						`📋 Proposta enviada!\n\n` +
						`🎵 Tipo de Evento: ${eventTypeName}\n` +
						`📅 Data: ${formatDate(proposalData.dataInicio)}` +
						(proposalData.dataFim !== proposalData.dataInicio
							? ` até ${formatDate(proposalData.dataFim)}`
							: "") +
						`\n` +
						`⏰ Horário: ${formatTime(proposalData.horaInicio)} - ${formatTime(proposalData.horaFim)}\n` +
						`📍 Local: ${proposalData.local}\n` +
						`💰 Valor: R$ ${proposalData.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
						(proposalData.transporteIncluso || proposalData.acomodacaoInclusa
							? `\n✅ Inclui: ${[
									proposalData.transporteIncluso && "Transporte",
									proposalData.acomodacaoInclusa && "Acomodação",
								]
									.filter(Boolean)
									.join(", ")}`
							: "");

					await onProposalSent(proposalMessage);
				} catch (error) {
					console.warn("Failed to send proposal notification message:", error);
					// Don't throw - proposal was sent successfully
				}
			}

			// Invalidate conversations to update sidebar with new proposal message
			void queryClient.invalidateQueries({
				queryKey: messagingKeys.conversations(),
			});

			onClose();
		} catch (error) {
			// Log detailed error for debugging
			console.error("❌ Proposal submission error:", {
				error,
				proposalData,
				productId: userProductId,
			});

			// Show user-friendly error message
			if (error && typeof error === "object" && "response" in error) {
				const apiError = error as {
					response?: { status?: number; data?: any };
				};
				if (apiError.response?.status === 500) {
					toast.error(
						"Erro interno do servidor. Por favor, verifique os dados e tente novamente."
					);
				} else {
					toast.error("Erro ao enviar proposta. Tente novamente.");
				}
			}
		}
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Criar Nova Proposta</DialogTitle>
						<DialogDescription>
							Configure todos os campos necessários para criar a proposta
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						{/* Event Data Section */}
						<AccordionSection
							title="Dados do Evento"
							description="Informações básicas sobre o evento"
							icon={<CalendarIcon className="h-5 w-5 text-gray-600" />}
							isExpanded={expandedSections.eventData}
							isComplete={isSectionComplete("eventData")}
							onToggle={() => {
								toggleSection("eventData");
							}}
						>
							{/* Event Type */}
							<div className="space-y-2">
								<Label htmlFor="eventType">Tipo de Evento</Label>
								<SingleSelect
									value={
										formData.IdTipoEvento && formData.IdTipoEvento > 0
											? String(formData.IdTipoEvento)
											: ""
									}
									onChange={(value) => {
										const numericValue = value ? Number(value) : 0;
										handleInputChange("IdTipoEvento", numericValue);
									}}
									options={eventTypes.map((type) => ({
										value: String(type.Id),
										label: type.Nome,
									}))}
									placeholder="Selecionar tipo"
								/>
							</div>

							{/* Contractor Name */}
							<div className="space-y-2">
								<Label htmlFor="nomeContratante">Nome do Contratante *</Label>
								<Input
									id="nomeContratante"
									value={formData.NomeContratante || ""}
									onChange={(event) => {
										handleInputChange("NomeContratante", event.target.value);
									}}
									placeholder="Digite o nome completo do contratante"
									required
								/>
							</div>

							{/* Document fields */}
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="documentoContratante">
										Documento do contratante
									</Label>
									<SingleSelect
										value={formData.TipoDocumentoContratante || ""}
										onChange={(value) => {
											handleInputChange(
												"TipoDocumentoContratante",
												value || ""
											);
											// Clear document number when type changes
											if (formData.DocumentoContratante) {
												handleInputChange("DocumentoContratante", "");
											}
										}}
										options={[
											{ value: "cpf", label: "CPF" },
											{ value: "cnpj", label: "CNPJ" },
										]}
										placeholder="Selecionar tipo"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="documento">Documento</Label>
									<Input
										id="documento"
										value={
											formData.TipoDocumentoContratante
												? formData.DocumentoContratante || ""
												: ""
										}
										disabled={!formData.TipoDocumentoContratante}
										onChange={handleDocumentChange}
										placeholder={
											!formData.TipoDocumentoContratante
												? "Selecione o tipo primeiro"
												: formData.TipoDocumentoContratante === "cpf"
													? "000.000.000-00"
													: "00.000.000/0000-00"
										}
										maxLength={
											formData.TipoDocumentoContratante === "cpf" ? 14 : 18
										}
									/>
								</div>
							</div>

							{/* Description */}
							<div className="space-y-2">
								<Label htmlFor="description">Descrição da Proposta</Label>
								<Textarea
									id="description"
									value={formData.Descricao}
									onChange={(event) => {
										handleInputChange("Descricao", event.target.value);
									}}
									placeholder="Descreva detalhes da apresentação, repertório, equipamentos..."
									rows={3}
									required
								/>
							</div>

							{/* Location */}
							<div className="space-y-2">
								<Label htmlFor="location">Local do Evento</Label>
								<Input
									id="location"
									value={formData.Local}
									onChange={(event) => {
										handleInputChange("Local", event.target.value);
									}}
									placeholder="Endereço completo do evento"
									required
								/>
							</div>

							{/* Date fields */}
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="startDate">Data de Início</Label>
									<Input
										id="startDate"
										type="date"
										value={formData.DataInicio}
										onChange={(event) => {
											handleInputChange("DataInicio", event.target.value);
										}}
										placeholder="dd/mm/aaaa"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="endDate">Data de Fim</Label>
									<Input
										id="endDate"
										type="date"
										value={formData.DataFim}
										onChange={(event) => {
											handleInputChange("DataFim", event.target.value);
										}}
										placeholder="dd/mm/aaaa"
										required
									/>
								</div>
							</div>

							{/* Time fields */}
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="startTime">Hora de Início</Label>
									<Input
										id="startTime"
										type="time"
										value={formData.HoraInicio}
										onChange={(event) => {
											handleInputChange("HoraInicio", event.target.value);
										}}
										placeholder="--:--"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="endTime">Hora de Fim</Label>
									<Input
										id="endTime"
										type="time"
										value={formData.HoraFim}
										onChange={(event) => {
											handleInputChange("HoraFim", event.target.value);
										}}
										placeholder="--:--"
										required
									/>
								</div>
							</div>
						</AccordionSection>

						{/* Payment Conditions Section */}
						<AccordionSection
							title="Condições de Pagamento"
							description="Configure valor, métodos e condições de pagamento"
							icon={<DollarSignIcon className="h-5 w-5 text-gray-600" />}
							isExpanded={expandedSections.paymentConditions}
							isComplete={isSectionComplete("paymentConditions")}
							onToggle={() => {
								toggleSection("paymentConditions");
							}}
						>
							{/* Presentation Value */}
							<div className="space-y-2">
								<Label htmlFor="value">Valor da Apresentação</Label>
								<div className="relative">
									<span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">
										R$
									</span>
									<Input
										id="value"
										type="text"
										inputMode="decimal"
										pattern="[0-9]*[.,]?[0-9]*"
										className="pl-10"
										value={formData.Valor || ""}
										onChange={handleValorChange}
										placeholder="0,00"
										required
									/>
								</div>
							</div>

							{/* Payment Method */}
							<div className="space-y-2">
								<Label htmlFor="paymentMethod">Método de Pagamento</Label>
								<SingleSelect
									value={
										formData.IdFormaPagamento && formData.IdFormaPagamento > 0
											? String(formData.IdFormaPagamento)
											: ""
									}
									onChange={(value) => {
										const numericValue = value ? Number(value) : 0;
										handleInputChange("IdFormaPagamento", numericValue);
									}}
									options={paymentMethods.map((m) => ({
										value: String(m.Id),
										label: m.Nome,
									}))}
									placeholder="Selecionar método"
								/>
							</div>

							{/* Payment Conditions */}
							<div className="space-y-2">
								<Label htmlFor="paymentConditions">
									Condições de Pagamento
								</Label>
								<SingleSelect
									value={
										formData.IdCondicoesPagamento &&
										formData.IdCondicoesPagamento > 0
											? String(formData.IdCondicoesPagamento)
											: ""
									}
									onChange={(value) => {
										const numericValue = value ? Number(value) : 0;
										handleInputChange("IdCondicoesPagamento", numericValue);
									}}
									options={paymentConditions.map((c) => ({
										value: String(c.Id),
										label: c.Nome,
									}))}
									placeholder="Selecionar condição"
								/>
							</div>
						</AccordionSection>

						{/* Included Services Section */}
						<AccordionSection
							title="Serviços Inclusos"
							description="Defina quais serviços estão inclusos na proposta"
							icon={<CheckCircleIcon className="h-5 w-5 text-gray-600" />}
							isExpanded={expandedSections.includedServices}
							isComplete={isSectionComplete("includedServices")}
							onToggle={() => {
								toggleSection("includedServices");
							}}
						>
							{/* Changing Room Included */}
							<div className="flex items-center justify-between">
								<div>
									<Label
										htmlFor="camarimIncluso"
										className="text-base font-medium"
									>
										Camarim Incluso
									</Label>
									<p className="text-sm text-gray-500">
										Local reservado para preparação
									</p>
								</div>
								<Switch
									id="camarimIncluso"
									checked={formData.AcomodacaoInclusa || false}
									onCheckedChange={(checked) => {
										handleInputChange("AcomodacaoInclusa", checked);
									}}
								/>
							</div>

							{/* Transport Included */}
							<div className="flex items-center justify-between">
								<div>
									<Label
										htmlFor="transporteIncluso"
										className="text-base font-medium"
									>
										Transporte Incluso
									</Label>
									<p className="text-sm text-gray-500">
										Deslocamento até o local do evento
									</p>
								</div>
								<Switch
									id="transporteIncluso"
									checked={formData.TransporteIncluso || false}
									onCheckedChange={(checked) => {
										handleInputChange("TransporteIncluso", checked);
									}}
								/>
							</div>
						</AccordionSection>

						{/* Digital Contract Section */}
						<AccordionSection
							title="Contrato Digital Incluído"
							description="Contrato padrão será automaticamente anexado à proposta"
							icon={<FileTextIcon className="h-5 w-5 text-gray-600" />}
							isExpanded={expandedSections.digitalContract}
							isComplete={isSectionComplete("digitalContract")}
							onToggle={() => {
								toggleSection("digitalContract");
							}}
						>
							<div className="bg-green-50 border border-green-200 rounded-lg p-4">
								<div className="flex items-start space-x-3">
									<FileTextIcon className="h-5 w-5 text-green-600 mt-0.5" />
									<div>
										<h4 className="font-medium text-green-900">
											Contrato Digital Incluído
										</h4>
										<p className="text-sm text-green-700 mt-1">
											Ao aceitar esta proposta, o cliente será direcionado para
											assinatura do contrato.
										</p>
									</div>
								</div>
							</div>
						</AccordionSection>

						{/* Required Fields Notice */}
						<div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
							<p className="text-sm text-gray-600">
								Complete todos os campos necessários para criar a proposta
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancelar
						</Button>
						<Button
							type="submit"
							disabled={createProposalMutation.isPending || !userProductId}
							className="bg-primary-600 hover:bg-blue-700"
						>
							{createProposalMutation.isPending
								? "Enviando..."
								: !userProductId
									? "Sem produto musical"
									: "Enviar Proposta"}
						</Button>
					</DialogFooter>
				</form>

				{/* Profile Incomplete Modal */}
				<ProfileIncompleteModal
					isOpen={showProfileIncompleteModal}
					onClose={() => {
						setShowProfileIncompleteModal(false);
					}}
				/>
			</DialogContent>
		</Dialog>
	);
};
