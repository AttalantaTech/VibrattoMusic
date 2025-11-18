import React from "react";
import { cn } from "../../../lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?:
		| "default"
		| "secondary"
		| "destructive"
		| "outline"
		| "success"
		| "warning"
		| "error";
	size?: "sm" | "md" | "lg";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
	({ className, variant = "default", size = "md", ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={cn(
					"inline-flex items-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
					{
						// Variants
						"bg-primary text-primary-foreground": variant === "default",
						"bg-secondary text-secondary-foreground": variant === "secondary",
						"bg-destructive text-destructive-foreground":
							variant === "destructive",
						"bg-red-100 text-red-800": variant === "error",
						"bg-green-100 text-green-800": variant === "success",
						"bg-yellow-100 text-yellow-800": variant === "warning",
						"text-foreground border border-input bg-background":
							variant === "outline",

						// Sizes
						"px-2 py-0.5 text-xs": size === "sm",
						"px-2.5 py-0.5 text-sm": size === "md",
						"px-3 py-1 text-base": size === "lg",
					},
					className
				)}
				{...props}
			/>
		);
	}
);
Badge.displayName = "Badge";

export { Badge };
