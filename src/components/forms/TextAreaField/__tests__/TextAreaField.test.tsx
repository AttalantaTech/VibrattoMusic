import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { TextAreaField } from "../TextAreaField";

// The (?) help checks for a touch screen; jsdom has no matchMedia
window.matchMedia = vi.fn().mockReturnValue({
	matches: false,
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
});

const Bio = ({ initial = "" }: { initial?: string }) => {
	const [value, setValue] = useState(initial);
	return (
		<TextAreaField
			name="bio"
			label="Bio (release)"
			labelTooltip="Nos conte sobre você"
			maxLength={10}
			value={value}
			onChange={(event) => {
				setValue(event.target.value);
			}}
		/>
	);
};

const field = () => screen.getByRole("textbox") as HTMLTextAreaElement;

describe("TextAreaField counter", () => {
	it("counts a text that was already there (editing a profile)", () => {
		render(<Bio initial="Olá banda" />);

		expect(screen.getByText("9/10")).toBeTruthy();
	});

	it("follows what is typed", () => {
		render(<Bio />);

		fireEvent.change(field(), { target: { value: "abc" } });

		expect(screen.getByText("3/10")).toBeTruthy();
	});

	it("doesn't grow past the limit", () => {
		render(<Bio initial="1234567890" />);

		fireEvent.change(field(), { target: { value: "1234567890X" } });

		expect(field().value).toBe("1234567890");
	});

	it("an older text over the limit shows in red and can be shortened", () => {
		render(<Bio initial="123456789012" />);

		expect(screen.getByText("12/10").className).toContain("text-red-600");

		fireEvent.change(field(), { target: { value: "12345678901" } });

		expect(field().value).toBe("12345678901");
	});

	it("shows the help (?) next to the label", () => {
		render(<Bio />);

		expect(screen.getByRole("button")).toBeTruthy();
	});

	it("without a limit there is no counter", () => {
		render(<TextAreaField name="x" value="abc" onChange={vi.fn()} />);

		expect(screen.queryByText(/\/\d+$/)).toBeNull();
	});
});
