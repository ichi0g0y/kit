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

export async function queryRdap(domain: string): Promise<RdapResponse> {
	const tld = getTld(domain);
	const server = RDAP_SERVERS[tld];
	const encoded = encodeURIComponent(domain);

	if (server) {
		return fetchRdapUrl(`${server}/domain/${encoded}`);
	}

	return fetchRdapUrl(`${FALLBACK_RDAP}/domain/${encoded}`);
}
