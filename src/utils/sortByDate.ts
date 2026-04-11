interface SortByDateProps {
	valueA: Date;
	valueB: Date;
	startTimeA: string;
	startTimeB: string;
}

export const sortByDate = ({
	valueA,
	valueB,
	startTimeA,
	startTimeB,
}: SortByDateProps): number => {
	const dateA = new Date(valueA);
	const dateB = new Date(valueB);

	const [hA = 0, mA = 0] = (startTimeA ?? "00:00").split(":").map(Number);
	const [hB = 0, mB = 0] = (startTimeB ?? "00:00").split(":").map(Number);

	dateA.setHours(hA, mA, 0, 0);
	dateB.setHours(hB, mB, 0, 0);

	return dateA.getTime() - dateB.getTime();
};
