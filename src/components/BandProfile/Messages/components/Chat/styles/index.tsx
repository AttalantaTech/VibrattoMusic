import { useRef, useState, type PropsWithChildren } from "react";
import { Check, CheckCheck, Reply } from "lucide-react";
import {
	formatMessageTime,
	getParticipantInitials,
	isCardMessage,
	isMessageRead,
} from "../../../utils/Message";
import { useAuthStore } from "@/store/authStore";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import type { Message } from "@/api/services/messages/types";
import { MessageHtml } from "@/features/message/component/MessageHtml";

// Lists typed in the chat field keep their bullets (Tailwind's reset drops
// them); break-words so a long link doesn't stretch the bubble
const MESSAGE_TEXT =
	"break-words [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5";

// The quote on top of a reply: a bar on the left, clickable (it jumps to the
// original message)
const QUOTE =
	"[&_blockquote]:mb-2 [&_blockquote]:cursor-pointer [&_blockquote]:rounded-md [&_blockquote]:border-l-4 [&_blockquote]:px-2 [&_blockquote]:py-1 [&_blockquote]:text-xs";
const OWN_QUOTE = `${QUOTE} [&_blockquote]:border-white/70 [&_blockquote]:bg-white/20`;
const OTHER_QUOTE = `${QUOTE} [&_blockquote]:border-primary-400 [&_blockquote]:bg-gray-100 [&_blockquote]:text-gray-600`;

// Swiping a message this far to the right answers it (phones, like WhatsApp)
const SWIPE_TO_REPLY = 56;
const SWIPE_MAX = 80;

/** Hover button that answers the message (mouse only; phones swipe) */
const ReplyButton = ({ onReply }: { onReply?: () => void }) =>
	onReply ? (
		<button
			type="button"
			aria-label="Responder"
			title="Responder"
			onClick={onReply}
			className="hidden shrink-0 rounded-full p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-gray-200 hover:text-gray-600 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:block"
		>
			<Reply size={16} />
		</button>
	) : null;

export const ChatContainer = ({
	children,
	isInsideConversation,
}: PropsWithChildren & { isInsideConversation: boolean }) => {
	return (
		<div
			className={`flex-1 ${isInsideConversation ? "flex" : "hidden"} md:flex flex-col`}
		>
			{children}
		</div>
	);
};

export const ChatHeaderContainer = ({ children }: PropsWithChildren) => {
	return (
		<div className="bg-white border-b border-gray-200 p-1 py-2 md:p-4">
			<div className="flex items-center justify-between">{children}</div>
		</div>
	);
};

export const ChatMessagesContainer = ({
	children,
	messagesContainerRef,
	onClick,
}: PropsWithChildren & {
	messagesContainerRef?: React.ForwardedRef<HTMLDivElement>;
	onClick?: React.MouseEventHandler<HTMLDivElement>;
}) => {
	return (
		<div
			ref={messagesContainerRef}
			onClick={onClick}
			className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
		>
			{children}
		</div>
	);
};

export const MessageLine = ({
	children,
	message,
	isOwn,
	onReply,
}: PropsWithChildren & {
	message: any;
	isOwn: boolean;
	onReply?: () => void;
}) => {
	const [offset, setOffset] = useState(0);
	const touch = useRef<{ x: number; y: number; sideways?: boolean } | null>(
		null
	);

	const handleTouchStart = (event: React.TouchEvent) => {
		const point = event.touches[0];
		if (!onReply || !point) return;
		touch.current = { x: point.clientX, y: point.clientY };
	};

	const handleTouchMove = (event: React.TouchEvent) => {
		const point = event.touches[0];
		const start = touch.current;
		if (!start || !point) return;
		const dx = point.clientX - start.x;
		const dy = point.clientY - start.y;
		// Decide once whether this is a sideways swipe or a scroll
		if (start.sideways === undefined) {
			if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
			start.sideways = dx > 0 && Math.abs(dx) > Math.abs(dy);
		}
		if (start.sideways) setOffset(Math.min(Math.max(dx, 0), SWIPE_MAX));
	};

	const handleTouchEnd = () => {
		if (offset >= SWIPE_TO_REPLY) onReply?.();
		touch.current = null;
		setOffset(0);
	};

	return (
		<div
			key={message.id}
			data-message-id={message.id}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			onTouchCancel={handleTouchEnd}
			className={`group relative flex ${isOwn ? "justify-end" : "justify-start"} mb-4 rounded-lg transition-colors duration-700`}
		>
			{offset > 0 ? (
				<Reply
					size={18}
					aria-hidden="true"
					className="absolute left-0 top-1/2 -translate-y-1/2 text-primary-500"
					style={{ opacity: offset / SWIPE_TO_REPLY }}
				/>
			) : null}
			<div
				className={`flex w-full ${isOwn ? "justify-end" : "justify-start"} ${offset ? "" : "transition-transform"}`}
				style={offset ? { transform: `translateX(${offset}px)` } : undefined}
			>
				{children}
			</div>
		</div>
	);
};

export const OwnMessageElement = ({
	message,
	onReply,
}: PropsWithChildren & { message: Message; onReply?: () => void }) => {
	const { user } = useAuthStore();
	const { activeProduct } = useMusicalProductStore();
	const isRead = isMessageRead(message, {
		userId: user?.id,
		productId: activeProduct?.id,
	});
	const messageReadElement =
		isRead === null ? null : isRead ? (
			<CheckCheck className="w-4 h-4 text-primary-500" />
		) : (
			<Check className="w-4 h-4 text-gray-400" />
		);

	// Phones: cards take the whole width; at 80% their text wrapped every
	// two or three words
	const isCard = isCardMessage(message);

	return (
		<div
			className={`flex items-end space-x-2 ${isCard ? "w-full sm:w-auto sm:max-w-[80%]" : "max-w-[80%]"}`}
		>
			<div className={`flex flex-col items-end ${isCard ? "w-full" : ""}`}>
				<div
					className={`flex items-center gap-1 ${isCard ? "w-full justify-end" : ""}`}
				>
					<ReplyButton onReply={onReply} />
					<div
						className={`bg-primary-400 text-white py-3 rounded-l-2xl rounded-tr-2xl rounded-br-md shadow-lg ${isCard ? "w-full px-3 sm:px-4" : "px-4"}`}
					>
						<div className="text-sm leading-relaxed">
							<MessageHtml
								html={message.conteudo}
								className={`${MESSAGE_TEXT} ${OWN_QUOTE}`}
							/>
						</div>
					</div>
				</div>
				<div className="flex items-center justify-end space-x-1 mt-1 px-1">
					<p className="text-xs text-gray-500">
						{formatMessageTime(message.dataEnvio)}
					</p>
					{messageReadElement}
				</div>
			</div>
		</div>
	);
};

export const MessageElement = ({
	message,
	userName,
	userProfileImageUrl,
	onReply,
}: {
	message: Message;
	userName: string;
	userProfileImageUrl?: string | null;
	onReply?: () => void;
}) => {
	return (
		<div className="flex items-start w-full space-x-3">
			<div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex-shrink-0 shadow-md">
				<span className="w-full h-full text-xs font-semibold text-white flex items-center justify-center">
					{userProfileImageUrl ? (
						<img
							src={userProfileImageUrl}
							alt={userName}
							className="w-full h-full object-cover rounded-full"
						/>
					) : (
						getParticipantInitials(userName || "U")
					)}
				</span>
			</div>
			{/* min-w-0 flex-1: the column sized to its content, and the bubble's
			    80% applied on top of it squeezed cards to ~190px on phones */}
			<div className="flex min-w-0 flex-1 flex-col items-start">
				<p className="text-xs font-medium text-gray-700 mb-1 px-1">
					{userName}
				</p>
				<div className="flex w-full items-center gap-1">
					<div
						className={`bg-white border border-gray-200 py-3 rounded-r-2xl rounded-tl-2xl rounded-bl-md shadow-lg ${
							isCardMessage(message)
								? "w-full px-3 sm:w-auto sm:max-w-[80%] sm:px-4"
								: "max-w-[80%] px-4"
						}`}
					>
						<div className="text-sm text-gray-800 leading-relaxed">
							<MessageHtml
								html={message.conteudo}
								className={`${MESSAGE_TEXT} ${OTHER_QUOTE}`}
							/>
						</div>
					</div>
					<ReplyButton onReply={onReply} />
				</div>
				<div className="flex items-center space-x-1 mt-1 px-1">
					<p className="text-xs text-gray-500">
						{formatMessageTime(message.dataEnvio, { long: true })}
					</p>
				</div>
			</div>
		</div>
	);
};

export const ChatInputContainer = ({ children }: PropsWithChildren) => {
	return (
		<div className="bg-white border-t border-gray-200 p-4">{children}</div>
	);
};
