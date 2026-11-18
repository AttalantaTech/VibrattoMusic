/** How much of an event's checklist is done */
export const ProgressBar = ({
	done,
	total,
}: {
	done: number;
	total: number;
}) => {
	const percent = total > 0 ? Math.round((done / total) * 100) : 0;
	const isComplete = total > 0 && done === total;

	return (
		<div
			className="h-2 w-full overflow-hidden rounded-full bg-gray-100"
			role="progressbar"
			aria-valuemin={0}
			aria-valuemax={total}
			aria-valuenow={done}
			aria-label={`${done} de ${total} itens prontos`}
		>
			<div
				className={`h-full rounded-full transition-[width] duration-300 ${
					isComplete ? "bg-green-500" : "bg-primary-600"
				}`}
				style={{ width: `${percent}%` }}
			/>
		</div>
	);
};
