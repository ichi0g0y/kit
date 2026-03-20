export type DomainStatus = "available" | "registered" | "unknown" | "error";
export type Confidence = "high" | "medium" | "low";
export type CheckMethod = "rdap" | "dns_fallback" | "error";

export interface DomainCheckResult {
	domain: string;
	status: DomainStatus;
	confidence: Confidence;
	method: CheckMethod;
	rdap?: {
		raw_status?: string;
		registration_date?: string;
		expiry_date?: string;
	};
}

export type DnsRecordType =
	| "A"
	| "AAAA"
	| "MX"
	| "TXT"
	| "NS"
	| "CNAME"
	| "SOA";

export interface DnsRecord {
	type: DnsRecordType;
	name: string;
	value: string;
	ttl: number;
	priority?: number;
}

export interface DnsResult {
	domain: string;
	records: DnsRecord[];
	query_types: DnsRecordType[];
}
