import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { DateInput } from "../DateInput";

/** The field inside a form that keeps the "yyyy-MM-dd" value */
const Form = ({
	initial = "",
	onValue,
}: {
	initial?: string;
	onValue: (value: string) => void;
}) => {
	const [value, setValue] = useState(initial);
	return (
		<>
			<DateInput
				value={value}
				onChange={(next) => {
					onValue(next);
					setValue(next);
				}}
			/>
			<button
				type="button"
				onClick={() => {
					setValue("2027-03-05");
				}}
			>
				valor de fora
			</button>
		</>
	);
};

const field = () =>
	screen.getByPlaceholderText("dd/mm/aaaa") as HTMLInputElement;

// Always dd/mm/aaaa, whatever the browser language (an English one showed
// mm/dd/yyyy with the native field)
describe("DateInput", () => {
	it("shows the form's date as dd/mm/aaaa", () => {
		render(<Form initial="2026-12-20" onValue={vi.fn()} />);

		expect(field().value).toBe("20/12/2026");
	});

	it("adds the slashes while typing", () => {
		render(<Form onValue={vi.fn()} />);

		fireEvent.change(field(), { target: { value: "0102" } });

		expect(field().value).toBe("01/02");
	});

	it("hands the form 'yyyy-MM-dd' once the date is complete", () => {
		const onValue = vi.fn();
		render(<Form onValue={onValue} />);

		fireEvent.change(field(), { target: { value: "25122026" } });

		expect(onValue).toHaveBeenLastCalledWith("2026-12-25");
	});

	it("keeps the form empty while the date is incomplete", () => {
		const onValue = vi.fn();
		render(<Form onValue={onValue} />);

		fireEvent.change(field(), { target: { value: "2512" } });

		expect(onValue).toHaveBeenLastCalledWith("");
	});

	it("doesn't accept a date that doesn't exist (31/02)", () => {
		const onValue = vi.fn();
		render(<Form onValue={onValue} />);

		fireEvent.change(field(), { target: { value: "31022027" } });

		expect(onValue).toHaveBeenLastCalledWith("");
	});

	it("follows a date set from outside (e.g. the calendar)", () => {
		render(<Form initial="2026-12-20" onValue={vi.fn()} />);

		fireEvent.click(screen.getByText("valor de fora"));

		expect(field().value).toBe("05/03/2027");
	});

	it("disabled, only shows the date", () => {
		render(<DateInput value="2026-11-03" onChange={vi.fn()} disabled />);

		expect(field().value).toBe("03/11/2026");
		expect(field().disabled).toBe(true);
		expect(screen.queryByLabelText("Abrir calendário")).toBeNull();
	});
});
