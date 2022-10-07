import esbuild from "esbuild";
import { writeFile, readFile, copyFile, rm } from "node:fs/promises";
import fse from "fs-extra";
import { exec } from "node:child_process";
import { nodePackageJson } from "./index.js";

const execx = async (script: string) => {
	return new Promise((resolve, reject) => {
		const proc = exec(script, (err, stdout, stderr) => {
			if (err) {
				return reject(err);
			} else {
				return resolve({ stderr, stdout });
			}
		});
		proc.stderr?.pipe(process.stderr);
		proc.stdout?.pipe(process.stdout);
	});
};

(async () => {
	await rm("./dist", { recursive: true, force: true });

	await esbuild.build({
		format: "esm",
		bundle: true,
		platform: "node",
		entryPoints: ["./src/cli.ts"],
		target: "es2020",
		outfile: "./dist/cli.mjs",
		minify: true,
		banner: {
			js: [
				"#! /usr/bin/env node",
				`import { createRequire as topLevelCreateRequire } from 'module'`,
				"const require = topLevelCreateRequire(import.meta.url)",
			].join("\n"),
		},
	});

	await esbuild.build({
		format: "esm",
		bundle: true,
		platform: "node",
		entryPoints: ["./src/index.ts"],
		target: "es2020",
		outfile: "./dist/index.mjs",
		minify: true,
		banner: {
			js: [
				`import { createRequire as topLevelCreateRequire } from 'module'`,
				"const require = topLevelCreateRequire(import.meta.url)",
			].join("\n"),
		},
	});

	await esbuild.build({
		format: "cjs",
		bundle: true,
		platform: "node",
		entryPoints: ["./src/index.ts"],
		target: "es2020",
		outfile: "./dist/index.cjs",
		minify: true,
	});

	const repackage = await readFile("./package.json")
		.then((b) => b.toString())
		.then((s) => JSON.parse(s))
		.then((o) => nodePackageJson.passthrough().parse(o));
	repackage.dependencies = undefined;
	repackage.devDependencies = undefined;
	repackage.peerDependencies = undefined;
	repackage.scripts = undefined;
	await writeFile("./dist/package.json", JSON.stringify(repackage, null, 2));

	await copyFile("./README.md", "./dist/README.md");

	fse.copySync("./src/data/", "./dist/data/");

	console.log("-= PUBLISH DRY RUN =-");
	await execx("(cd dist && pnpm publish --dry-run --no-git-checks)");
})();
