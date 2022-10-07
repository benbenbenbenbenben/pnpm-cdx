# pnpm-cdx

Generate a CycloneDX SBOM from a PNPM Node.js project.

> ⚠️ pnpm-cdx is alpha, it generate license reports for GitLab CI. CycloneDX format is work in progress. ⚠️

# Installing

The pnpm-cdx package includes both a CLI and a library with commonjs and esm entrypoints. Installation is as you would expect:

**With pnpm:**
```bash
pnpm add pnpm-cdx
```

**With yarn:**
```bash
yarn add pnpm-cdx
```

**With npm:**
```bash
npm i pnpm-cdx
```

## Using in CI

Typically in CI scenarios, you may prefer to install pnpm-cdx globally with your package managers global flag (usually `-g`), as in this contrived example adapted from this repository's [Earthly](https://earthly.dev/) [Earthfile](/Earthfile):

```earthly
validate:
    FROM node:16-bullseye
    WORKDIR /app
    RUN npm i pnpm-cdx -g
    RUN pnpm-cdx gitlab -o gl-license-report.json
    SAVE ARTIFACT gl-license-report.json
```

# Usage

```typescript
import { analyseProject } from "pnpm-cdx";

(async () => {
    // analyze *this* project
    const analysis = await analyseProject(".")
    // generate gitlab compatible license report
    const report = await analysis.generateReport({
        format: "gitlab-license-report-2.1",
    })
    // pretty print the report
    console.log(JSON.stringify(report, null, 2))
})()
```