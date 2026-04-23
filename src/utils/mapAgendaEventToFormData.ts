import type { ScheduleApiResponse } from "@/api/types";
import type { AgendaEvent } from "@/components/BandProfile/Agenda";
import { calculateEndTime } from "@/components/BandProfile/Agenda/utils";
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
			endTime: comp.horaFim
				? calculateEndTime(comp.horaInicio, comp.horaFim)
				: "",
			availabilityOtherEvents: comp.disponibilidadeOutrosEventos,
			location: comp.localizacao ?? "",
		}))
	);
};
