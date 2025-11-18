import { useToastStore } from "../store/toast/toastStore";

export const useNotification = () => {
	const { addToast } = useToastStore();

	return {
		success: (message: string) => {
			addToast({ message, type: "success" });
		},
		error: (message: string) => {
			addToast({ message, type: "error" });
		},
		warning: (message: string) => {
			addToast({ message, type: "warning" });
		},
		info: (message: string) => {
			addToast({ message, type: "info" });
		},
	};
};
