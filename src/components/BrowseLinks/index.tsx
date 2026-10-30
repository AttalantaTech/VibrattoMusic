import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Option } from "@/components/forms/Select/Select";
import { cn } from "@/lib/utils/cn";

type BrowseLinksProps = {
	title: string;
	options: Array<Option>;
	/** Search page filter each link sets ("categorias", "tipos", "generos") */
	searchKey: "categorias" | "tipos" | "generos";
	showSeeAll?: boolean;
};

/**
 * A Home section of links into the Search page (categories, event types,
 * genres). Phones keep the 2-column grid of boxes; from tablets up the same
 * boxes become wrapping pills. They were loose words in rows of 5, which
 * didn't look clickable and left one item alone on the last row
 */
export const BrowseLinks = ({
	title,
	options,
	searchKey,
	showSeeAll = false,
}: BrowseLinksProps) => (
	<div className="w-full flex flex-col items-center gap-6 py-8">
		<h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center">
			{title}
		</h2>
		<ul className="grid w-full grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center">
			{options.map((option) => (
				<li key={option.value} className="flex">
					<Link
						to="/search"
						// The Search page reads the whole option ({ value, label }), like
						// the Home filter bar sends it; an array of ids was ignored there
						search={{ [searchKey]: option }}
						className={cn(
							"flex w-full items-center justify-center rounded-lg border p-3 text-center text-sm font-medium leading-tight transition-colors",
							"border-primary-200 bg-primary-50/30 text-primary-700 hover:border-primary-400 hover:bg-primary-50",
							"sm:rounded-full sm:px-5 sm:py-2 sm:text-base"
						)}
					>
						{option.label}
					</Link>
				</li>
			))}
		</ul>
		{showSeeAll ? (
			<Link
				to="/search"
				className="text-primary-500 text-lg font-medium hover:underline flex gap-3 items-center justify-center"
			>
				Ver Todos
				<ArrowRight className="rounded-full border-2 border-solid border-current h-[26px] w-[26px]" />
			</Link>
		) : null}
	</div>
);
