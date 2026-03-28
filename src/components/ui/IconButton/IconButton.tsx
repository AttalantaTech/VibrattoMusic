import React from "react";

type ButtonVariant = "primary" | "secondary" | "outline";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	icon: React.ReactNode;
	children: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
	({ variant = "primary", icon, children, className = "", ...props }, ref) => {
		const baseClasses =
			"inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

		const variantClasses = {
			primary:
				"bg-primary-600 text-white border border-primary-600 shadow-sm hover:bg-[#006ae0]",
			secondary:
				"bg-white text-primary-600 border border-primary-600 hover:bg-primary-50",
			outline:
				"border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500",
		};

		return (
			<button
				ref={ref}
				className={`${baseClasses} ${variantClasses[variant]} ${className}`}
				{...props}
			>
				<span className="mr-2 -ml-1">{icon}</span>
				{children}
			</button>
		);
	}
);
