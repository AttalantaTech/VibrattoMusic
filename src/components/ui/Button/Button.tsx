import type React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils/cn";

const buttonVariants = cva(
	"flex items-center justify-center text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed",
	{
		variants: {
			variant: {
				primary:
					"bg-[#007BFF] text-white border border-[#007BFF] shadow-sm hover:bg-[#006ae0]",
				secondary:
					"bg-white text-[#007BFF] border border-[#007BFF] hover:bg-blue-50",
				gradient:
					"bg-gradient-to-r from-[#007BFF] to-[#7DB6F3] text-white font-semibold",
				transparent: "bg-transparent text-gray-600 hover:bg-gray-100",
				outline:
					"bg-transparent text-gray-700 font-semibold border border-gray-300 hover:text-gray-900 hover:bg-gray-100",
				red: "bg-[#D92D20] text-white border border-[#D92D20] shadow-sm",
				danger:
					"bg-[#D92D20] text-white border border-[#D92D20] shadow-sm hover:bg-[#C5271B] focus:ring-red-300",
			},
			size: {
				default: "h-[44px] px-[18px] text-base rounded-[12px]",
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
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
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
