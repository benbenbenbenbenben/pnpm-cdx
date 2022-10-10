interface Hash {
	alg:
		| "MD5"
		| "SHA-1"
		| "SHA-256"
		| "SHA-384"
		| "SHA-512"
		| "SHA3-256"
		| "SHA3-384"
		| "SHA3-512"
		| "BLAKE2b-256"
		| "BLAKE2b-384"
		| "BLAKE2b-512"
		| "BLAKE3";
	content: string;
}

interface ExternalReference {
	url: string;
	comment?: string;
	type:
		| "vcs"
		| "issue-tracker"
		| "website"
		| "advisories"
		| "bom"
		| "mailing-list"
		| "social"
		| "chat"
		| "documentation"
		| "support"
		| "distribution"
		| "license"
		| "build-meta"
		| "build-system"
		| "release-notes"
		| "other";
	hashes?: Hash[];
}

interface Tool {
	vendor?: string;
	name?: string;
	version?: string;
	hashes?: Hash[];
	externalReferences?: ExternalReference[];
}

interface Author {
	name?: string;
	email?: string;
	phone?: string;
}

interface Supplier {
	name?: string;
	url?: string[];
	contact?: Author[];
}

interface Text {
	contentType?: string;
	encoding?: "base64";
	content: string;
}

interface LicenseWithId {
	id: string;
	name?: string;
	text?: Text;
	url?: string;
}

interface LicenseWithName {
	id?: string;
	name: string;
	text?: Text;
	url?: string;
}

type License =
	| {
			license: LicenseWithId | LicenseWithName;
	  }
	| {
			expression: string;
	  };

interface SWID {
	tagId: string;
	name: string;
	version?: string;
	tagVersion?: string;
	patch?: boolean;
	text?: Text;
	url: string;
}

interface Diff {
	text?: Text;
	url?: string;
}

interface Issue {
	type: "defect" | "enhancement" | "security";
	id?: string;
	name?: string;
	description?: string;
	source?: { name?: string; url?: string };
	references?: string[];
}

interface Patch {
	type?: "unofficial" | "monkey" | "backport" | "cherry-pick";
	diff?: Diff;
	resolves?: Issue[];
}

interface Contributor {
	timestamp?: string;
	name?: string;
	email?: string;
}

interface Commit {
	uid?: string;
	url?: string;
	author?: Contributor;
	committer?: Contributor;
	message?: string;
}

interface Pedigree {
	ancestors?: Component[];
	descendents?: Component[];
	variants?: Component[];
	commits?: Commit[];
	patches?: Patch[];
	notes?: string;
}

interface Note {
	locale?: string;
	text: Text;
}

interface ReleaseNotes {
	type: "major" | "minor" | "patch" | "pre-release" | "internal" | string;
	title?: string;
	featuredImage?: string;
	socialImage?: string;
	description?: string;
	timestamp?: string;
	aliases?: string[];
	tags?: string[];
	resolves?: Issue[];
	notes?: Note[];
	properties?: { name?: string; value?: string }[];
}

type PublicKey = PublicKeyEC | PublicKeyOKP | PublicKeyRSA;

interface PublicKeyEC {
	kty: "EC";
	crv: "P-256" | "P-384" | "P-521";
	x: string;
	y: string;
}

interface PublicKeyOKP {
	kty: "OKP";
	crv: "Ed25519" | "Ed448";
	x: string;
}

interface PublicKeyRSA {
	kty: "RSA";
	n: string;
	e: string;
}

interface Signature {
	algorithm:
		| "RS256"
		| "RS384"
		| "RS512"
		| "PS256"
		| "PS384"
		| "PS512"
		| "ES256"
		| "ES384"
		| "ES512"
		| "Ed25519"
		| "Ed448"
		| "HS256"
		| "HS384"
		| "HS512";
	keyId?: string;
	publicKey?: PublicKey;
	certificatePath?: string[];
	excludes?: string[];
	value: string;
}

type SignatureProperty =
	| Signature
	| { signers?: Signature[] }
	| { chain?: Signature[] };

interface Component {
	type:
		| "application"
		| "framework"
		| "library"
		| "container"
		| "operating-system"
		| "device"
		| "firmware"
		| "file";
	"mime-type"?: string;
	"bom-ref"?: string;
	supplier?: Supplier;
	author?: string;
	publisher?: string;
	group?: string;
	name: string;
	version?: string;
	description?: string;
	scope?: "required" | "optional" | "excluded";
	hashes?: Hash[];
	licenses?: License[];
	copyright?: string;
	cpe?: string;
	purl?: string;
	swid?: SWID;
	pedigree?: Pedigree;
	externalReferences?: ExternalReference[];
	components?: Component[];
	evidence?: License[];
	releaseNotes?: ReleaseNotes;
	properties?: { name?: string; value?: string }[];
	signature?: SignatureProperty;
}

interface Metadata {
	timestamp?: string;
	tools?: Tool[];
	authors?: Author[];
	components?: Component[];
	manufacture?: Supplier;
	supplier?: Supplier;
	licenses?: License[];
	properties?: { name?: string; value?: string }[];
}

interface Dependency {
	ref: string;
	dependsOn?: string[];
}

interface DataFlow {
	flow: "inbound" | "outbound" | "bi-directional" | "unknown";
	classification: string;
}

interface Service {
	"bom-ref"?: string;
	provider?: Supplier;
	group?: string;
	name: string;
	version?: string;
	description?: string;
	endpoints?: string;
	authenticated?: boolean;
	"x-trust-boundary"?: boolean;
	data?: DataFlow[];
	licenses?: License[];
	externalReferences?: ExternalReference[];
	services?: Service[];
	releaseNotes?: ReleaseNotes;
	properties?: { name?: string; value?: string }[];
	signature?: SignatureProperty;
}

interface Composition {
	aggregate:
		| "complete"
		| "incomplete"
		| "incomplete_first_party_only"
		| "incomplete_third_party_only"
		| "unknown"
		| "not_specified";
	assemblies?: string[];
	dependencies?: string[];
	signature?: SignatureProperty;
}

interface Rating {
	source?: { url?: string; name?: string };
	score?: number;
	severity?:
		| "critical"
		| "high"
		| "medium"
		| "low"
		| "info"
		| "none"
		| "unknown";
	method?: "CVSSv2" | "CVSSv3" | "CVSSv31" | "OWASP" | "other";
	vector?: string;
	justification?: string;
}

interface VersionRange {
	version?: string;
	range: string;
	status?: "affected" | "unaffected" | "unknown";
}

interface VersionVersion {
	version: string;
	range?: string;
	status?: "affected" | "unaffected" | "unknown";
}

type Version = VersionRange | VersionVersion;

interface Analysis {
	state?:
		| "resolved"
		| "resolved_with_pedigree"
		| "exploitable"
		| "in_triage"
		| "false_positive"
		| "not_affected";
	justification?:
		| "code_not_present"
		| "code_not_reachable"
		| "requires_configuration"
		| "requires_dependency"
		| "requires_environment"
		| "protected_by_compiler"
		| "protected_at_runtime"
		| "protected_at_perimeter"
		| "protected_by_mitigating_control";
	response?:
		| "can_not_fix"
		| "will_not_fix"
		| "update"
		| "rollback"
		| "workaround_available";
	detail: string;
}

interface Vulnerability {
	"bom-ref"?: string;
	id?: string;
	source?: { url?: string; name?: string };
	references?: { id: string; source: Vulnerability["source"] }[];
	ratings?: Rating[];
	cwes?: number[];
	description?: string;
	detail?: string;
	recommendation?: string;
	advisories: { title?: string; url: string }[];
	created?: string;
	published?: string;
	updated?: string;
	credits?: {
		organizations?: Supplier[];
		individuals?: Author[];
	};
	tools?: Tool[];
	analysis?: Analysis;
	affects?: { ref: string; versions?: Version[] }[];
}

interface Bom {
	bomFormat: "CycloneDX";
	specVersion: "1.4";
	serialNumber?: string;
	version: number;
	metadata?: Metadata;
	components?: Component[];
	services?: Service[];
	externalReferences?: ExternalReference[];
	dependencies?: Dependency[];
	compositions?: Composition[];
	vulnerabilities?: Vulnerability[];
	signature?: SignatureProperty;
}
