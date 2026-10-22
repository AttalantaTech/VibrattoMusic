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
import { showApiError } from "@/utils/showApiError";

interface CheckAvailabilitySubmit {
	musicalProduct: MusicalProductApiResponse | null;
	tipoEventoOptions: Array<Option>;
	hasDefineEventTime: boolean;
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
	hasDefineEventTime,
	handleClose,
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
			idProdutoMusicalContratante: musicalProduct.id,
			idTipoEvento: formData.idTipoEvento,
			descricao: formData.descricao || "",
			local: formData.local,
			dataEvento: combineDateTime(
				String(formData.dataEvento || "").trim(),
				String(formData.horaInicio || "").trim()
			),
			duracao: hasDefineEventTime ? formData.duracao : null,
			horaInicio: hasDefineEventTime
				? ensureHHMMSS(String(formData.horaInicio || "").trim())
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
				recipientId: musicalProduct.id,
				recipientName: musicalProduct.nome,
				link: budget?.id ? entityLinks.proposalTab(budget.id) : undefined,
				payload: {
					eventTypeLabel: eventType?.label ?? "-",
					description: formData.descricao,
					date: formatDate(formData.dataEvento),

					startTime: hasDefineEventTime
						? formatTime(formData.horaInicio)
						: null,
					duration:
						hasDefineEventTime && formData.duracao
							? String(formData.duracao)
							: null,
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
