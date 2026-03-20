export interface WhoisResult {
	status: "found" | "not_found" | "error";
	registrar?: string;
	creation_date?: string;
	expiry_date?: string;
}

/**
 * whoisjs.com API を使った WHOIS フォールバック。
 * RDAP・DNS 両方で判定できない場合に使用。
 */
export async function queryWhois(domain: string): Promise<WhoisResult> {
	try {
		const resp = await fetch(
			`https://whoisjs.com/api/v1/${encodeURIComponent(domain)}`,
			{ headers: { Accept: "application/json" } },
		);

		if (!resp.ok) {
			return { status: "error" };
		}

		const data = (await resp.json()) as {
			success?: boolean;
			creation?: { date?: string };
			registry?: { expiry_date?: string };
			registrar?: { url?: string; whois_server?: string };
		};

		if (!data.success || !data.creation?.date) {
			return { status: "not_found" };
		}

		return {
			status: "found",
			registrar: data.registrar?.whois_server ?? data.registrar?.url,
			creation_date: data.creation.date,
			expiry_date: data.registry?.expiry_date,
		};
	} catch {
		return { status: "error" };
	}
}
