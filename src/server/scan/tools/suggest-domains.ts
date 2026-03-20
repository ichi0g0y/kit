import type {
	DomainCheckResult,
	DomainSuggestionResult,
} from "../../../shared/types";
import { Semaphore } from "../../core/semaphore";
import { scanDomainOne } from "./scan-domain";

const DEFAULT_TLDS = ["com", "net", "org", "io", "dev"];
const PREFIXES = ["get", "my", "try", "go", "the"];
const SUFFIXES = ["app", "hq", "hub", "lab", "dev"];
const MAX_CANDIDATES = 50;
const CONCURRENCY = 5;

function generateCandidates(keyword: string, tlds: string[]): string[] {
	const kw = keyword.toLowerCase().replace(/[^a-z0-9-]/g, "");
	const candidates = new Set<string>();

	for (const tld of tlds) {
		candidates.add(`${kw}.${tld}`);
	}

	for (const prefix of PREFIXES) {
		candidates.add(`${prefix}${kw}.com`);
	}

	for (const suffix of SUFFIXES) {
		candidates.add(`${kw}${suffix}.com`);
	}

	const arr = [...candidates];
	return arr.slice(0, MAX_CANDIDATES);
}

export async function suggestDomains(
	keyword: string,
	tlds?: string[],
): Promise<DomainSuggestionResult> {
	const candidates = generateCandidates(keyword, tlds ?? DEFAULT_TLDS);
	const sem = new Semaphore(CONCURRENCY);

	const results = await Promise.all(
		candidates.map((d) => sem.run(() => scanDomainOne(d))),
	);

	const available: DomainCheckResult[] = [];
	const registered: DomainCheckResult[] = [];

	for (const r of results) {
		if (r.status === "available") available.push(r);
		else registered.push(r);
	}

	return {
		keyword,
		candidates_checked: candidates.length,
		available,
		registered,
	};
}
