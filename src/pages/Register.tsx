import { Controller } from "react-hook-form";
import { Briefcase, Eye, EyeOff, User } from "lucide-react";
import { useRegisterUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/Button/Button";
import LogoVibratto from "@/assets/images/Logo_Vibratto.png";
import VibrattoName from "@/assets/images/Vibratto.png";
import ShowImg from "@/assets/images/show.jpg";
import { InputField } from "@/components/forms/InputField/InputField";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/Select/Select";
import { useRegisterForm } from "@/features/Register/hooks/useRegisterForm";
import { useRegisterSubmit } from "@/features/Register/hooks/useRegisterSubmit";

export const Register = () => {
	const registerMutation = useRegisterUser();

	const {
		form,
		showPassword,
		setShowPassword,
		showConfirmPassword,
		setShowConfirmPassword,
		showAddressFields,
		isLoadingAddress,
		tipoDocumento,
		setTipoDocumento,
	} = useRegisterForm();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		control,
	} = form;

	const { onSubmit } = useRegisterSubmit();

	const isCPF = tipoDocumento === "cpf";

	return (
		<div className="flex flex-col lg:flex-row h-screen w-screen justify-center items-center">
			{/* Content */}
			<div className="flex flex-col w-full lg:w-1/2 h-full justify-start items-center gap-6 px-4 lg:px-0 overflow-y-auto py-6">
				<div className="w-full max-w-md lg:w-[50%] flex flex-col my-auto">
					{/* Header */}
					<div className="flex flex-col justify-center items-center gap-2 lg:gap-6 text-center">
						<div className="flex items-center justify-around">
							<img
								alt="Vibratto logo"
								className="w-auto h-5 sm:h-10"
								src={LogoVibratto}
							/>
							<img
								alt="Vibratto logo"
								className="w-auto h-3 sm:h-4"
								src={VibrattoName}
							/>
						</div>
						<div className="flex flex-col gap-2 lg:gap-3 w-full">
							<h1 className="font-semibold text-2xl sm:text-3xl">
								Cadastre-se
							</h1>
							<h2 className="font-normal text-sm sm:text-base text-gray-500">
								Bem-vindo à Vibratto!
							</h2>{" "}
						</div>
					</div>

					{/* Inputs */}
					<form
						className="flex flex-col w-full justify-center items-center gap-4 lg:gap-6 pt-4 lg:pt-6"
						onSubmit={handleSubmit(onSubmit)}
					>
						<div className="flex flex-col gap-4 lg:gap-5 w-full">
							<div>
								<InputField
									{...register("email")}
									label="Email"
									placeholder="exemplo@vibratto.com"
									type="email"
									required
								/>
								{errors.email && (
									<p className="text-red-600 text-sm mt-1">
										{errors.email.message}
									</p>
								)}
							</div>
							<div>
								<InputField
									{...register("nome")}
									label="Nome"
									placeholder="João da Silva"
									type="text"
									required
								/>
								{errors.nome && (
									<p className="text-red-600 text-sm mt-1">
										{errors.nome.message}
									</p>
								)}
							</div>
							<div className="flex flex-col gap-2">
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Documento de identificação
								</label>
								<div className="grid grid-cols-4 gap-1 w-full">
									<div className="col-span-1">
										<Select
											value={tipoDocumento}
											onValueChange={(value) => {
												setTipoDocumento((value as "cpf" | "cnpj") ?? "cpf");
											}}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Selecione..." />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="cpf">CPF</SelectItem>
												<SelectItem value="cnpj">CNPJ</SelectItem>
											</SelectContent>
										</Select>
										{/* Documento */}
									</div>
									<div className="col-span-3">
										<Controller
											name="cpfOuCnpj"
											control={control}
											render={({ field }) => (
												<InputField
													{...field}
													placeholder={
														isCPF ? "XXX.XXX.XXX-00" : "XX.XXX.XXX/XXXX-00"
													}
													mask={isCPF ? "000.000.000-00" : "00.000.000/0000-00"}
													type="text"
													required
												/>
											)}
										/>
										{errors.cpfOuCnpj && (
											<p className="text-red-600 text-sm mt-1">
												{errors.cpfOuCnpj.message}
											</p>
										)}
									</div>
								</div>
							</div>
							<div className="col-span-3">
								<Controller
									name="cpfResponsavelLegal"
									control={control}
									render={({ field }) => (
										<InputField
											{...field}
											value={field.value ?? ""}
											required={!isCPF}
											icon={<Briefcase size={20} />}
											label="CPF do Responsável Legal"
											mask="000.000.000-00"
											placeholder="XXX.XXX.XXX-00"
										/>
									)}
								/>
								{errors.cpfResponsavelLegal?.message && (
									<div className="text-red-500 text-sm">
										{errors.cpfResponsavelLegal.message}
									</div>
								)}
							</div>
							<div className="col-span-3">
								<InputField
									required={!isCPF}
									icon={<User size={20} />}
									label="Nome do Responsável Legal"
									placeholder="Ex: Banda LTDA"
									{...register("nomeResponsavelLegal")}
								/>
								{errors.nomeResponsavelLegal?.message && (
									<div className="text-red-500 text-sm">
										{errors.nomeResponsavelLegal.message}
									</div>
								)}
							</div>
							<div className="col-span-3">
								<Controller
									name="celular"
									control={control}
									render={({ field }) => (
										<InputField
											{...field}
											label="Celular"
											mask="(00) 00000-0000"
											placeholder="(00) 00000-0000"
											type="text"
											required
										/>
									)}
								/>
								{errors.celular && (
									<p className="text-red-600 text-sm mt-1">
										{errors.celular.message}
									</p>
								)}
							</div>
							{/* CEP Field */}
							<div>
								<InputField
									{...register("cep")}
									label="CEP"
									placeholder="00000-000"
									type="text"
									maxLength={9}
									required
								/>
								{errors.cep && (
									<p className="text-red-600 text-sm mt-1">
										{errors.cep.message}
									</p>
								)}
								{isLoadingAddress && (
									<p className="text-primary-600 text-sm mt-1">
										Buscando endereço...
									</p>
								)}
							</div>
							{/* Address Fields - Show only after CEP is filled */}
							{showAddressFields && (
								<>
									<div>
										<InputField
											{...register("logradouro")}
											label="Logradouro"
											placeholder="Rua, Avenida, etc."
											type="text"
											required
										/>
										{errors.logradouro && (
											<p className="text-red-600 text-sm mt-1">
												{errors.logradouro.message}
											</p>
										)}
									</div>

									<div>
										<InputField
											{...register("numero")}
											label="Número"
											placeholder="123"
											type="text"
											required
										/>
										{errors.numero && (
											<p className="text-red-600 text-sm mt-1">
												{errors.numero.message}
											</p>
										)}
									</div>

									<div>
										<InputField
											{...register("complemento")}
											label="Complemento (opcional)"
											placeholder="Apto 123, Bloco B"
											type="text"
										/>
										{errors.complemento && (
											<p className="text-red-600 text-sm mt-1">
												{errors.complemento.message}
											</p>
										)}
									</div>

									<div>
										<InputField
											{...register("bairro")}
											label="Bairro"
											placeholder="Centro"
											type="text"
											required
										/>
										{errors.bairro && (
											<p className="text-red-600 text-sm mt-1">
												{errors.bairro.message}
											</p>
										)}
									</div>

									<div>
										<InputField
											{...register("cidade")}
											label="Cidade"
											placeholder="São Paulo"
											type="text"
											required
										/>
										{errors.cidade && (
											<p className="text-red-600 text-sm mt-1">
												{errors.cidade.message}
											</p>
										)}
									</div>

									<div>
										<InputField
											{...register("estado")}
											label="Estado"
											placeholder="SP"
											type="text"
											required
										/>
										{errors.estado && (
											<p className="text-red-600 text-sm mt-1">
												{errors.estado.message}
											</p>
										)}
									</div>
								</>
							)}
							<div className="relative">
								<InputField
									{...register("senha")}
									label="Senha"
									type={showPassword ? "text" : "password"}
									required
								/>{" "}
								<button
									className="absolute inset-y-0 right-0 pr-3 flex items-center top-6"
									type="button"
									onClick={() => {
										setShowPassword(!showPassword);
									}}
								>
									{showPassword ? (
										<EyeOff className="h-5 w-5 text-gray-400" />
									) : (
										<Eye className="h-5 w-5 text-gray-400" />
									)}
								</button>
								{errors.senha && (
									<p className="text-red-600 text-sm mt-1">
										{errors.senha.message}
									</p>
								)}
							</div>
							<div className="relative">
								<InputField
									{...register("confirmarSenha")}
									label="Repita sua Senha"
									type={showConfirmPassword ? "text" : "password"}
									required
								/>{" "}
								<button
									className="absolute inset-y-0 right-0 pr-3 flex items-center top-6"
									type="button"
									onClick={() => {
										setShowConfirmPassword(!showConfirmPassword);
									}}
								>
									{showConfirmPassword ? (
										<EyeOff className="h-5 w-5 text-gray-400" />
									) : (
										<Eye className="h-5 w-5 text-gray-400" />
									)}
								</button>
								{errors.confirmarSenha && (
									<p className="text-red-600 text-sm mt-1">
										{errors.confirmarSenha.message}
									</p>
								)}
							</div>
							{errors.root && (
								<div className="text-red-600 text-sm text-center">
									{errors.root.message}
								</div>
							)}{" "}
							<Button
								className="w-full font-semibold"
								disabled={isSubmitting || registerMutation.isPending}
								type="submit"
							>
								{isSubmitting || registerMutation.isPending
									? "Criando conta..."
									: "Realizar cadastro"}
							</Button>
						</div>
					</form>
				</div>
			</div>

			<div className="hidden lg:flex lg:w-1/2 items-center justify-center h-screen py-3">
				<img
					alt="Imagem ilustrativa"
					className="w-full h-full object-cover rounded"
					src={ShowImg}
				/>
			</div>
		</div>
	);
};
