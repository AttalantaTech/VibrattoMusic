import { useMemo } from "react";
import DOMPurify from "dompurify";

/** Links with target="_blank" always receive a security-related rel attribute. */
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
	if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
		node.setAttribute("rel", "noopener noreferrer");
	}
});

type Props = {
	html: string;
	className?: string;
};

export const MessageHtml = ({ html, className }: Props) => {
	const clean = useMemo<string>(
		() => String(DOMPurify.sanitize(html, { ADD_ATTR: ["target"] })),
		[html]
	);

	return (
		<div className={className} dangerouslySetInnerHTML={{ __html: clean }} />
	);
};
