import URL from "node:url";
import path from "node:path";
import { readFileSync } from "node:fs";

type licenseData = {
	licenseId: string;
	name: string;
	crossRef: { url: string }[];
};

const licenseDataCache: Record<string, licenseData> = {};

export const getLicenseData = (id: string) => {
	if (licenseDataCache[id]) {
		return licenseDataCache[id];
	}
	const moduleRoot = path.dirname(URL.fileURLToPath(import.meta.url));
	licenseDataCache[id] = JSON.parse(
		readFileSync(
			path.join(
				moduleRoot,
				`data/license-list-data-3.18/json/details/${id}.json`,
			),
		).toString(),
	) as licenseData;
	return licenseDataCache[id];
};
