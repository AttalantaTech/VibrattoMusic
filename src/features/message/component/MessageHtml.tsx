import { SafeHtml } from "@/components/ui/SafeHtml/SafeHtml";

type Props = {
	html: string;
	className?: string;
};

export const MessageHtml = ({ html, className }: Props) => (
	<SafeHtml html={html} className={className} />
);
