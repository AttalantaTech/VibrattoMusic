import { toast } from "sonner";
import type { CheckAvailabilityForm } from "../schemas/checkAvailability.schema";
import type {
	CreateBudgetRequest,
	MusicalProductApiResponse,
} from "@/api/types";
import type { Option } from "@/components/forms/Select/Select";
import { messagingKeys, useStartConversation } from "@/hooks/useMessaging";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { useNavigate } from "@tanstack/react-router";
import { combineDateTime, ensureHHMMSS } from "@/utils";
import { useCreateBudget } from "@/hooks/useProposals";
import { useQueryClient } from "@tanstack/react-query";
import { VibrattoApiError } from "@/api";

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

const buildMessage = (
	formData: CheckAvailabilityForm,
	musicalProduct: MusicalProductApiResponse | null,
	tipoEventoOptions: Array<Option>
): string => {
	const selectedEventType = formData.idTipoEvento;

	const eventType = tipoEventoOptions.find(
		(event) => Number(event.value) === selectedEventType
	);

	const timesFormatted = formData.horaInicio
		? `${formatTime(formData.horaInicio)}\n`
		: `Não definido`;

	const durationFormatted = formData.horaInicio
		? `${formData.horaInicio + ":00"}\n`
		: `Não definido`;

	return [
		`Olá ${musicalProduct?.nome ?? ""}, que boa notícia! Você recebeu uma solicitação de orçamento :`,
		`🎵 Tipo de Evento: ${eventType?.label ?? "-"}`,
		`📝 Descrição: ${formData.descricao}`,
		`📅 Data: ${formatDate(formData.dataEvento)}`,
		`⏰ Horário de início: ${timesFormatted}`,
		`⏰ Duração: ${durationFormatted}`,
		`📍 Local: ${formData.local}`,
	]
		.filter(Boolean)
		.join("\n");
};

export const useCheckAvailabilitySubmit = ({
	musicalProduct,
	tipoEventoOptions,
	hasDefineEventTime,
	handleClose,
}: CheckAvailabilitySubmit) => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { activeProduct } = useMusicalProductStore();
	const { mutate: startConversation } = useStartConversation();
	const createBudgetMutation = useCreateBudget();

	const onSubmit = async (formData: CheckAvailabilityForm) => {
		if (!musicalProduct) {
			toast.error(
				"Não foi possível prossegur com a verificação de disponibilidade."
			);
			return;
		}

		const content = buildMessage(formData, musicalProduct, tipoEventoOptions);

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
			await createBudgetMutation.mutateAsync({
				productId: musicalProduct.id,
				data: budgetData,
			});

			startConversation(
				{
					participanteId: musicalProduct.id,
					conteudo: content,
					senderType: activeProduct?.id ? 2 : 1,
					produtoMusicalContratanteId: activeProduct?.id || null,
				},
				{
					onSuccess: () => {
						toast.success("Orçamento Solicitado.");

						void navigate({ to: "/band/me", search: { tab: "messages" } });
						handleClose();
					},
					onError: () => {
						toast.error("Erro ao enviar solicitação orçamento");
					},
				}
			);

			// Invalidate conversations to update sidebar with new proposal message
			void queryClient.invalidateQueries({
				queryKey: messagingKeys.conversations(),
			});

			handleClose();
		} catch (error) {
			if (error instanceof VibrattoApiError) {
				const errorMessage = error.data?.erros.find((error_) => error_);

				if (error.statusCode === 500) {
					toast.error(
						"Erro interno do servidor. Por favor, verifique os dados e tente novamente."
					);
					return;
				} else if (errorMessage) {
					toast.error(errorMessage);
					return;
				}
				toast.error("Erro ao enviar dados. Tente novamente.");
			}
		}
	};

	return { onSubmit };
};
