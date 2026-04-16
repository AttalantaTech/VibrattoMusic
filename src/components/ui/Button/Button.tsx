import type React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils/cn";

const buttonVariants = cva(
	"flex items-center justify-center text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed",
	{
		variants: {
			variant: {
				primary:
					"bg-primary-600 text-white border border-primary-300 shadow-sm hover:bg-primary-700 disabled:hover:bg-primary-600",
				secondary:
					"bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300 disabled:hover:bg-gray-200",
				gradient:
					"bg-gradient-to-r from-[bg-primary-800] to-[bg-primary-50] text-white font-semibold",
				transparent: "bg-transparent text-gray-600 hover:bg-gray-100",
				outline:
					"bg-transparent text-primary-700 font-semibold border border-primary-500 hover:text-white hover:bg-primary-500",
				red: "bg-[#D92D20] text-white border border-[#D92D20] shadow-sm",
				danger:
					"bg-[#D92D20] text-white border border-[#D92D20] shadow-sm hover:bg-[#C5271B] focus:ring-red-300",
			},
			size: {
				default: "h-[52px] px-[18px] py-[8px] text-base rounded-[8px]",
				sm: "h-[38px] px-4 text-sm rounded-md",
				lg: "h-[52px] px-6 text-lg rounded-xl",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "default",
		},
	}
);

export interface ButtonProps
	extends
		React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {}

export const Button: React.FC<ButtonProps> = ({
	className,
	variant,
	size,
	children,
	...props
}) => {
	return (
		<button
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		>
			{children}
		</button>
	);
};
