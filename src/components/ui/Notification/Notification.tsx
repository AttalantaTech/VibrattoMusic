import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useToastStore } from "../../../store/toast/toastStore";

const TOAST_ICONS = {
	success: CheckCircle,
	error: AlertCircle,
	warning: AlertTriangle,
	info: Info,
};

const TOAST_STYLES = {
	success: "bg-green-50 border-green-200 text-green-800",
	error: "bg-red-50 border-red-200 text-red-800",
	warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
	info: "bg-primary-50 border-primary-200 text-primary-800",
};

export const NotificationContainer = () => {
	const { toasts, removeToast } = useToastStore();

	return (
		<div className="fixed top-4 right-4 z-50 space-y-2">
			{toasts.map((toast) => {
				const Icon = TOAST_ICONS[toast.type];
				const styles = TOAST_STYLES[toast.type];

				return (
					<div
						key={toast.id}
						className={`${styles} border rounded-lg p-4 shadow-lg min-w-80 max-w-md animate-in slide-in-from-right-full duration-300`}
					>
						<div className="flex items-start gap-3">
							<Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
							<p className="text-sm font-medium flex-1">{toast.message}</p>{" "}
							<button
								onClick={() => {
									removeToast(toast.id);
								}}
								className="text-gray-400 hover:text-gray-600 transition-colors"
							>
								<X className="w-4 h-4" />
							</button>
						</div>
					</div>
				);
			})}
		</div>
	);
};
