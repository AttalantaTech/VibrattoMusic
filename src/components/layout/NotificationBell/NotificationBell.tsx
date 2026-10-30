import { Bell, CalendarClock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { useAuthStore } from "../../../store/authStore";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { usePreReservations } from "@/hooks/usePreReservations";

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
	const navigate = useNavigate();

	// Pending tasks, not messages: dates promised by accepted proposals that
	// the professional hasn't blocked in the agenda. They leave the list once
	// the event is saved, so they can't be marked as read
	const { activeProduct } = useMusicalProductStore();
	const preReservations = usePreReservations(
		isAuthenticated ? activeProduct?.id : undefined
	);
	const badgeCount = unreadCount + preReservations.length;

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
				<Bell color="#667085" className="w-4 h-4 sm:w-5 sm:h-5" />
				{badgeCount > 0 && (
					<div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
						{badgeCount > 9 ? "9+" : badgeCount}
					</div>
				)}
			</button>

			{/* Notification Dropdown */}
			{showNotificationDropdown && (
				<>
					{/* Mobile backdrop */}
					<div className="fixed inset-0 bg-black bg-opacity-25 z-40 sm:hidden" />

					{/* Dropdown */}
					{/* Phones: pinned to the screen edges (anchored to the bell it
					    went past the left side); from sm up, under the bell */}
					<div className="fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
						{/* Header */}
						<div className="p-3 sm:p-4 border-b border-gray-200">
							<div className="flex justify-between items-center">
								<h3 className="font-semibold text-gray-900 text-base sm:text-lg">
									Notificações
								</h3>
								{unreadCount > 0 && (
									<button
										className="text-xs sm:text-sm text-primary-600 hover:text-primary-800 transition-colors whitespace-nowrap"
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
							{preReservations.map((reservation) => (
								<button
									key={reservation.proposal.id}
									type="button"
									className="flex w-full items-start gap-3 border-b border-gray-100 bg-[#EFF8FF] p-3 text-left transition-colors hover:bg-[#D1E9FF] sm:p-4"
									onClick={() => {
										setShowNotificationDropdown(false);
										void navigate({
											to: "/band/me",
											search: { tab: "bookings" },
										});
									}}
								>
									<CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-[#175CD3]" />
									<span className="min-w-0 flex-1">
										<span className="block text-sm font-medium text-gray-900">
											Pré-reserva em{" "}
											{format(parseISO(reservation.date), "dd/MM/yyyy")}
										</span>
										<span className="block truncate text-xs text-gray-600">
											{reservation.proposal.tipoEvento?.nome} ·{" "}
											{reservation.client}
										</span>
										<span className="mt-1 block text-xs font-medium text-[#175CD3]">
											Confirme a reserva na agenda
										</span>
									</span>
								</button>
							))}
							{notifications.length === 0 && preReservations.length === 0 ? (
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
											!notification.read ? "bg-primary-50" : ""
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
												<div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1" />
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
