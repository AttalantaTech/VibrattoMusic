import type { CarouselApi } from "@/components/ui/carousel";
import {
	Carousel as CarouselRoot,
	CarouselContent,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils/cn";
import { useState, type ReactNode } from "react";
import { IconOnlyButton } from "../IconOnlyButton/IconOnlyButton";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface CarouselProps {
	children: ReactNode;
	className?: string | undefined;
}

export function Carousel({ children, className }: CarouselProps) {
	const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

	return (
		<div className="w-full flex flex-col gap-3 justify-center align-center">
			<CarouselRoot
				setApi={setCarouselApi}
				orientation="horizontal"
				className={cn(className)}
			>
				<CarouselContent className="-ml-1 w-full">{children}</CarouselContent>
			</CarouselRoot>

			<div className="w-full flex items-center justify-center sm:justify-start gap-5 px-2">
				<IconOnlyButton
					// disabled={carouselApi?.canScrollPrev()}
					icon={<ArrowLeft size={15} />}
					shape="circle"
					variant="outline"
					onClick={() => carouselApi?.scrollPrev()}
				/>
				<IconOnlyButton
					// disabled={carouselApi?.canScrollNext()}
					icon={<ArrowRight size={15} />}
					shape="circle"
					variant="outline"
					onClick={() => carouselApi?.scrollNext()}
				/>
			</div>
		</div>
	);
}
