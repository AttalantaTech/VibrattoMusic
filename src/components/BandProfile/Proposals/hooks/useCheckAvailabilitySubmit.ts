import { toast } from "sonner";
import type { CheckAvailabilityForm } from "../schemas/checkAvailability.schema";
import type {
	CreateBudgetRequest,
	MusicalProductApiResponse,
} from "@/api/types";
import type { Option } from "@/components/forms/Select/Select";
import { combineDateTime, ensureHHMMSS } from "@/utils";
import { useCreateBudget } from "@/hooks/useProposals";
import { useSendStatusMessage } from "@/features/message/hooks/useSendStatusMessage";
import { entityLinks } from "@/features/message/utils/messageTemplates";
import { resolveStatusSender } from "@/features/message/utils/resolveStatusSender";
import { showApiError } from "@/utils/showApiError";

interface CheckAvailabilitySubmit {
	musicalProduct: MusicalProductApiResponse | null;
	contratanteId: number;
	produtoMusicalContratanteId: number | null;
	tipoEventoOptions: Array<Option>;
	handleClose: () => void;
}

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

export const useCheckAvailabilitySubmit = ({
	musicalProduct,
	tipoEventoOptions,
	handleClose,
	contratanteId,
	produtoMusicalContratanteId,
}: CheckAvailabilitySubmit) => {
	const { sendStatusMessage } = useSendStatusMessage();
	const createBudgetMutation = useCreateBudget();

	const onSubmit = async (formData: CheckAvailabilityForm) => {
		if (!musicalProduct) {
			toast.error(
				"Não foi possível prossegur com a verificação de disponibilidade."
			);
			return;
		}

		const budgetData: CreateBudgetRequest = {
			idProdutoMusicalContratante: produtoMusicalContratanteId,
			idContratante: produtoMusicalContratanteId ? 0 : contratanteId,
			idTipoEvento: formData.idTipoEvento,
			descricao: formData.descricao || "",
			local: formData.local,
			dataEvento: combineDateTime(
				String(formData.dataEvento || "").trim(),
				String(formData.horaInicio || "").trim()
			),
			// Always asked: the band needs it to quote
			duracao: formData.duracao || null,
			// Optional: sent only when the contractor filled it in
			horaInicio: formData.horaInicio.trim()
				? ensureHHMMSS(formData.horaInicio.trim())
				: null,
		};

		try {
			const budget = await createBudgetMutation.mutateAsync({
				productId: musicalProduct.id,
				data: budgetData,
			});

			const eventType = tipoEventoOptions.find(
				(event) => Number(event.value) === formData.idTipoEvento
			);

			sendStatusMessage({
				type: "budgetRequested",
				// Whoever requests the budget is the contratante side
				...resolveStatusSender(
					{
						produtoMusicalId: musicalProduct.id,
						contratanteId,
						produtoMusicalContratanteId,
					},
					"contratante"
				),
				produtoMusicalName: musicalProduct.nome,
				link: budget?.id ? entityLinks.budgetRequest(budget.id) : undefined,
				payload: {
					eventTypeLabel: eventType?.label ?? "-",
					description: formData.descricao,
					date: formatDate(formData.dataEvento),

					startTime: formData.horaInicio.trim()
						? formatTime(formData.horaInicio)
						: null,
					duration: formData.duracao ? String(formData.duracao) : null,
					location: formData.local,
				},
				errorMessage: "Erro ao enviar solicitação orçamento",
				redirectToMessages: true,
				onSuccess: () => {
					handleClose();
				},
			});
		} catch (error: unknown) {
			showApiError(error, "Erro ao enviar dados. Tente novamente.");
		}
	};

	return { onSubmit };
};
