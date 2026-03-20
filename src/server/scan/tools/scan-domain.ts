import { queryDoh } from "../../core/dns";
import { hasRdapServer, queryRdap } from "../../core/rdap";
import type { DomainCheckResult } from "../../../shared/types";

export async function scanDomain(domain: string): Promise<DomainCheckResult> {
	const normalized = domain.toLowerCase().trim();

	if (!hasRdapServer(normalized)) {
		return fallbackDnsCheck(normalized);
	}

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

	return {
		domain: normalized,
		status: "unknown",
		confidence: "low",
		method: "error",
	};
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
