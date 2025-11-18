import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ProfileType } from "../../components/BandRegister/ProfileType/ProfileType";
import { BandRegistrationProvider, useBandRegistration } from "../../contexts/BandRegistrationContext";
import type { Option } from "../../components/forms/Select/Select";

const ProfileTypePageInner = () => {
	const { state, updateProfileTypes } = useBandRegistration();
	const navigate = useNavigate();
	
	const [selectedOptions, setSelectedOptions] = useState<Array<Option>>(state.profileTypes || []);
	
	// Sync selectedOptions with context state changes
	useEffect(() => {
		setSelectedOptions(state.profileTypes || []);
	}, [state.profileTypes]);

	const handleNext = () => {
		// Update the profile types in the context
		updateProfileTypes(selectedOptions);

		// Navigate to first onboarding step
		void navigate({ to: "/band/register/onboarding/1" });
	};

	return (
		<ProfileType
			onNext={handleNext}
			selectedOptions={selectedOptions}
			setSelectedOptions={setSelectedOptions}
		/>
	);
};

export const ProfileTypePage = () => {
	return (
		<BandRegistrationProvider>
			<ProfileTypePageInner />
		</BandRegistrationProvider>
	);
};
