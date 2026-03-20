import type { DnsRecord, DnsRecordType } from "../../shared/types";

const DOH_URL = "https://cloudflare-dns.com/dns-query";
const PTR_TYPE = 12;

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

function buildPtrName(ip: string): string {
	if (ip.includes(":")) {
		// IPv6: expand to full form, reverse nibbles
		const parts = ip.split(":");
		const full: string[] = [];
		for (const p of parts) {
			if (p === "") {
				const missing = 8 - parts.filter((x) => x !== "").length;
				for (let i = 0; i < missing + 1; i++) full.push("0000");
			} else {
				full.push(p.padStart(4, "0"));
			}
		}
		const nibbles = full.join("").split("").reverse().join(".");
		return `${nibbles}.ip6.arpa`;
	}
	// IPv4
	return `${ip.split(".").reverse().join(".")}.in-addr.arpa`;
}

export async function queryPtr(ip: string): Promise<string | null> {
	try {
		const name = buildPtrName(ip);
		const url = `${DOH_URL}?name=${encodeURIComponent(name)}&type=${PTR_TYPE}`;
		const resp = await fetch(url, {
			headers: { Accept: "application/dns-json" },
		});
		if (!resp.ok) return null;
		const data = (await resp.json()) as DohResponse;
		const answer = data.Answer?.find((a) => a.type === PTR_TYPE);
		if (!answer) return null;
		// strip trailing dot
		return answer.data.replace(/\.$/, "");
	} catch {
		return null;
	}
}

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
