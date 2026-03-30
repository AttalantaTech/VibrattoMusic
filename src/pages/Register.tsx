import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { useRegisterUser, useLogin } from "../hooks/useUser";
import { Button } from "../components/ui/Button/Button";
import LogoVibratto from "../assets/images/Logo_Vibratto.png";
import VibrattoName from "../assets/images/Vibratto.png";
import ShowImg from "../assets/images/show.jpg";
import { InputField } from "../components/forms/InputField/InputField";
import { useRouter } from "@tanstack/react-router";
import { useAuthStore } from "../store/authStore";
import { getStoredUserType, setStoredUserType } from "../utils/userType";
import { addressService } from "../api/services/addressService";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../components/ui/Select/Select";

const registerSchema = z
	.object({
		email: z.string().email("Email inválido"),
		nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
		cpfOuCnpj: z.string().min(1, "Documento é obrigatório"),
		cep: z
			.string()
			.min(8, "CEP deve ter no mínimo 6 dígitos")
			.max(9, "CEP deve ter no máximo 9 dígitos"),
		logradouro: z.string().min(1, "Logradouro é obrigatório"),
		bairro: z.string().min(1, "Bairro é obrigatório"),
		cidade: z.string().min(1, "Cidade é obrigatória"),
		estado: z.string().min(1, "Estado é obrigatório"),
		numero: z.string().min(1, "Número é obrigatório"),
		complemento: z.string().optional(),
		senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
		confirmarSenha: z.string(),
	})
	.refine((data) => data.senha === data.confirmarSenha, {
		message: "As senhas não coincidem",
		path: ["confirmarSenha"],
	})
	.refine(
		(data) => {
			const digitsOnly = data.cpfOuCnpj.replace(/\D/g, "");
			return digitsOnly.length === 11 || digitsOnly.length === 14;
		},
		{
			message: "Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos",
			path: ["cpfOuCnpj"],
		}
	);

type RegisterFormData = z.infer<typeof registerSchema>;

export const Register = () => {
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [showAddressFields, setShowAddressFields] = useState(false);
	const [isLoadingAddress, setIsLoadingAddress] = useState(false);
	const [tipoDocumento, setTipoDocumento] = useState<"cpf" | "cnpj">("cpf");
	const router = useRouter();
	const registerMutation = useRegisterUser();
	const loginMutation = useLogin();
	const setAuth = useAuthStore((state) => state.setAuth);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setError,
		watch,
		setValue,
		control,
	} = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
	});

	const cepValue = watch("cep");
	const isCPF = tipoDocumento === "cpf";

	// Effect to handle CEP changes and fetch address data
	useEffect(() => {
		const fetchAddress = async () => {
			if (cepValue && cepValue.replace(/\D/g, "").length === 8) {
				setIsLoadingAddress(true);
				try {
					const addressData = await addressService.getAddressByCep(cepValue);
					setValue("logradouro", addressData.logradouro);
					setValue("bairro", addressData.bairro);
					setValue("cidade", addressData.cidade);
					setValue("estado", addressData.estado);
					setValue("complemento", addressData.complemento || "");
					setShowAddressFields(true);
				} catch (error) {
					console.error("Error fetching address:", error);
					setError("cep", { message: "CEP não encontrado" });
					setShowAddressFields(false);
				} finally {
					setIsLoadingAddress(false);
				}
			} else if (cepValue && cepValue.replace(/\D/g, "").length < 8) {
				setShowAddressFields(false);
			}
		};

		const timeoutId = setTimeout(() => {
			void fetchAddress();
		}, 500); // Debounce
		return () => {
			clearTimeout(timeoutId);
		};
	}, [cepValue, setValue, setError]);

	const onSubmit = async (data: RegisterFormData) => {
		try {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { confirmarSenha, cpfOuCnpj, ...registerData } = data;

			// Map document according to selected type and remove formatting from CEP
			const finalRegisterData = {
				...registerData,
				cep: registerData.cep?.replace(/\D/g, "") || "", // Remove non-numeric characters from CEP
				cpfOuCnpj: cpfOuCnpj.replace(/\D/g, "") || "",
				// ...(tipoDocumento === "cpf" ? { cpf: cpfOuCnpj } : { cnpj: cpfOuCnpj }),
			};

			// Don't include userType yet - it will be selected after registration
			// confirmarSenha is used for validation but not sent to API
			const registeredUser =
				await registerMutation.mutateAsync(finalRegisterData);

			// Automatically log in the user after registration
			const loginResponse = await loginMutation.mutateAsync({
				email: data.email,
				senha: data.senha,
			});

			// Set authentication state
			const user = loginResponse.user || registeredUser;
			setAuth(
				user,
				loginResponse.token || loginResponse.Token,
				loginResponse.refreshToken
			);

			// Check for temporary user choice made during user type selection
			const temporaryUserChoice = localStorage.getItem("temp-user-choice") as
				| "cliente"
				| "produto_musical"
				| null;
			if (temporaryUserChoice) {
				// Set the user type based on the temporary choice
				setStoredUserType(temporaryUserChoice);
				localStorage.removeItem("temp-user-choice"); // Clean up

				// Navigate based on user type: clients skip onboarding and go to home
				if (temporaryUserChoice === "cliente") {
					await router.navigate({ to: "/" });
				} else if (temporaryUserChoice === "produto_musical") {
					await router.navigate({ to: "/band/profile-type" });
				}
				return;
			}

			// Fallback: Redirect based on persisted userType in vibratto-auth
			const userType = getStoredUserType();
			// If userType isn't set yet, force selection
			if (!userType) {
				await router.navigate({ to: "/welcome" });
				return;
			}
			// Ensure store reflects persisted value
			setStoredUserType(userType);
			if (userType === "cliente") {
				await router.navigate({ to: "/" });
			} else if (userType === "produto_musical") {
				await router.navigate({ to: "/band/profile-type" });
			}
		} catch (error: unknown) {
			// Extract error message from VibrattoApiError or use fallback
			let errorMessage = "Erro ao criar conta. Tente novamente.";

			if (error && typeof error === "object") {
				// Check if it's a validation error with structured errors
				const validationError = error as {
					status?: number;
					errors?: Record<string, Array<string>>;
					title?: string;
					message?: string;
				};

				if (validationError.status === 400 && validationError.errors) {
					// It's a validation error - show user-friendly message
					errorMessage =
						"Erro ao criar conta. Preencha os campos obrigatórios e tente novamente.";
				} else if ("message" in error) {
					const errorWithMessage = error as { message: string };
					errorMessage = `Erro ao criar conta, ${errorWithMessage.message.toLocaleLowerCase()}`;
				}
			}

			setError("root", { message: errorMessage });
		}
	};
	return (
		<div className="flex flex-col lg:flex-row h-screen w-screen justify-center items-center">
			{/* Content */}
			<div className="flex flex-col w-full lg:w-1/2 h-full justify-start items-center gap-6 px-4 lg:px-0 overflow-y-auto py-6">
				<div className="w-full max-w-md lg:w-[50%] flex flex-col my-auto">
					{/* Header */}
					<div className="flex flex-col justify-center items-center gap-4 lg:gap-6 text-center">
						<div className="flex items-center justify-around">
							<img
								alt="Vibratto logo"
								className="w-auto h-5 sm:h-10"
								src={LogoVibratto}
							/>
							<img
								alt="Vibratto logo"
								className="w-auto h-3 sm:h-6"
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
														isCPF ? "000.000.000-00" : "00.000.000/0000-00"
													}
													mask={isCPF ? "000.000.000-00" : "00.000.000/0000-00"}
													maskPlaceholder=""
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
