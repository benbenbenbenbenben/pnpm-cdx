import { describe, expect, test } from "vitest";
import { analyseProject, copySpdxLicenses, isGitlabReport } from ".";

describe("pnpm-cdx", () => {
	test(
		"can generate a gitlab license report version 2.1",
		async () => {
			const analysis = await analyseProject("./test-project");
			const report = await analysis.generateReport({
				format: "gitlab-license-report-2.1",
			});
			expect(isGitlabReport(report)).toBeTruthy();
			if (isGitlabReport(report)) {
				expect(report.version).toBe("2.1");
				expect(Array.isArray(report.licenses)).toBeTruthy();
			}
		},
		{ timeout: 60000 },
	);
	test("copySpdxLicense: can copy license", () => {
		const licenses: string[] = [];
		copySpdxLicenses(licenses, {
			license: "MIT",
		});
		copySpdxLicenses(licenses, {
			conjunction: "and",
			left: { license: "MPL" },
			right: { license: "MY_LICENSE" },
		});
		expect(licenses).toStrictEqual(["MIT", "MPL", "MY_LICENSE"]);
	});
});
