import fs from "node:fs/promises";
import path from "node:path";
import * as zod from "zod";
import { parse as parseYaml } from "yaml";
import spdx, { ConjunctionInfo, LicenseInfo } from "spdx-expression-parse";
import { getLicenseData } from "./licenseDataCache.js";

export const NodePackageJsonSchema = zod.object({
	license: zod.string().default("UNLICENSED").optional(),
	scripts: zod.record(zod.string()).optional(),
	dependencies: zod.record(zod.string()).optional(),
	devDependencies: zod.record(zod.string()).optional(),
	peerDependencies: zod.record(zod.string()).optional(),
});

export const PnpmPackageLockSchema = zod.object({
	lockfileVersion: zod.number(),
	specifiers: zod.record(zod.string()).optional(),
	dependencies: zod.record(zod.string()).optional(),
	devDependencies: zod.record(zod.string()).optional(),
	peerDependencies: zod.record(zod.string()).optional(),
	packages: zod.record(
		zod.object({
			resolution: zod.object({ integrity: zod.string() }),
			dependencies: zod.record(zod.string()).optional(),
			dev: zod.boolean().optional(),
		}),
	),
});

export type generateReportOptions = {
	format: "gitlab-license-report-2.1" | "cyclonedx-builtin";
};

export const analyseProject = async (pathOrDir: string) => {
	const readPackageJson = async (packageJsonAbs: string) =>
		await fs
			.readFile(packageJsonAbs)
			.then((data) => data.toString())
			.then((json) => JSON.parse(json))
			.then((obj) => NodePackageJsonSchema.parse(obj));

	const readPackageLock = async (packageLockAbs: string) =>
		await fs
			.readFile(packageLockAbs)
			.then((data) => data.toString())
			.then((yaml) => parseYaml(yaml))
			.then((obj) => PnpmPackageLockSchema.parse(obj));

	const spdxFromPnpmName = async (qualifiedName: string) => {
		// e.g. /@aws-sdk/service-error-classification/3.186.0
		const storeName = `${qualifiedName
			.split("/")
			.slice(1, -1)
			.join("+")}@${qualifiedName.split("/").at(-1)}`;
		const storePackagePath = path.join(
			storeName,
			"node_modules",
			...qualifiedName.split("/").slice(1, -1),
			"package.json",
		);
		const license = await readPackageJson(
			path.join(
				path.dirname(packageJson),
				"node_modules",
				".pnpm",
				storePackagePath,
			),
		)
			.then((pkg) => spdx(pkg.license ?? "unlicensed"))
			.catch(() => undefined);
		return license;
	};

	const packageMetadataCache: {
		[name: string]: {
			version: string;
			fullpath: string;
			licenses: string[];
		};
	} = {};

	let packageJson = pathOrDir;
	const ls = await fs.lstat(pathOrDir);
	if (ls.isDirectory()) {
		packageJson = path.join(pathOrDir, "package.json");
	}
	const packageLock = path.join(path.dirname(packageJson), "pnpm-lock.yaml");

	const pkg = await readPackageJson(packageJson);
	const lck = await readPackageLock(packageLock);

	return {
		generateReport: async (
			options: generateReportOptions,
			logger: {
				warn: (s: string) => void;
				error: (s: string) => void;
				info: (s: string) => void;
			} = console,
		): Promise<AbstractReport> => {
			if (options.format === "gitlab-license-report-2.1") {
				const report: GitlabReport = {
					"pnpm-cdx-meta-format": "gitlab-license-report-2.1",
					version: "2.1",
					licenses: [],
					dependencies: [],
				};

				const licenseCollectTask = Object.entries(lck.packages || {}).map(
					async ([qualifiedName]) => {
						const [_, ...parts] = qualifiedName.split("/");
						const version = parts.at(-1);
						if (version) {
							const spdx = await spdxFromPnpmName(qualifiedName);
							if (spdx) {
								const licenses: string[] = [];
								copySpdxLicenses(licenses, spdx);
								report.dependencies.push({
									name: parts.slice(0, -1).join("/"),
									licenses,
									package_manager: "pnpm",
									path: "package.json",
									version,
								});
							} else {
								logger.warn(
									`[WARNING] No license information for ${qualifiedName} because the package doesn't exist or contains invalid an SPDX expression.`,
								);
							}
						}
					},
				);
				await Promise.all(licenseCollectTask);
				const licenseCounts = report.dependencies.reduce((mapped, dep) => {
					dep.licenses.forEach((lic) => {
						mapped[lic] = mapped[lic] + 1 || 1;
					});
					return mapped;
				}, {} as Record<string, number>);
				report.licenses = Object.keys(licenseCounts)
					.map(getLicenseData)
					.map((data) => ({
						id: data.licenseId,
						name: data.name,
						url:
							data.crossRef.at(0)?.url ||
							`https://spdx.org/licenses/${data.licenseId}.html`,
					}));
				return report;
			} else if (options.format === "cyclonedx-builtin") {
				return { "pnpm-cdx-meta-format": "gitlab-license-report-2.1" };
			}
			throw new Error("Unknown error");
		},
	};
};

export interface GitlabReport extends AbstractReport {
	version: "2.1";
	licenses: { id: string; name: string; url: string }[];
	dependencies: {
		name: string;
		version: string;
		package_manager: "pnpm";
		path: string;
		licenses: string[];
	}[];
}

interface AbstractReport {
	["pnpm-cdx-meta-format"]: generateReportOptions["format"];
}

export function isGitlabReport(t: AbstractReport): t is GitlabReport {
	if (typeof t["pnpm-cdx-meta-format"] === "string") {
		if (t["pnpm-cdx-meta-format"] === "gitlab-license-report-2.1") {
			return true;
		}
	}
	return false;
}

export function isLicenseInfo(
	x: LicenseInfo | ConjunctionInfo | undefined,
): x is LicenseInfo {
	if (x) {
		return Object.hasOwn(x, "license");
	}
	return false;
}

export function isConjunctionInfo(
	x: LicenseInfo | ConjunctionInfo | undefined,
): x is ConjunctionInfo {
	if (x) {
		return Object.hasOwn(x, "conjunction");
	}
	return false;
}

/**
 * Copies all license identifier from an SPDX object to the provided string array
 * @param licenses_out
 * @param spdx
 */
export const copySpdxLicenses = (
	licenses_out: string[],
	spdx: LicenseInfo | ConjunctionInfo,
) => {
	if (isLicenseInfo(spdx)) {
		licenses_out.push(spdx.license);
	} else {
		copySpdxLicenses(licenses_out, spdx.left);
		copySpdxLicenses(licenses_out, spdx.right);
	}
};
