import { queryDoh } from "../../core/dns";
import type { DnsRecordType, DnsResult } from "../../../shared/types";

const DEFAULT_TYPES: DnsRecordType[] = ["A", "AAAA", "MX"];

export async function scanDns(
	domain: string,
	types?: DnsRecordType[],
): Promise<DnsResult> {
	const queryTypes = types ?? DEFAULT_TYPES;
	const results = await Promise.all(
		queryTypes.map((type) => queryDoh(domain, type)),
	);

	return {
		domain,
		records: results.flat(),
		query_types: queryTypes,
	};
}
