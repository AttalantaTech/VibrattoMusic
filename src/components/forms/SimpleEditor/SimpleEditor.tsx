"use client";

import type { ContentEditableEvent } from "react-simple-wysiwyg";
import {
	Editor,
	EditorProvider,
	Toolbar,
	BtnBold,
	BtnItalic,
	BtnUnderline,
	BtnBulletList,
	BtnNumberedList,
	BtnLink,
	BtnUndo,
	BtnRedo,
} from "react-simple-wysiwyg";
import { forwardRef, useImperativeHandle, useState } from "react";

export type SimpleEditorRef = {
	getHTML: () => string;
	setHTML: (html: string) => void;
};

type SimpleEditorProps = {
	value?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	className?: string;
};

export const SimpleEditor = forwardRef<SimpleEditorRef, SimpleEditorProps>(
	({ value = "", onChange, placeholder, className }, ref) => {
		const [currentValue, setCurrentValue] = useState(value);

		useImperativeHandle(ref, () => ({
			getHTML: () => currentValue,
			setHTML: (html: string) => {
				setCurrentValue(html);
			},
		}));

		const handleChange = (event: ContentEditableEvent) => {
			const html = event.target.value;
			setCurrentValue(html);
			onChange?.(html);
		};

		return (
			<EditorProvider>
				<div
					className={`border rounded-md overflow-hidden shadow-sm ${className}`}
				>
					<Toolbar>
						<BtnBold />
						<BtnItalic />
						<BtnUnderline />
						<BtnBulletList />
						<BtnNumberedList />
						<BtnLink />
						<BtnUndo />
						<BtnRedo />
					</Toolbar>

					<Editor
						value={currentValue}
						onChange={handleChange}
						placeholder={placeholder}
						containerProps={{
							style: { minHeight: "150px", padding: "8px" },
						}}
					/>
				</div>
			</EditorProvider>
		);
	}
);

SimpleEditor.displayName = "SimpleEditor";
