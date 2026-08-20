import React from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "none";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	icon: React.ReactNode;
	children?: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
	(
		{ variant = "primary", icon, children = "", className = "", ...props },
		ref
	) => {
		const baseClasses =
			"inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

		const variantClasses = {
			primary:
				"bg-primary-600 text-white border border-primary-600 shadow-sm hover:bg-primary-700 rounded-lg px-4 py-2",
			secondary:
				"bg-primary-100/50 text-primary-900 border border-primary-300 hover:bg-primary-100/75 rounded-lg px-4 py-2",
			outline:
				"border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500 rounded-lg px-4 py-2",
			none: "p-2 text-primary-500 hover:text-primary-700 focus:outline-none disabled:opacity-50",
		};

		return (
			<button
				ref={ref}
				className={`${baseClasses} ${variantClasses[variant]} ${className}`}
				{...props}
			>
				<span className={`${children ? "mr-2 -ml-1" : ""}`}>{icon}</span>
				{children}
			</button>
		);
	}
);
