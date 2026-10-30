import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Send, Smile, Type } from "lucide-react";
import {
	BtnBold,
	BtnBulletList,
	BtnItalic,
	BtnUnderline,
	Editor,
	EditorProvider,
	Toolbar,
} from "react-simple-wysiwyg";
import type { EmojiClickData } from "emoji-picker-react";
import { cn } from "../../../lib/utils/cn";
import { chatMessageHtml } from "@/features/message/utils/chatMessageHtml";

// The picker and its Portuguese names (search "festa", "música") only load
// when someone opens it
const EmojiPicker = lazy(async () => {
	const [{ default: Picker, Categories }, { default: portuguese }] =
		await Promise.all([
			import("emoji-picker-react"),
			import("emoji-picker-react/dist/data/emojis-pt"),
		]);
	return {
		default: (props: { onEmojiClick: (emoji: EmojiClickData) => void }) => (
			<Picker
				emojiData={portuguese}
				searchPlaceholder="Pesquisar emoji"
				previewConfig={{ showPreview: false }}
				lazyLoadEmojis
				width="100%"
				height={360}
				categories={[
					{ category: Categories.SUGGESTED, name: "Usados recentemente" },
					{ category: Categories.SMILEYS_PEOPLE, name: "Rostos e pessoas" },
					{ category: Categories.ANIMALS_NATURE, name: "Animais e natureza" },
					{ category: Categories.FOOD_DRINK, name: "Comidas e bebidas" },
					{ category: Categories.TRAVEL_PLACES, name: "Viagens e lugares" },
					{ category: Categories.ACTIVITIES, name: "Atividades" },
					{ category: Categories.OBJECTS, name: "Objetos" },
					{ category: Categories.SYMBOLS, name: "Símbolos" },
					{ category: Categories.FLAGS, name: "Bandeiras" },
				]}
				{...props}
			/>
		),
	};
});

type ChatInputProps = {
	onSend: (html: string) => void;
	/** The message being typed, as HTML (bold, italic, lists, line breaks) */
	value?: string;
	onChange?: (html: string) => void;
	disabled?: boolean;
	placeholder?: string;
	className?: string;
};

const toolbarButton =
	"!inline-flex !h-8 !w-8 items-center justify-center rounded [&_svg]:h-4 [&_svg]:w-4";

/**
 * Chat message field: formatting behind the "Aa" button and an emoji picker.
 * Enter sends and Shift+Enter breaks the line (inside a list, Enter adds an
 * item). It was a plain textarea whose line breaks were lost on screen
 */
export const ChatInput = ({
	onSend,
	value,
	onChange,
	disabled = false,
	placeholder = "Digite sua mensagem...",
	className,
}: ChatInputProps) => {
	const [internalValue, setInternalValue] = useState("");
	const [showFormatting, setShowFormatting] = useState(false);
	const [showEmoji, setShowEmoji] = useState(false);

	const editorRef = useRef<HTMLDivElement>(null);
	const emojiRef = useRef<HTMLDivElement>(null);
	// Where the caret was, so an emoji lands there and not at the end
	const savedRange = useRef<Range | null>(null);

	const html = value ?? internalValue;
	const message = chatMessageHtml(html);

	const setHtml = (next: string) => {
		if (onChange) onChange(next);
		if (value === undefined) setInternalValue(next);
	};

	const send = () => {
		if (!message || disabled) return;
		onSend(message);
		if (value === undefined) setInternalValue("");
		setShowEmoji(false);
	};

	const saveCaret = () => {
		const selection = window.getSelection();
		const editor = editorRef.current;
		if (!selection?.rangeCount || !editor) return;
		const range = selection.getRangeAt(0);
		if (editor.contains(range.startContainer)) {
			savedRange.current = range.cloneRange();
		}
	};

	// Inserted straight into the text, without focusing it: focusing would pop
	// the phone keyboard over the picker
	const insertEmoji = ({ emoji }: EmojiClickData) => {
		const editor = editorRef.current;
		if (!editor) return;

		let range = savedRange.current;
		if (!range || !editor.contains(range.startContainer)) {
			range = document.createRange();
			range.selectNodeContents(editor);
			range.collapse(false);
		}

		range.deleteContents();
		const node = document.createTextNode(emoji);
		range.insertNode(node);
		range.setStartAfter(node);
		range.collapse(true);
		savedRange.current = range;

		// The editor picks up the change as if it had been typed
		editor.dispatchEvent(new Event("input", { bubbles: true }));
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
		if (event.key !== "Enter" || event.shiftKey) return;
		const anchor = window.getSelection()?.anchorNode;
		const inList =
			(anchor instanceof Element ? anchor : anchor?.parentElement)?.closest(
				"li"
			) != null;
		if (inList) return;
		event.preventDefault();
		send();
	};

	useEffect(() => {
		if (!showEmoji) return;

		const close = (event: MouseEvent | KeyboardEvent) => {
			if (event instanceof KeyboardEvent) {
				if (event.key === "Escape") setShowEmoji(false);
				return;
			}
			if (!emojiRef.current?.contains(event.target as Node)) {
				setShowEmoji(false);
			}
		};

		document.addEventListener("mousedown", close);
		document.addEventListener("keydown", close);
		return () => {
			document.removeEventListener("mousedown", close);
			document.removeEventListener("keydown", close);
		};
	}, [showEmoji]);

	return (
		<EditorProvider>
			<div className={cn("relative flex w-full flex-col gap-1", className)}>
				{showFormatting ? (
					<Toolbar className="w-fit gap-0.5 !rounded-md !border !border-gray-200 !bg-gray-50 p-0.5">
						<BtnBold title="Negrito" className={toolbarButton} />
						<BtnItalic title="Itálico" className={toolbarButton} />
						<BtnUnderline title="Sublinhado" className={toolbarButton} />
						<BtnBulletList title="Lista" className={toolbarButton} />
					</Toolbar>
				) : null}

				<div className="flex w-full items-end gap-1">
					<div ref={emojiRef} className="flex">
						<button
							type="button"
							aria-label="Inserir emoji"
							aria-expanded={showEmoji}
							disabled={disabled}
							className="flex h-10 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
							onClick={() => {
								setShowEmoji((open) => !open);
							}}
						>
							<Smile size={20} />
						</button>

						{showEmoji ? (
							<div className="absolute bottom-full left-0 z-50 mb-2 w-full max-w-[352px] overflow-hidden rounded-lg shadow-xl">
								<Suspense
									fallback={
										<div className="flex h-[360px] items-center justify-center bg-white text-sm text-gray-500">
											Carregando emojis...
										</div>
									}
								>
									<EmojiPicker onEmojiClick={insertEmoji} />
								</Suspense>
							</div>
						) : null}
					</div>

					<button
						type="button"
						aria-label="Formatar texto"
						aria-pressed={showFormatting}
						disabled={disabled}
						className={cn(
							"flex h-10 w-9 items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-50",
							showFormatting ? "text-primary-600" : "text-gray-500"
						)}
						onClick={() => {
							setShowFormatting((open) => !open);
						}}
					>
						<Type size={20} />
					</button>

					<div className="min-w-0 flex-1">
						<Editor
							ref={editorRef}
							value={html}
							onChange={(event) => {
								setHtml(event.target.value);
							}}
							onKeyDown={handleKeyDown}
							onKeyUp={saveCaret}
							onMouseUp={saveCaret}
							onBlur={saveCaret}
							disabled={disabled}
							placeholder={placeholder}
							aria-label="Mensagem"
							role="textbox"
							aria-multiline="true"
							aria-disabled={disabled}
							containerProps={{
								className:
									"!min-h-0 !rounded-lg !border-gray-300 bg-white focus-within:!border-primary-500",
							}}
							className="max-h-[120px] min-h-[40px] !px-4 !py-2 text-sm leading-6 !outline-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
						/>
					</div>

					<button
						aria-label="Enviar mensagem"
						className="flex h-10 w-10 items-center justify-center text-primary-500 hover:text-primary-700 focus:outline-none disabled:opacity-50"
						type="button"
						onClick={send}
						disabled={!message || disabled}
					>
						<Send size={20} />
					</button>
				</div>
			</div>
		</EditorProvider>
	);
};
