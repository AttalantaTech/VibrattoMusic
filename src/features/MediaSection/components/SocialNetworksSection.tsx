import { Button } from "@/components/ui/Button/Button";
import { Trash2, Plus } from "lucide-react";
import { SectionHeader } from "./shared/SectionHeader";
import { IconInput } from "@/components/forms/IconInput/IconInput";
import {
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/Form/Form";
import type {
	Control,
	FieldErrors,
	UseFieldArrayAppend,
	UseFieldArrayRemove,
} from "react-hook-form";
import type { MediaData } from "../types";

interface SocialNetwork {
	idRedeSocial: number;
	name: string;
	icon: React.ReactNode;
	placeholder: string;
}

interface SocialNetworksSectionProps {
	control: Control<MediaData>;
	errors: FieldErrors<MediaData>;
	fields: MediaData["redeSocial"];
	networks: Array<SocialNetwork>;
	append: UseFieldArrayAppend<MediaData, "redeSocial">;
	remove: UseFieldArrayRemove;
}

export function SocialNetworksSection({
	networks,
	append,
	control,
	errors,
	fields,
	remove,
}: SocialNetworksSectionProps) {
	return (
		<div className="bg-gray-50 py-6 border-b">
			<SectionHeader
				title="Redes Sociais"
				subtitle="Conecte suas redes sociais para aumentar sua visibilidade."
			/>

			{fields?.map((field, index) => {
				const network = networks.find(
					(n) => n.idRedeSocial === field.idRedeSocial
				);

				return (
					<div key={field.idRedeSocial} className="flex gap-2 items-start">
						<FormField
							control={control}
							name={`redeSocial.${index}.link`}
							render={({ field }) => (
								<FormItem className="flex-1 min-w-0">
									<FormControl>
										<IconInput
											className="w-full"
											icon={network?.icon}
											name={`social.${index}.Link`}
											placeholder={network?.placeholder ?? ""}
											value={field.value ?? ""}
											onChange={field.onChange}
										/>
									</FormControl>
									<p
										data-slot="form-message"
										className={"text-destructive text-sm"}
									/>
									{errors.redeSocial && errors.redeSocial[index]?.message}
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button
							type="button"
							variant="outline"
							className="h-10 w-10 p-0 flex items-center justify-center flex-shrink-0"
							onClick={() => {
								remove(index);
							}}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				);
			})}

			<div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
				{networks
					.filter(
						(network) =>
							!fields?.some(
								(field) => field.idRedeSocial === network.idRedeSocial
							)
					)
					.map((network) => (
						<Button
							key={network.idRedeSocial}
							type="button"
							variant="secondary"
							onClick={() => {
								append({
									idRedeSocial: network.idRedeSocial,
									link: "",
									idProdutoMusical: 0,
									nomeRedeSocial: network.name,
								});
							}}
						>
							<Plus size={14} />
							{network.name}
						</Button>
					))}
			</div>
		</div>
	);
}
