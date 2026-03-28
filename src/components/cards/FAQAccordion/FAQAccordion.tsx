import { MinusCircle, PlusCircle } from "lucide-react";
import { useState } from "react";

interface FAQItem {
	question: string;
	answer: string;
}

interface FAQAccordionProps {
	items: Array<FAQItem>;
}

export const FAQAccordion = ({ items }: FAQAccordionProps) => {
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	const toggle = (index: number) => {
		setOpenIndex(openIndex === index ? null : index);
	};

	return (
		<div className="w-full">
			{items.map((item, index) => (
				<div key={index} className="border-b">
					<button
						className="w-full flex justify-between items-center py-4 text-left"
						onClick={() => {
							toggle(index);
						}}
					>
						<span className="font-medium text-lg text-gray-900">
							{item.question}
						</span>
						{openIndex === index ? (
							<MinusCircle className="text-primary-500" size={24} />
						) : (
							<PlusCircle className="text-primary-500" size={24} />
						)}
					</button>

					<div
						className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? "max-h-40" : "max-h-0"}`}
					>
						<p className="pb-4 text-base text-gray-500">{item.answer}</p>
					</div>
				</div>
			))}
		</div>
	);
};
