import { useEffect, useState } from "react";

type TDeviceType = "desktop" | "tablet" | "mobile";

export const useDeviceType = (): TDeviceType => {
	const [deviceType, setDeviceType] = useState<TDeviceType>("desktop");

	useEffect(() => {
		const updateDevice = () => {
			const width = window.innerWidth;

			if (width < 464) {
				setDeviceType("mobile");
			} else if (width < 1024) {
				setDeviceType("tablet");
			} else {
				setDeviceType("desktop");
			}
		};

		updateDevice();
		window.addEventListener("resize", updateDevice);

		return () => {
			window.removeEventListener("resize", updateDevice);
		};
	}, []);

	return deviceType;
};
