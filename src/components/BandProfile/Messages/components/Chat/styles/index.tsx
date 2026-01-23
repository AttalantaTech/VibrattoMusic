import { PropsWithChildren } from "react";
import { Check, CheckCheck } from "lucide-react";
import { useMessages } from "../../../hooks/useMessages";

export const ChatHeaderContainer = ({ children }: PropsWithChildren) => {
	return (
		<div className="bg-white border-b border-gray-200 p-4">
			<div className="flex items-center justify-between">{children}</div>
		</div>
	);
};

export const ChatMessagesContainer = ({
	children,
	messagesContainerRef,
}: PropsWithChildren & {
	messagesContainerRef: React.ForwardedRef<HTMLDivElement>;
}) => {
	return (
		<div
			ref={messagesContainerRef}
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
}: PropsWithChildren & { message: any; isOwn: boolean }) => {
	return (
		<div
			key={message.id}
			data-message-id={message.id}
			className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}
		>
			{children}
		</div>
	);
};

export const OwnMessage = ({
	message,
}: PropsWithChildren & { message: any }) => {
	const { formatMessageTime, isMessageRead } = useMessages();
	const isRead = isMessageRead(message);
	const messageReadElement =
		isRead === null ? null : isRead ? (
			<CheckCheck className="w-4 h-4 text-blue-500" />
		) : (
			<Check className="w-4 h-4 text-gray-400" />
		);

	return (
		<div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
			<div className="flex flex-col">
				<div className="bg-blue-600 text-white px-4 py-3 rounded-l-2xl rounded-tr-2xl rounded-br-md shadow-lg">
					<p className="text-sm leading-relaxed">{message.conteudo}</p>
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

export const Message = ({
	message,
	participantName,
}: {
	message: any;
	participantName: string;
}) => {
	const { getParticipantInitials, formatMessageTime } = useMessages();

	return (
		<div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
			<div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
				<span className="text-xs font-semibold text-white">
					{getParticipantInitials(message.nomeRemetente || participantName)}
				</span>
			</div>
			<div className="flex flex-col">
				<p className="text-xs font-medium text-gray-700 mb-1 px-1">
					{message.nomeRemetente || participantName}
				</p>
				<div className="bg-white border border-gray-200 px-4 py-3 rounded-r-2xl rounded-tl-2xl rounded-bl-md shadow-lg">
					<p className="text-sm text-gray-800 leading-relaxed">
						{message.conteudo}
					</p>
				</div>
				<div className="flex items-center space-x-1 mt-1 px-1">
					<p className="text-xs text-gray-500">
						{formatMessageTime(message.dataEnvio)}
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
