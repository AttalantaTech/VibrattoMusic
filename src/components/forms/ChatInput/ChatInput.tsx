import React, { useState, useRef } from "react";
import { Send } from "lucide-react";
import { cn } from "../../../lib/utils/cn";
import type { FunctionComponent } from "../../../common/types";

type ChatInputProps = {
	onSend: (message: string) => void;
	className?: string;
	value?: string;
	onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
	({ onSend, className, value, onChange, ...props }, ref): FunctionComponent => {
		const [internalValue, setInternalValue] = useState("");
		const internalRef = useRef<HTMLTextAreaElement>(null);
		
		// Use external ref if provided, otherwise use internal ref
		const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;
		
		// Determine if this is a controlled or uncontrolled component
		const isControlled = value !== undefined && onChange !== undefined;
		const currentValue = isControlled ? value : internalValue;

		const handleSend = () => {
			const messageText = isControlled ? value : textareaRef.current?.value || "";
			if (messageText.trim()) {
				onSend(messageText.trim());
				// Clear input after sending if uncontrolled
				if (!isControlled) {
					setInternalValue("");
					if (textareaRef.current) {
						textareaRef.current.value = "";
					}
				}
			}
		};

		const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
			const newValue = event.target.value;
			
			if (isControlled && onChange) {
				onChange(event);
			} else {
				setInternalValue(newValue);
			}
		};

		const handleKeyDown = (event: React.KeyboardEvent) => {
			if (event.key === "Enter" && !event.shiftKey) {
				event.preventDefault();
				handleSend();
			}
		};

		return (
			<div className={cn("flex items-center gap-2 w-full", className)}>
				{/* Text input */}
				<textarea
					ref={textareaRef}
					className="flex-1 min-h-[40px] max-h-[120px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
					placeholder="Digite sua mensagem..."
					rows={1}
					value={isControlled ? value : undefined}
					defaultValue={isControlled ? undefined : internalValue}
					onKeyDown={handleKeyDown}
					onChange={handleChange}
					{...props}
				/>

				{/* Send button */}
				<button
					aria-label="Enviar mensagem"
					className="p-2 text-blue-500 hover:text-blue-700 focus:outline-none disabled:opacity-50"
					type="button"
					onClick={handleSend}
					disabled={!currentValue?.trim()}
				>
					<Send size={20} />
				</button>
			</div>
		);
	}
);

ChatInput.displayName = "ChatInput";
