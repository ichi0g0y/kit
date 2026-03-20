export type RdapStatus = "found" | "not_found" | "rate_limited" | "error";

export interface RdapResponse {
	status: RdapStatus;
	http_status: number;
	registration_date?: string;
	expiry_date?: string;
	raw_status?: string;
	registrar_name?: string;
	nameservers?: string[];
}

const RDAP_SERVERS: Record<string, string> = {
	com: "https://rdap.verisign.com/com/v1",
	net: "https://rdap.verisign.com/net/v1",
	org: "https://rdap.publicinterestregistry.org/rdap",
	io: "https://rdap.nic.io/v1",
	dev: "https://rdap.nic.google/v1",
	app: "https://rdap.nic.google/v1",
	me: "https://rdap.nic.me/v1",
	sh: "https://rdap.nic.sh/v1",
	xyz: "https://rdap.nic.xyz/v1",
};

const FALLBACK_RDAP = "https://rdap.org";

function getTld(domain: string): string {
	const parts = domain.split(".");
	return parts[parts.length - 1].toLowerCase();
}

async function fetchRdapUrl(url: string): Promise<RdapResponse> {
	try {
		const resp = await fetch(url, {
			headers: { Accept: "application/rdap+json" },
		});

		if (resp.status === 404) {
			return { status: "not_found", http_status: 404 };
		}

		if (resp.status === 429) {
			return { status: "rate_limited", http_status: 429 };
		}

		if (!resp.ok) {
			return { status: "error", http_status: resp.status };
		}

		const data = (await resp.json()) as Record<string, unknown>;

		const events = data.events as
			| Array<{ eventAction: string; eventDate: string }>
			| undefined;
		let registrationDate: string | undefined;
		let expiryDate: string | undefined;

		if (events) {
			for (const event of events) {
				if (event.eventAction === "registration") {
					registrationDate = event.eventDate;
				}
				if (event.eventAction === "expiration") {
					expiryDate = event.eventDate;
				}
			}
		}

		const entities = data.entities as
			| Array<{ roles?: string[]; handle?: string }>
			| undefined;
		let registrarName: string | undefined;
		if (entities) {
			const registrar = entities.find((e) => e.roles?.includes("registrar"));
			registrarName = registrar?.handle;
		}

		const nameserversRaw = data.nameservers as
			| Array<{ ldhName: string }>
			| undefined;
		const nameservers = nameserversRaw?.map((ns) => ns.ldhName.toLowerCase());

		const statusArray = data.status as string[] | undefined;

		return {
			status: "found",
			http_status: resp.status,
			registration_date: registrationDate,
			expiry_date: expiryDate,
			raw_status: statusArray?.join(", "),
			registrar_name: registrarName,
			nameservers,
		};
	} catch {
		return { status: "error", http_status: 0 };
	}
}

export interface RdapIpResponse {
	status: RdapStatus;
	cidr: string | null;
	name: string | null;
	country: string | null;
	start_address: string | null;
	end_address: string | null;
	organization: string | null;
	abuse_contact: string | null;
}

export async function queryRdapIp(ip: string): Promise<RdapIpResponse> {
	const empty: RdapIpResponse = {
		status: "error",
		cidr: null,
		name: null,
		country: null,
		start_address: null,
		end_address: null,
		organization: null,
		abuse_contact: null,
	};

	try {
		const resp = await fetch(`${FALLBACK_RDAP}/ip/${encodeURIComponent(ip)}`, {
			headers: { Accept: "application/rdap+json" },
		});

		if (resp.status === 404) return { ...empty, status: "not_found" };
		if (resp.status === 429) return { ...empty, status: "rate_limited" };
		if (!resp.ok) return empty;

		const data = (await resp.json()) as Record<string, unknown>;

		// CIDR
		let cidr: string | null = null;
		const cidrs = data.cidr0_cidrs as
			| Array<{ v4prefix?: string; v6prefix?: string; length?: number }>
			| undefined;
		if (cidrs?.[0]) {
			const c = cidrs[0];
			const prefix = c.v4prefix ?? c.v6prefix;
			if (prefix && c.length != null) cidr = `${prefix}/${c.length}`;
		}

		// Entities: org + abuse
		let organization: string | null = null;
		let abuseContact: string | null = null;
		const entities = data.entities as
			| Array<{
					roles?: string[];
					handle?: string;
					vcardArray?: [string, Array<[string, Record<string, unknown>, string, string]>];
					entities?: Array<{
						roles?: string[];
						vcardArray?: [string, Array<[string, Record<string, unknown>, string, string]>];
					}>;
			  }>
			| undefined;

		if (entities) {
			for (const entity of entities) {
				if (entity.roles?.includes("registrant") || entity.roles?.includes("administrative")) {
					organization = organization ?? entity.handle ?? null;
				}
				if (entity.roles?.includes("abuse")) {
					const vcard = entity.vcardArray?.[1];
					const emailEntry = vcard?.find((v) => v[0] === "email");
					if (emailEntry) abuseContact = emailEntry[3] ?? null;
				}
				// nested entities (common in ARIN responses)
				if (entity.entities) {
					for (const sub of entity.entities) {
						if (sub.roles?.includes("abuse")) {
							const vcard = sub.vcardArray?.[1];
							const emailEntry = vcard?.find((v) => v[0] === "email");
							if (emailEntry) abuseContact = abuseContact ?? emailEntry[3] ?? null;
						}
					}
				}
			}
			// fallback: use first entity handle as org
			if (!organization && entities[0]?.handle) {
				organization = entities[0].handle;
			}
		}

		return {
			status: "found",
			cidr,
			name: (data.name as string) ?? null,
			country: (data.country as string) ?? null,
			start_address: (data.startAddress as string) ?? null,
			end_address: (data.endAddress as string) ?? null,
			organization,
			abuse_contact: abuseContact,
		};
	} catch {
		return empty;
	}
}

export async function queryRdap(domain: string): Promise<RdapResponse> {
	const tld = getTld(domain);
	const server = RDAP_SERVERS[tld];
	const encoded = encodeURIComponent(domain);

	if (server) {
		return fetchRdapUrl(`${server}/domain/${encoded}`);
	}

	return fetchRdapUrl(`${FALLBACK_RDAP}/domain/${encoded}`);
}
