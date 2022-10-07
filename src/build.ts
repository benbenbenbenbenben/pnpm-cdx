import esbuild from "esbuild";
import { copyFile, rm } from "node:fs/promises";
import { exec } from "node:child_process"

const execx = async (script: string) => {
    return new Promise((resolve, reject) => {
        const proc = exec(script, (err, stdout, stderr) => {
            if (err) {
                return reject(err)
            } else {
                return resolve({ stderr, stdout })
            }
        })
        proc.stderr?.pipe(process.stderr)
        proc.stdout?.pipe(process.stdout)
    })
}

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
    await copyFile("./package.json", "./dist/package.json");
    console.log("-= PUBLISH DRY RUN =-")
    await execx("(cd dist && pnpm publish --dry-run --no-git-checks)")
})();
