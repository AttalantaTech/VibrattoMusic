import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { TimeInput } from "../TimeInput";

/** The field inside a form that keeps the "HH:mm" value */
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
			<TimeInput
				value={value}
				onChange={(next) => {
					onValue(next);
					setValue(next);
				}}
			/>
			<button
				type="button"
				onClick={() => {
					setValue("21:15");
				}}
			>
				valor de fora
			</button>
		</>
	);
};

const field = () => screen.getByPlaceholderText("hh:mm") as HTMLInputElement;

// Always hh:mm 24h, whatever the browser language (an English one showed
// AM/PM with the native field)
describe("TimeInput", () => {
	it("shows the form's time as hh:mm", () => {
		render(<Form initial="19:30" onValue={vi.fn()} />);

		expect(field().value).toBe("19:30");
	});

	it("adds the colon while typing", () => {
		const onValue = vi.fn();
		render(<Form onValue={onValue} />);

		fireEvent.change(field(), { target: { value: "193" } });

		expect(field().value).toBe("19:3");
		expect(onValue).toHaveBeenLastCalledWith("");
	});

	it("hands the form 'HH:mm' once the time is complete", () => {
		const onValue = vi.fn();
		render(<Form onValue={onValue} />);

		fireEvent.change(field(), { target: { value: "0745" } });

		expect(onValue).toHaveBeenLastCalledWith("07:45");
	});

	it("doesn't accept a time that doesn't exist (25:00, 10:75)", () => {
		const onValue = vi.fn();
		render(<Form onValue={onValue} />);

		fireEvent.change(field(), { target: { value: "2500" } });
		expect(onValue).toHaveBeenLastCalledWith("");

		fireEvent.change(field(), { target: { value: "1075" } });
		expect(onValue).toHaveBeenLastCalledWith("");
	});

	it("follows a time set from outside (e.g. recalculated schedule)", () => {
		render(<Form initial="19:30" onValue={vi.fn()} />);

		fireEvent.click(screen.getByText("valor de fora"));

		expect(field().value).toBe("21:15");
	});
});
