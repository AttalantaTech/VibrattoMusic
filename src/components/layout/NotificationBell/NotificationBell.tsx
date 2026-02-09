import { Bell } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../../store/authStore";

interface Notification {
	id: string;
	type: string;
	message: string;
	timestamp: string;
	read: boolean;
}

export const NotificationBell = () => {
	const { isAuthenticated } = useAuthStore();
	const [unreadCount, setUnreadCount] = useState(0);
	const [notifications, setNotifications] = useState<Array<Notification>>([]);
	const [showNotificationDropdown, setShowNotificationDropdown] =
		useState(false);
	const notificationRef = useRef<HTMLDivElement>(null);

	// Click outside to close dropdown
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				notificationRef.current &&
				!notificationRef.current.contains(event.target as Node)
			) {
				setShowNotificationDropdown(false);
			}
		};

		if (showNotificationDropdown) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showNotificationDropdown]);

	// Handle notification actions
	const markAsRead = (notificationId: string) => {
		setNotifications((previous) =>
			previous.map((notification) =>
				notification.id === notificationId
					? { ...notification, read: true }
					: notification
			)
		);
		setUnreadCount((previous) => Math.max(0, previous - 1));
	};

	const markAllAsRead = () => {
		setNotifications((previous) =>
			previous.map((notification) => ({ ...notification, read: true }))
		);
		setUnreadCount(0);
	};

	const toggleNotificationDropdown = () => {
		setShowNotificationDropdown((previous) => !previous);
	};

	// Don't render if not authenticated
	if (!isAuthenticated) {
		return null;
	}

	return (
		<div ref={notificationRef} className="relative">
			<button
				className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
				onClick={toggleNotificationDropdown}
				aria-label="Notificações"
			>
				<Bell color="#667085" size={20} />
				{unreadCount > 0 && (
					<div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
						{unreadCount > 9 ? "9+" : unreadCount}
					</div>
				)}
			</button>

			{/* Notification Dropdown */}
			{showNotificationDropdown && (
				<>
					{/* Mobile backdrop */}
					<div className="fixed inset-0 bg-black bg-opacity-25 z-40 sm:hidden" />

					{/* Dropdown */}
					<div className="absolute right-0 top-12 w-screen max-w-sm sm:w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mx-4 sm:mx-0">
						{/* Header */}
						<div className="p-3 sm:p-4 border-b border-gray-200">
							<div className="flex justify-between items-center">
								<h3 className="font-semibold text-gray-900 text-base sm:text-lg">
									Notificações
								</h3>
								{unreadCount > 0 && (
									<button
										className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap"
										onClick={markAllAsRead}
									>
										Marcar todas como lidas
									</button>
								)}
							</div>
							{/* Close button for mobile */}
							<button
								className="absolute top-3 right-3 sm:hidden p-1 rounded-full hover:bg-gray-100"
								onClick={() => {
									setShowNotificationDropdown(false);
								}}
								aria-label="Fechar notificações"
							>
								<svg
									className="w-4 h-4"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
										clipRule="evenodd"
									/>
								</svg>
							</button>
						</div>

						{/* Notifications list */}
						<div className="max-h-64 sm:max-h-80 overflow-y-auto">
							{notifications.length === 0 ? (
								<div className="p-6 sm:p-8 text-center text-gray-500">
									<div className="mb-2">
										<Bell className="mx-auto w-8 h-8 text-gray-400" />
									</div>
									<p className="text-sm">Nenhuma notificação disponível</p>
								</div>
							) : (
								notifications.map((notification) => (
									<div
										key={notification.id}
										className={`p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
											!notification.read ? "bg-blue-50" : ""
										}`}
										onClick={() => {
											markAsRead(notification.id);
										}}
									>
										<div className="flex justify-between items-start gap-3">
											<div className="flex-1 min-w-0">
												<p className="text-sm text-gray-900 break-words">
													{notification.message}
												</p>
												<p className="text-xs text-gray-500 mt-1">
													{new Date(notification.timestamp).toLocaleString(
														"pt-BR",
														{
															day: "2-digit",
															month: "2-digit",
															year: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														}
													)}
												</p>
											</div>
											{!notification.read && (
												<div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
											)}
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</>
			)}
		</div>
	);
};
