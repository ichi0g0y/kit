import type { IpScanResult } from "../../../shared/types";
import { queryPtr } from "../../core/dns";
import { queryRdapIp } from "../../core/rdap";

interface IpApiResponse {
	status: string;
	country?: string;
	countryCode?: string;
	regionName?: string;
	city?: string;
	lat?: number;
	lon?: number;
	timezone?: string;
	isp?: string;
	as?: string;
	asname?: string;
}

async function fetchIpApi(ip: string): Promise<IpApiResponse | null> {
	try {
		const resp = await fetch(
			`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,regionName,city,lat,lon,timezone,isp,as,asname`,
		);
		if (!resp.ok) return null;
		const data = (await resp.json()) as IpApiResponse;
		if (data.status !== "success") return null;
		return data;
	} catch {
		return null;
	}
}

function parseAsNumber(asStr: string | undefined): number | null {
	if (!asStr) return null;
	const match = asStr.match(/^AS(\d+)/);
	return match ? Number.parseInt(match[1], 10) : null;
}

export async function scanIp(ip: string): Promise<IpScanResult> {
	const [ptrResult, rdapResult, geoResult] = await Promise.allSettled([
		queryPtr(ip),
		queryRdapIp(ip),
		fetchIpApi(ip),
	]);

	const ptr =
		ptrResult.status === "fulfilled" ? ptrResult.value : null;
	const rdap =
		rdapResult.status === "fulfilled" ? rdapResult.value : null;
	const geo =
		geoResult.status === "fulfilled" ? geoResult.value : null;

	return {
		ip,
		reverse_dns: ptr,
		network:
			rdap && rdap.status === "found"
				? {
						cidr: rdap.cidr,
						name: rdap.name,
						country: rdap.country,
						start_address: rdap.start_address,
						end_address: rdap.end_address,
					}
				: null,
		organization: rdap?.organization ?? null,
		abuse_contact: rdap?.abuse_contact ?? null,
		asn: geo
			? {
					number: parseAsNumber(geo.as),
					name: geo.asname ?? null,
				}
			: null,
		geolocation: geo
			? {
					country: geo.country ?? null,
					country_code: geo.countryCode ?? null,
					region: geo.regionName ?? null,
					city: geo.city ?? null,
					lat: geo.lat ?? null,
					lon: geo.lon ?? null,
					timezone: geo.timezone ?? null,
					isp: geo.isp ?? null,
				}
			: null,
	};
}
