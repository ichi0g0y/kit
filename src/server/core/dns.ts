import type { DnsRecord, DnsRecordType } from "../../shared/types";

const DOH_URL = "https://cloudflare-dns.com/dns-query";

interface DohAnswer {
	name: string;
	type: number;
	TTL: number;
	data: string;
}

interface DohResponse {
	Status: number;
	Answer?: DohAnswer[];
}

const TYPE_MAP: Record<string, DnsRecordType> = {
	"1": "A",
	"28": "AAAA",
	"15": "MX",
	"16": "TXT",
	"2": "NS",
	"5": "CNAME",
	"6": "SOA",
};

const REVERSE_TYPE_MAP: Record<DnsRecordType, string> = {
	A: "A",
	AAAA: "AAAA",
	MX: "MX",
	TXT: "TXT",
	NS: "NS",
	CNAME: "CNAME",
	SOA: "SOA",
};

export async function queryDoh(
	domain: string,
	type: DnsRecordType,
): Promise<DnsRecord[]> {
	const url = `${DOH_URL}?name=${encodeURIComponent(domain)}&type=${REVERSE_TYPE_MAP[type]}`;
	const resp = await fetch(url, {
		headers: { Accept: "application/dns-json" },
	});

	if (!resp.ok) {
		return [];
	}

	const data = (await resp.json()) as DohResponse;
	if (!data.Answer) {
		return [];
	}

	return data.Answer.filter((a) => TYPE_MAP[String(a.type)] === type).map(
		(a) => {
			const record: DnsRecord = {
				type,
				name: a.name,
				value: a.data,
				ttl: a.TTL,
			};
			if (type === "MX") {
				const parts = a.data.split(" ");
				if (parts.length === 2) {
					record.priority = Number.parseInt(parts[0], 10);
					record.value = parts[1];
				}
			}
			return record;
		},
	);
}
