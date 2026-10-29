import { useMemo } from "react";
import { sanitizeHtml } from "@/utils/sanitizeHtml";

type Props = {
	html: string;
	className?: string;
};

/** Renders HTML written by someone else (chat cards, rider, camarim) safely */
export const SafeHtml = ({ html, className }: Props) => {
	const clean = useMemo(() => sanitizeHtml(html), [html]);

	return (
		<div className={className} dangerouslySetInnerHTML={{ __html: clean }} />
	);
};
