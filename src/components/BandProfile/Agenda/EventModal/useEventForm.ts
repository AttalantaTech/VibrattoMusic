import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import type { AgendaEvent } from "../types";
import z from "zod";
import { useEffect } from "react";

const createAndEditEventValidationSchema = z.object({
	title: z.string().min(2, "o Título é muito curto"),
	description: z.string().optional(),
	date: z.string(),
	startTime: z.string(),
	endTime: z.string(),
	location: z.string(),
	reminder: z.string(),
	availabilityOtherEvents: z.boolean(),
});

export type EventForm = z.infer<typeof createAndEditEventValidationSchema>;

export interface EventFormProps {
	onClose: () => void;
	onSubmit: (event: AgendaEvent) => void;
	initialDate?: Date | null;
	initialStartTime?: string;
	initialEndTime?: string;
	selectedEventsDay?: Array<AgendaEvent> | null;
	currentEvent: AgendaEvent | null;
}

export const useEventForm = ({
	initialDate,
	currentEvent,
	onSubmit,
}: EventFormProps) => {
	const form = useForm<EventForm>({
		resolver: zodResolver(createAndEditEventValidationSchema),
		defaultValues: {
			title: "",
			description: "",
			date: initialDate
				? format(initialDate, "yyyy-MM-dd")
				: format(new Date(), "yyyy-MM-dd"),
			startTime: "",
			endTime: "",
			location: "",
			availabilityOtherEvents: false,
			reminder: "15",
		},
	});

	const { watch, setValue, reset } = form;

	const startTime = watch("startTime");

	const setQuickDuration = (minutes: number) => {
		const [h = 0, m = 0] = startTime
			? startTime.split(":").map(Number)
			: "".split("").map(Number);

		const date = new Date();
		date.setHours(h, m);

		const end = new Date(date.getTime() + minutes * 60000);

		setValue("endTime", format(end, "HH:mm"));
	};

	const resetForm = () => {
		reset({
			title: "",
			description: "",
			date: initialDate
				? format(initialDate, "yyyy-MM-dd")
				: format(new Date(), "yyyy-MM-dd"),
			startTime: "",
			endTime: "",
			location: "",
			availabilityOtherEvents: false,
			reminder: "15",
		});
	};

	const handleSubmitEvent = (data: EventForm) => {
		const event: AgendaEvent = {
			id: currentEvent?.id ?? 0,
			title: data.title,
			description: data.description,
			date: new Date(
				`${data.date}${data.startTime ? `T${data.startTime}` : "T00:00"}`
			),
			startTime: data.startTime,
			endTime: data.endTime,
			location: data.location,
			availabilityOtherEvents: data.availabilityOtherEvents,
		};

		onSubmit(event);
	};

	useEffect(() => {
		if (currentEvent) {
			reset({
				title: currentEvent.title || "",
				description: currentEvent.description || "",
				date: currentEvent.date
					? format(currentEvent.date, "yyyy-MM-dd")
					: initialDate
						? format(initialDate, "yyyy-MM-dd")
						: format(new Date(), "yyyy-MM-dd"),
				startTime: currentEvent.startTime || "",
				endTime: currentEvent.endTime || "",
				location: currentEvent.location || "",
				availabilityOtherEvents: currentEvent.availabilityOtherEvents || false,
				reminder: "15",
			});
		} else {
			resetForm();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentEvent, initialDate]);

	return {
		form,
		setQuickDuration,
		handleSubmitEvent,
		resetForm,
	};
};
