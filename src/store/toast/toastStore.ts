import { create } from "zustand";

interface Toast {
	id: string;
	message: string;
	type: "success" | "error" | "warning" | "info";
}

interface ToastState {
	toasts: Array<Toast>;
	addToast: (toast: Omit<Toast, "id">) => void;
	removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
	toasts: [],
	addToast: (toast) => {
		const id = Math.random().toString(36).substring(7);
		set((state) => ({
			toasts: [...state.toasts, { ...toast, id }],
		}));

		// Auto remove after 5 seconds
		setTimeout(() => {
			set((state) => ({
				toasts: state.toasts.filter((t) => t.id !== id),
			}));
		}, 5000);
	},
	removeToast: (id) => {
		set((state) => ({
			toasts: state.toasts.filter((t) => t.id !== id),
		}));
	},
}));
