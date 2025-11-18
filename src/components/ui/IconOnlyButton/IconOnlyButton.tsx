import React from "react";

type IconButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type IconButtonShape = "circle" | "square";

interface IconOnlyButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: IconButtonVariant;
	shape?: IconButtonShape;
	icon: React.ReactNode;
	size?: "sm" | "md" | "lg";
}

export const IconOnlyButton = React.forwardRef<
	HTMLButtonElement,
	IconOnlyButtonProps
>(
	(
		{
			variant = "primary",
			shape = "square",
			size = "md",
			icon,
			className = "",
			...props
		},
		ref
	) => {
		const baseClasses =
			"flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

		const variantClasses = {
			primary:
				"bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500",
			secondary:
				"bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500",
			outline:
				"border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500",
			ghost:
				"bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500",
		};

		const sizeClasses = {
			sm: shape === "circle" ? "h-8 w-8 rounded-full" : "h-8 w-8 rounded-md",
			md:
				shape === "circle" ? "h-10 w-10 rounded-full" : "h-10 w-10 rounded-md",
			lg:
				shape === "circle" ? "h-12 w-12 rounded-full" : "h-12 w-12 rounded-md",
		};

		return (
			<button
				ref={ref}
				className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
				{...props}
			>
				{icon}
				<span className="sr-only">{props["aria-label"]}</span>
			</button>
		);
	}
);
