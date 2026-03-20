import type {
	DomainCheckResult,
	DomainScanResult,
} from "../../../shared/types";
import { queryDoh } from "../../core/dns";
import { queryRdap } from "../../core/rdap";
import { Semaphore } from "../../core/semaphore";

const MAX_DOMAINS = 50;
const CONCURRENCY = 5;

export async function scanDomains(input: string): Promise<DomainScanResult> {
	const domains = input
		.split(/[\s,]+/)
		.map((d) => d.trim().toLowerCase())
		.filter(Boolean)
		.slice(0, MAX_DOMAINS);

	if (domains.length === 0) {
		return {
			summary: { total: 0, available: 0, registered: 0, unknown: 0 },
			results: [],
		};
	}

	const sem = new Semaphore(CONCURRENCY);
	const results = await Promise.all(
		domains.map((d) => sem.run(() => scanDomainOne(d))),
	);

	let available = 0;
	let registered = 0;
	let unknown = 0;
	for (const r of results) {
		if (r.status === "available") available++;
		else if (r.status === "registered") registered++;
		else unknown++;
	}

	return {
		summary: { total: results.length, available, registered, unknown },
		results,
	};
}

export async function scanDomainOne(
	domain: string,
): Promise<DomainCheckResult> {
	const normalized = domain.toLowerCase().trim();
	const rdap = await queryRdap(normalized);

	if (rdap.status === "found") {
		return {
			domain: normalized,
			status: "registered",
			confidence: "high",
			method: "rdap",
			rdap: {
				raw_status: rdap.raw_status,
				registration_date: rdap.registration_date,
				expiry_date: rdap.expiry_date,
				registrar_name: rdap.registrar_name,
				nameservers: rdap.nameservers,
			},
		};
	}

	if (rdap.status === "not_found") {
		return {
			domain: normalized,
			status: "available",
			confidence: "high",
			method: "rdap",
		};
	}

	if (rdap.status === "rate_limited") {
		return fallbackDnsCheck(normalized);
	}

	return fallbackDnsCheck(normalized);
}

async function fallbackDnsCheck(domain: string): Promise<DomainCheckResult> {
	const records = await queryDoh(domain, "A");

	if (records.length > 0) {
		return {
			domain,
			status: "registered",
			confidence: "medium",
			method: "dns_fallback",
		};
	}

	return {
		domain,
		status: "unknown",
		confidence: "low",
		method: "dns_fallback",
	};
}
