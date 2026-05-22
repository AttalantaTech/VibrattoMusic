import type { ReactNode } from "react";
import { MEDIA_STYLES } from "../../constants/styles";

type Props = {
	title: string;
	subtitle?: string;
	tooltip?: ReactNode;
	children?: ReactNode;
};

export function SectionHeader({ title, subtitle, tooltip, children }: Props) {
	return (
		<div className={MEDIA_STYLES.sectionHeader}>
			<div className={MEDIA_STYLES.sectionTitle}>
				<h2 className={MEDIA_STYLES.titleText}>{title} </h2>

				{tooltip}
			</div>

			{subtitle && <p className={MEDIA_STYLES.subtitle}>{subtitle}</p>}

			{children}
		</div>
	);
}
