import { Argument, Command, Option, program } from "commander";
import fs from "node:fs";

import { analyseProject } from "./index.js";
import { getLicenseData } from "./licenseDataCache.js";

program
	.addArgument(
		new Argument("<format>", "The output format.").choices([
			"gitlab",
			"cyclonedx",
		]),
	)
	.addArgument(
		new Argument("<path>", "A package.json or directory to process.")
			.default(".")
			.argOptional(),
	)
	.addOption(
		new Option(
			"-o --output <output>",
			"A file to write to, otherwise writes to stdout.",
		),
	)
	.action(
		async (
			format: "gitlab" | "cyclonedx",
			path: string,
			opts: { output?: string },
		) => {
			const analysis = await analyseProject(path);

			let logger = {
				warn: (s: string) => console.warn(s),
				info: (s: string) => console.info(s),
				error: (s: string) => console.error(s),
			};
			if (opts.output === undefined) {
				logger.warn = (s: string) => fs.appendFileSync("./pnpm-cdx.log", s);
				logger.info = (s: string) => fs.appendFileSync("./pnpm-cdx.log", s);
				logger.error = (s: string) => fs.appendFileSync("./pnpm-cdx.log", s);
			}

			let report:
				| Awaited<ReturnType<typeof analysis["generateReport"]>>
				| undefined;
			if (format === "gitlab") {
				report = await analysis.generateReport(
					{
						format: "gitlab-license-report-2.1",
					},
					logger,
				);
			}
			if (format === "cyclonedx") {
				report = await analysis.generateReport(
					{
						format: "cyclonedx-builtin",
					},
					logger,
				);
			}
			if (report) {
				if (opts.output) {
					fs.writeFileSync(opts.output, JSON.stringify(report, null, 2));
				} else {
					console.log(JSON.stringify(report, null, 2));
				}
			}
		},
	)
	.addCommand(
		new Command("info")
			.addArgument(
				new Argument(
					"<spdx>",
					"The SPDX identifier of the license you want to view.",
				),
			)
			.action((spdxId) => {
				console.log(JSON.stringify(getLicenseData(spdxId), null, 2));
			}),
	)
	.parseAsync();
