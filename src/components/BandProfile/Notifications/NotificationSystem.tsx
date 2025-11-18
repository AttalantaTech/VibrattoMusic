import type React from "react";
import { useState, useRef, useEffect } from "react";
import {
	Bell,
	X,
	Check,
	CheckCheck,
	Settings,
	Calendar,
	MessageCircle,
	DollarSign,
} from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { TabNavigation } from "../../ui/TabNavigation/TabNavigation";
import {
	useNotifications,
	useUnreadNotificationCount,
	useMarkNotificationAsRead,
	useMarkAllNotificationsAsRead,
} from "../../../hooks/useMessaging";
import type { Notification } from "../../../api/types";

const tabs = [
	{ label: "Todas", value: "all" },
	{ label: "Contratações", value: "booking" },
	{ label: "Mensagens", value: "message" },
	{ label: "Sistema", value: "system" },
];

interface NotificationItemProps {
	notification: Notification;
	onMarkAsRead: (id: string) => void;
	onDelete: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
	notification,
	onMarkAsRead,
	onDelete,
}) => {
	const getIcon = () => {
		switch (notification.type) {
			case "booking":
				return <Calendar className="w-5 h-5 text-blue-500" />;
			case "message":
				return <MessageCircle className="w-5 h-5 text-green-500" />;
			case "payment":
				return <DollarSign className="w-5 h-5 text-green-600" />;
			case "system":
				return <Bell className="w-5 h-5 text-gray-500" />;
			default:
				return <Bell className="w-5 h-5 text-gray-500" />;
		}
	};

	const getTitle = () => {
		switch (notification.type) {
			case "booking":
				return "Nova Contratação";
			case "message":
				return "Nova Mensagem";
			case "payment":
				return "Pagamento";
			case "system":
				return "Sistema";
			default:
				return "Notificação";
		}
	};

	return (
		<div
			className={`
			p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors
			${!notification.read ? "bg-blue-50 border-blue-100" : ""}
		`}
		>
			<div className="flex items-start gap-3">
				{/* Icon */}
				<div className="flex-shrink-0 mt-1">{getIcon()}</div>

				{/* Content */}
				<div className="flex-1 min-w-0">
					<div className="flex items-start justify-between mb-1">
						<h4
							className={`font-medium text-sm ${!notification.read ? "text-gray-900" : "text-gray-700"}`}
						>
							{getTitle()}
						</h4>
						<div className="flex items-center gap-1 ml-2">
							{!notification.read && (
								<button
									onClick={() => {
										onMarkAsRead(notification.id);
									}}
									className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
									title="Marcar como lida"
								>
									<Check className="w-3 h-3" />
								</button>
							)}
							<button
								onClick={() => {
									onDelete(notification.id);
								}}
								className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-red-600"
								title="Excluir"
							>
								<X className="w-3 h-3" />
							</button>
						</div>
					</div>

					<p
						className={`text-sm mb-2 ${!notification.read ? "text-gray-800" : "text-gray-600"}`}
					>
						{notification.message}
					</p>

					<div className="flex items-center justify-between">
						<span className="text-xs text-gray-500">
							{new Date(notification.createdAt).toLocaleDateString("pt-BR", {
								day: "2-digit",
								month: "2-digit",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</span>

						{!notification.read && (
							<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

interface NotificationDropdownProps {
	isOpen: boolean;
	onClose: () => void;
	unreadCount: number;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
	isOpen,
	onClose,
	unreadCount,
}) => {
	const [currentTab, setCurrentTab] = useState("all");
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Fetch notifications
	const { data: notificationsData, isLoading } = useNotifications({
		page: 1,
		limit: 20,
		tipo: currentTab === "all" ? undefined : currentTab,
	});

	// Mutations
	const markAsReadMutation = useMarkNotificationAsRead();
	const markAllAsReadMutation = useMarkAllNotificationsAsRead();

	const notifications = notificationsData?.data || [];

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen, onClose]);

	const handleMarkAsRead = async (id: string) => {
		try {
			await markAsReadMutation.mutateAsync(Number(id));
		} catch (error) {
			console.error("Error marking notification as read:", error);
		}
	};

	const handleMarkAllAsRead = async () => {
		try {
			await markAllAsReadMutation.mutateAsync();
		} catch (error) {
			console.error("Error marking all notifications as read:", error);
		}
	};

	const handleDelete = (/* id: string */) => {
		// TODO: Implement delete functionality
	};

	if (!isOpen) return null;

	return (
		<div
			ref={dropdownRef}
			className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden"
		>
			{/* Header */}
			<div className="p-4 border-b border-gray-200">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-lg font-semibold text-gray-900">
						Notificações
						{unreadCount > 0 && (
							<span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
								{unreadCount}
							</span>
						)}
					</h3>
					<div className="flex items-center gap-2">
						{unreadCount > 0 && (
							<Button
								variant="outline"
								size="sm"
								onClick={handleMarkAllAsRead}
								disabled={markAllAsReadMutation.isPending}
								className="text-xs"
							>
								<CheckCheck className="w-3 h-3 mr-1" />
								Marcar todas como lidas
							</Button>
						)}
						<Button variant="outline" size="sm" className="p-2">
							<Settings className="w-4 h-4" />
						</Button>
					</div>
				</div>

				<TabNavigation
					currentTab={currentTab}
					tabs={tabs}
					onChange={setCurrentTab}
					variant="underline"
				/>
			</div>

			{/* Notifications List */}
			<div className="max-h-80 overflow-y-auto">
				{isLoading ? (
					<div className="flex items-center justify-center h-20">
						<div className="text-gray-500 text-sm">
							Carregando notificações...
						</div>
					</div>
				) : notifications.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-20 text-gray-500">
						<Bell className="w-6 h-6 mb-2 text-gray-300" />
						<p className="text-sm">Nenhuma notificação</p>
					</div>
				) : (
					notifications.map((notification) => (
						<NotificationItem
							key={notification.id}
							notification={notification}
							onMarkAsRead={handleMarkAsRead}
							onDelete={handleDelete}
						/>
					))
				)}
			</div>

			{/* Footer */}
			{notifications.length > 0 && (
				<div className="p-3 border-t border-gray-200 text-center">
					<Button variant="outline" size="sm" className="w-full">
						Ver todas as notificações
					</Button>
				</div>
			)}
		</div>
	);
};

interface NotificationBellProps {
	className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
	className = "",
}) => {
	const [isOpen, setIsOpen] = useState(false);

	// Fetch unread count
	const { data: unreadData } = useUnreadNotificationCount();
	const unreadCount = unreadData?.count || 0;

	return (
		<div className={`relative ${className}`}>
			<button
				onClick={() => {
					setIsOpen(!isOpen);
				}}
				className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
			>
				<Bell className="w-6 h-6" />
				{unreadCount > 0 && (
					<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-5 h-5 rounded-full flex items-center justify-center px-1">
						{unreadCount > 99 ? "99+" : unreadCount}
					</span>
				)}
			</button>

			<NotificationDropdown
				isOpen={isOpen}
				onClose={() => {
					setIsOpen(false);
				}}
				unreadCount={unreadCount}
			/>
		</div>
	);
};
