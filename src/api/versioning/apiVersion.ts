/**
 * API versioning support for Vibratto API
 */

export interface ApiVersion {
	version: string;
	deprecated: boolean;
	deprecationDate?: Date;
	supportEndDate?: Date;
	features: Array<string>;
	breaking: boolean;
}

export const API_VERSIONS: Record<string, ApiVersion> = {
	v1: {
		version: "v1",
		deprecated: false,
		features: ["user-management", "basic-booking", "messaging", "file-upload"],
		breaking: false,
	},
	v2: {
		version: "v2",
		deprecated: false,
		features: [
			"user-management",
			"advanced-booking",
			"real-time-messaging",
			"file-upload",
			"analytics",
			"websocket-support",
			"performance-monitoring",
		],
		breaking: true,
	},
} as const;

export type SupportedApiVersion = keyof typeof API_VERSIONS;

export class ApiVersionManager {
	private currentVersion: SupportedApiVersion;
	public fallbackVersion: string;

	public constructor(
		version: SupportedApiVersion = "v2",
		fallback: SupportedApiVersion = "v1"
	) {
		this.currentVersion = version;
		this.fallbackVersion = fallback;
		this.validateVersion(version);
	}

	/**
	 * Get the current API version
	 */
	public getCurrentVersion(): SupportedApiVersion {
		return this.currentVersion;
	}

	/**
	 * Set the API version
	 */
	public setVersion(version: SupportedApiVersion): void {
		this.validateVersion(version);
		this.currentVersion = version;
	}

	/**
	 * Get version information
	 */
	public getVersionInfo(version?: SupportedApiVersion): ApiVersion | undefined {
		const targetVersion = version ?? this.currentVersion;
		return API_VERSIONS[targetVersion];
	}

	/**
	 * Check if a feature is supported in the current version
	 */
	public isFeatureSupported(
		feature: string,
		version?: SupportedApiVersion
	): boolean | undefined {
		const targetVersion = version ?? this.currentVersion;
		const versionInfo = this.getVersionInfo(targetVersion);
		return versionInfo?.features.includes(feature);
	}

	/**
	 * Check if the current version is deprecated
	 */
	public isVersionDeprecated(version?: SupportedApiVersion): boolean {
		const targetVersion = version || this.currentVersion;
		const versionInfo = this.getVersionInfo(targetVersion);
		return versionInfo ? versionInfo.deprecated : false;
	}

	/**
	 * Get version-specific endpoint URL
	 */
	public getVersionedEndpoint(
		baseEndpoint: string,
		version?: SupportedApiVersion
	): string {
		const targetVersion = version || this.currentVersion;
		return `/api/${targetVersion}${baseEndpoint}`;
	}

	/**
	 * Get appropriate headers for the API version
	 */
	public getVersionHeaders(
		version?: SupportedApiVersion
	): Record<string, string> {
		const targetVersion = version || this.currentVersion;
		return {
			"API-Version": targetVersion,
			Accept: `application/vnd.vibratto.${targetVersion}+json`,
		};
	}

	/**
	 * Handle version migration
	 */
	public migrateFromVersion(
		fromVersion: SupportedApiVersion,
		toVersion: SupportedApiVersion
	): {
		success: boolean;
		warnings: Array<string>;
		breakingChanges: Array<string>;
	} {
		const fromInfo = this.getVersionInfo(fromVersion);
		const toInfo = this.getVersionInfo(toVersion);

		const warnings: Array<string> = [];
		const breakingChanges: Array<string> = [];

		// Check for deprecated features
		if (fromInfo?.deprecated) {
			warnings.push(`Version ${fromVersion} is deprecated`);
			if (fromInfo.supportEndDate) {
				warnings.push(
					`Support ends on ${fromInfo.supportEndDate.toDateString()}`
				);
			}
		}

		// Check for breaking changes
		if (toInfo && toInfo.breaking && fromVersion !== toVersion) {
			breakingChanges.push(
				`Version ${toVersion} contains breaking changes from ${fromVersion}`
			);
		}

		// Check for missing features
		const missingFeatures =
			toInfo && fromInfo
				? fromInfo.features.filter(
						(feature) => !toInfo.features.includes(feature)
					)
				: [];

		if (missingFeatures.length > 0) {
			breakingChanges.push(`Features removed: ${missingFeatures.join(", ")}`);
		}

		return {
			success: breakingChanges.length === 0,
			warnings,
			breakingChanges,
		};
	}

	/**
	 * Get compatibility matrix
	 */
	public getCompatibilityMatrix(): Record<
		string,
		{ compatible: Array<string>; incompatible: Array<string> }
	> {
		const matrix: Record<
			string,
			{ compatible: Array<string>; incompatible: Array<string> }
		> = {};

		Object.keys(API_VERSIONS).forEach((version) => {
			matrix[version] = { compatible: [], incompatible: [] };

			Object.keys(API_VERSIONS).forEach((otherVersion) => {
				if (version === otherVersion) return;

				const migration = this.migrateFromVersion(version, otherVersion);

				if (migration.success) {
					matrix[version]?.compatible?.push(otherVersion);
				} else {
					matrix[version]?.incompatible?.push(otherVersion);
				}
			});
		});

		return matrix;
	}

	/**
	 * Suggest optimal version based on required features
	 */
	public suggestVersionForFeatures(requiredFeatures: Array<string>): {
		version: SupportedApiVersion;
		reasoning: string;
		alternatives: Array<SupportedApiVersion>;
	} {
		const supportingVersions = Object.entries(API_VERSIONS)
			.filter(([_, info]) =>
				requiredFeatures.every((feature) => info.features.includes(feature))
			)
			.map(([version, info]) => ({ version: version, info }))
			.sort((a, b) => {
				// Prefer non-deprecated versions
				if (a.info.deprecated !== b.info.deprecated) {
					return a.info.deprecated ? 1 : -1;
				}
				// Prefer newer versions (v2 > v1)
				return b.version.localeCompare(a.version);
			});

		if (supportingVersions.length === 0) {
			return {
				version: this.currentVersion,
				reasoning:
					"No version supports all required features. Using current version.",
				alternatives: [],
			};
		}

		const suggested = supportingVersions[0];
		if (!suggested) {
			return {
				version: this.currentVersion,
				reasoning:
					"No version supports all required features. Using current version.",
				alternatives: [],
			};
		}
		const alternatives = supportingVersions.slice(1).map((v) => v.version);

		return {
			version: suggested.version,
			reasoning: `Version ${suggested.version} supports all required features: ${requiredFeatures.join(", ")}`,
			alternatives,
		};
	}

	private validateVersion(version: SupportedApiVersion): void {
		if (!API_VERSIONS[version]) {
			throw new Error(`Unsupported API version: ${version}`);
		}

		const versionInfo = API_VERSIONS[version];
		if (
			versionInfo.deprecated &&
			versionInfo.supportEndDate &&
			new Date() > versionInfo.supportEndDate
		) {
			throw new Error(`API version ${version} is no longer supported`);
		}
	}
}

// Export singleton instance
let versionManager: ApiVersionManager;

export function getApiVersionManager(): ApiVersionManager {
	if (!versionManager) {
		versionManager = new ApiVersionManager();
	}
	return versionManager;
}

// Version-aware request interceptor
export function createVersionInterceptor(version?: SupportedApiVersion) {
	const manager = getApiVersionManager();

	return (config: any) => {
		const targetVersion = version || manager.getCurrentVersion();
		const headers = manager.getVersionHeaders(targetVersion);

		return {
			...config,
			headers: {
				...config.headers,
				...headers,
			},
		};
	};
}

// Constants for feature checking
export const FEATURES = {
	USER_MANAGEMENT: "user-management",
	BASIC_BOOKING: "basic-booking",
	ADVANCED_BOOKING: "advanced-booking",
	MESSAGING: "messaging",
	REAL_TIME_MESSAGING: "real-time-messaging",
	FILE_UPLOAD: "file-upload",
	ANALYTICS: "analytics",
	WEBSOCKET_SUPPORT: "websocket-support",
	PERFORMANCE_MONITORING: "performance-monitoring",
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];
