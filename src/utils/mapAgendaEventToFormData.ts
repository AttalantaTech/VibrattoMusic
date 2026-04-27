import type { ScheduleApiResponse } from "@/api/types";
import type { AgendaEvent } from "@/components/BandProfile/Agenda";
import { parseISO } from "date-fns";

export const mapAgendaEventToFormData = (
	data: Array<ScheduleApiResponse>
): Array<AgendaEvent> => {
	return data.flatMap((day) =>
		day.compromissos.map((comp) => ({
			id: comp.id,
			title: comp.titulo,
			description: comp.descricao || "",
			date: parseISO(day.data),
			startTime: comp.horaInicio ?? "",
			endTime: comp.horaFim ?? "",
			availabilityOtherEvents: comp.disponibilidadeOutrosEventos,
			location: comp.localizacao ?? "",
		}))
	);
};
