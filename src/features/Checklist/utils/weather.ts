/**
 * Weather forecast of the event's day, from Open-Meteo (free, no account).
 * Only the city's name leaves the browser. Forecasts exist up to 16 days
 * ahead; before that the screen says when it will be available
 */

const UF_NAMES: Record<string, string> = {
	AC: "Acre",
	AL: "Alagoas",
	AP: "Amapá",
	AM: "Amazonas",
	BA: "Bahia",
	CE: "Ceará",
	DF: "Distrito Federal",
	ES: "Espírito Santo",
	GO: "Goiás",
	MA: "Maranhão",
	MT: "Mato Grosso",
	MS: "Mato Grosso do Sul",
	MG: "Minas Gerais",
	PA: "Pará",
	PB: "Paraíba",
	PR: "Paraná",
	PE: "Pernambuco",
	PI: "Piauí",
	RJ: "Rio de Janeiro",
	RN: "Rio Grande do Norte",
	RS: "Rio Grande do Sul",
	RO: "Rondônia",
	RR: "Roraima",
	SC: "Santa Catarina",
	SP: "São Paulo",
	SE: "Sergipe",
	TO: "Tocantins",
};

/** How far ahead Open-Meteo forecasts */
export const FORECAST_DAYS = 16;

/**
 * The city of a place as typed in proposals: "Coruripe - AL", "Espaço
 * Jardim Europa, São Paulo - SP", "Praça Central, Valinhos - SP"
 */
export const cityFromPlace = (
	place: string | null | undefined
): { city: string; uf: string | null } | null => {
	const text = place?.trim();
	if (!text) return null;

	const withUf = /([^,]+?)\s*[-–/]\s*([A-Za-z]{2})\s*$/.exec(text);
	const ufCandidate = withUf?.[2]?.toUpperCase();
	if (withUf && ufCandidate && UF_NAMES[ufCandidate]) {
		const city = withUf[1]?.split(",").at(-1)?.trim();
		return city ? { city, uf: ufCandidate } : null;
	}

	const city = text.split(",").at(-1)?.trim();
	return city ? { city, uf: null } : null;
};

export const ufName = (uf: string | null): string | null =>
	uf ? (UF_NAMES[uf] ?? null) : null;

/** Days from today to the event (0 = today) */
export const daysUntil = (date: string, today: string): number =>
	Math.round(
		(Date.parse(`${date}T12:00:00`) - Date.parse(`${today}T12:00:00`)) /
			86_400_000
	);

/** "available" | "later" (too far ahead) | "past" */
export const forecastWindow = (
	date: string,
	today: string
): "available" | "later" | "past" => {
	const days = daysUntil(date, today);
	if (days < 0) return "past";
	return days < FORECAST_DAYS ? "available" : "later";
};

/** The first day the forecast of an event can be read, yyyy-MM-dd */
export const forecastOpensOn = (date: string): string => {
	const day = new Date(`${date}T12:00:00`);
	day.setDate(day.getDate() - (FORECAST_DAYS - 1));
	return day.toISOString().slice(0, 10);
};

/** WMO weather codes, as Open-Meteo sends them */
export const weatherLabel = (code: number): string => {
	if (code === 0) return "Céu limpo";
	if (code <= 2) return "Sol com algumas nuvens";
	if (code === 3) return "Nublado";
	if (code === 45 || code === 48) return "Neblina";
	if (code >= 51 && code <= 57) return "Garoa";
	if (code >= 61 && code <= 67) return "Chuva";
	if (code >= 71 && code <= 77) return "Neve";
	if (code >= 80 && code <= 82) return "Pancadas de chuva";
	if (code >= 95) return "Tempestade";
	return "Tempo variável";
};

/** For the screen: a symbol that matches the code */
export const weatherSymbol = (code: number): string => {
	if (code === 0) return "☀️";
	if (code <= 2) return "🌤️";
	if (code === 3) return "☁️";
	if (code === 45 || code === 48) return "🌫️";
	if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "🌧️";
	if (code >= 95) return "⛈️";
	return "🌡️";
};

export interface Forecast {
	/** City found, e.g. "Coruripe, Alagoas" */
	place: string;
	min: number;
	max: number;
	/** Chance of rain, 0–100 */
	rainChance: number | null;
	code: number;
}

/** "Sol com algumas nuvens · 23° a 32° · chuva 10%" */
export const forecastText = (forecast: Forecast): string =>
	[
		weatherLabel(forecast.code),
		`${Math.round(forecast.min)}° a ${Math.round(forecast.max)}°`,
		forecast.rainChance === null ? null : `chuva ${forecast.rainChance}%`,
	]
		.filter(Boolean)
		.join(" · ");

interface GeoResult {
	name: string;
	latitude: number;
	longitude: number;
	country_code?: string;
	admin1?: string;
}

/**
 * The forecast of a day in a city. null when the city isn't found or the
 * day has no forecast; throws only when the service can't be reached
 */
export const fetchForecast = async (
	place: string,
	date: string
): Promise<Forecast | null> => {
	const where = cityFromPlace(place);
	if (!where) return null;

	const geo = (await (
		await fetch(
			`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(where.city)}&count=10&language=pt&countryCode=BR`
		)
	).json()) as { results?: Array<GeoResult> };

	const state = ufName(where.uf);
	const found =
		geo.results?.find((result) => state && result.admin1 === state) ??
		(state ? undefined : geo.results?.[0]);
	if (!found) return null;

	const weather = (await (
		await fetch(
			`https://api.open-meteo.com/v1/forecast?latitude=${found.latitude}&longitude=${found.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FSao_Paulo&start_date=${date}&end_date=${date}`
		)
	).json()) as {
		daily?: {
			weather_code?: Array<number | null>;
			temperature_2m_max?: Array<number | null>;
			temperature_2m_min?: Array<number | null>;
			precipitation_probability_max?: Array<number | null>;
		};
	};

	const daily = weather.daily;
	const max = daily?.temperature_2m_max?.[0];
	const min = daily?.temperature_2m_min?.[0];
	const code = daily?.weather_code?.[0];
	if (max == null || min == null || code == null) return null;

	return {
		place: [found.name, found.admin1].filter(Boolean).join(", "),
		min,
		max,
		rainChance: daily?.precipitation_probability_max?.[0] ?? null,
		code,
	};
};
