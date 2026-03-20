import {
	Badge,
	Box,
	Button,
	Card,
	Code,
	Flex,
	Heading,
	ScrollArea,
	Separator,
	Text,
	TextField,
} from "@radix-ui/themes";
import { useCallback, useEffect, useState } from "react";

let cachedGlobalIp: string | null = null;

async function fetchGlobalIp(): Promise<string | null> {
	if (cachedGlobalIp) return cachedGlobalIp;
	const sources = [
		async () => {
			const r = await fetch("https://1.1.1.1/cdn-cgi/trace");
			const text = await r.text();
			return text.match(/ip=(.+)/)?.[1] ?? null;
		},
		async () => {
			const r = await fetch("https://api.ipify.org?format=json");
			const d = (await r.json()) as { ip: string };
			return d.ip ?? null;
		},
	];
	for (const src of sources) {
		try {
			const ip = await src();
			if (ip) { cachedGlobalIp = ip; return ip; }
		} catch { /* try next */ }
	}
	return null;
}

interface DomainResult {
	domain: string;
	status: string;
	method: string;
	rdap?: Record<string, unknown>;
}

const tools = [
	{
		name: "scan_domain",
		description:
			"ドメイン名の利用可否チェック（RDAP ベース + DNS fallback）。スペースまたはカンマ区切りで複数指定可。",
		api: "GET /scan/api/domain?domain=example.com",
		placeholder: "example.com, example.net, example.io",
		buildUrl: (v: string) => `/scan/api/domain?domain=${encodeURIComponent(v)}`,
		status: "available" as const,
	},
	{
		name: "suggest_domain",
		description:
			"キーワードからドメイン候補を自動生成し空き状況をチェック。TLD 未指定時は主要 TLD（com, net, org, io, dev, app, me, sh, xyz）で検索。",
		api: "GET /scan/api/suggest?keyword=myapp&tlds=com,io,dev",
		placeholder: "キーワード（例: deaddrop）",
		extraField: {
			name: "tlds",
			placeholder: "TLD（例: com,io,dev,app,me,sh ／空欄で主要TLD全て）",
		},
		buildUrl: (v: string, extra?: string) => {
			const url = `/scan/api/suggest?keyword=${encodeURIComponent(v)}`;
			const tlds = extra?.trim();
			return tlds ? `${url}&tlds=${encodeURIComponent(tlds)}` : url;
		},
		status: "available" as const,
	},
	{
		name: "scan_dns",
		description: "DNS レコード照会（A/AAAA/MX/TXT/NS/CNAME/SOA）",
		api: "GET /scan/api/dns?domain=example.com&types=A,MX",
		placeholder: "example.com",
		buildUrl: (v: string) => `/scan/api/dns?domain=${encodeURIComponent(v)}`,
		status: "available" as const,
	},
	{
		name: "scan_ip",
		description:
			"IP アドレスの詳細情報（逆引きDNS、ネットワーク、ASN、地理情報、abuse連絡先）",
		api: "GET /scan/api/ip?ip=8.8.8.8",
		placeholder: "8.8.8.8 or 2001:4860:4860::8888",
		buildUrl: (v: string) => `/scan/api/ip?ip=${encodeURIComponent(v)}`,
		status: "available" as const,
	},
];

export function ScanOverview() {
	return (
		<Box>
			<Flex direction="column" gap="2" mb="6">
				<Heading size="7">Scan</Heading>
				<Text size="3" color="gray">
					ドメイン、DNS、ネットワークの調査・スキャンツール群
				</Text>
			</Flex>

			<Flex direction="column" gap="4" mb="6">
				{tools.map((tool) => (
					<ToolCard key={tool.name} tool={tool} />
				))}
			</Flex>

			<Separator size="4" my="4" />
			<ConnectionInfo />
		</Box>
	);
}

function ToolCard({ tool }: { tool: (typeof tools)[number] }) {
	const [input, setInput] = useState("");
	const [extra, setExtra] = useState("");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		if (tool.name === "scan_ip") {
			fetchGlobalIp().then((ip) => {
				if (ip) setInput(ip);
			});
		}
	}, [tool.name]);

	const run = useCallback(async () => {
		const val = input.trim();
		if (!val || !tool.buildUrl) return;
		setLoading(true);
		setResult(null);
		setError("");
		try {
			const resp = await fetch(tool.buildUrl(val, extra));
			if (!resp.ok) {
				setError(`HTTP ${resp.status}: ${await resp.text()}`);
				return;
			}
			setResult(await resp.json());
		} catch (e) {
			setError(e instanceof Error ? e.message : "Unknown error");
		} finally {
			setLoading(false);
		}
	}, [input, extra, tool]);

	return (
		<Card>
			<Flex direction="column" gap="3">
				<Flex justify="between" align="center">
					<Code size="3" weight="bold">
						{tool.name}
					</Code>
					<Badge
						color={tool.status === "available" ? "cyan" : "gray"}
						variant="soft"
					>
						{tool.status === "available" ? "利用可能" : "準備中"}
					</Badge>
				</Flex>
				<Text size="2" color="gray">
					{tool.description}
				</Text>
				{tool.api && (
					<Text size="1" color="gray">
						API: <Code>{tool.api}</Code>
					</Text>
				)}

				{tool.buildUrl && (
					<Flex direction="column" gap="2">
						<Flex gap="2" align="center">
							<Box flexGrow="1">
								<TextField.Root
									size="2"
									placeholder={tool.placeholder}
									value={input}
									onChange={(e) => setInput(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && run()}
								/>
							</Box>
							<Button
								size="2"
								variant="soft"
								onClick={run}
								disabled={loading || !input.trim()}
							>
								{loading ? "..." : "実行"}
							</Button>
						</Flex>
						{"extraField" in tool && tool.extraField && (
							<TextField.Root
								size="1"
								placeholder={tool.extraField.placeholder}
								value={extra}
								onChange={(e) => setExtra(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && run()}
							/>
						)}
					</Flex>
				)}

				{error && (
					<Text color="red" size="2">
						{error}
					</Text>
				)}

				{result && <ResultRenderer name={tool.name} data={result} />}
			</Flex>
		</Card>
	);
}

function ResultRenderer({
	name,
	data,
}: { name: string; data: Record<string, unknown> }) {
	if (name === "scan_domain") return <DomainScanResult data={data} />;
	if (name === "suggest_domain") return <SuggestResult data={data} />;
	if (name === "scan_ip") return <IpScanResultView data={data} />;
	return <JsonResult data={data} />;
}

function StatusBadge({ status }: { status: string }) {
	const color =
		status === "available" ? "green" : status === "registered" ? "red" : "gray";
	const label =
		status === "available"
			? "空き"
			: status === "registered"
				? "登録済"
				: status;
	return (
		<Badge color={color} variant="soft" size="1">
			{label}
		</Badge>
	);
}

function DomainScanResult({ data }: { data: Record<string, unknown> }) {
	const d = data as {
		summary: {
			total: number;
			available: number;
			registered: number;
			unknown: number;
		};
		results: DomainResult[];
	};
	return (
		<Flex direction="column" gap="2">
			<Flex gap="2">
				<Badge color="gray" size="1">
					合計 {d.summary.total}
				</Badge>
				<Badge color="green" size="1">
					空き {d.summary.available}
				</Badge>
				<Badge color="red" size="1">
					登録済 {d.summary.registered}
				</Badge>
				{d.summary.unknown > 0 && (
					<Badge color="gray" size="1">
						不明 {d.summary.unknown}
					</Badge>
				)}
			</Flex>
			<DomainList results={d.results} />
		</Flex>
	);
}

function SuggestResult({ data }: { data: Record<string, unknown> }) {
	const d = data as {
		keyword: string;
		candidates_checked: number;
		available: DomainResult[];
		registered: DomainResult[];
	};
	return (
		<Flex direction="column" gap="2">
			<Text size="2" color="gray">
				「{d.keyword}」で {d.candidates_checked} 件チェック → 空き{" "}
				{d.available.length} 件
			</Text>
			{d.available.length > 0 && <DomainList results={d.available} />}
			{d.registered.length > 0 && (
				<>
					<Text size="1" color="gray" weight="bold">
						登録済み
					</Text>
					<DomainList results={d.registered} />
				</>
			)}
		</Flex>
	);
}

function DomainList({ results }: { results: DomainResult[] }) {
	return (
		<ScrollArea style={{ maxHeight: 300 }}>
			<Flex direction="column" gap="1">
				{results.map((r) => (
					<Flex key={r.domain} align="center" gap="2" wrap="wrap">
						<Code size="2">{r.domain}</Code>
						<StatusBadge status={r.status} />
						<Badge variant="outline" size="1">
							{r.method}
						</Badge>
						{r.rdap && <RdapDetail rdap={r.rdap} />}
					</Flex>
				))}
			</Flex>
		</ScrollArea>
	);
}

function RdapDetail({ rdap }: { rdap: Record<string, unknown> }) {
	const parts: string[] = [];
	if (rdap.registrar_name) parts.push(`registrar: ${rdap.registrar_name}`);
	if (rdap.registration_date)
		parts.push(`reg: ${String(rdap.registration_date).slice(0, 10)}`);
	if (rdap.expiry_date)
		parts.push(`exp: ${String(rdap.expiry_date).slice(0, 10)}`);
	if (!parts.length) return null;
	return (
		<Text size="1" color="gray">
			{parts.join(" / ")}
		</Text>
	);
}

function IpScanResultView({ data }: { data: Record<string, unknown> }) {
	const d = data as {
		ip: string;
		reverse_dns: string | null;
		network: {
			cidr: string | null;
			name: string | null;
			country: string | null;
			start_address: string | null;
			end_address: string | null;
		} | null;
		organization: string | null;
		abuse_contact: string | null;
		asn: { number: number | null; name: string | null } | null;
		geolocation: {
			country: string | null;
			country_code: string | null;
			region: string | null;
			city: string | null;
			lat: number | null;
			lon: number | null;
			timezone: string | null;
			isp: string | null;
		} | null;
	};

	const rows: [string, string | null][] = [
		["IP", d.ip],
		["逆引きDNS", d.reverse_dns],
		["組織", d.organization],
		["Abuse連絡先", d.abuse_contact],
	];
	if (d.network) {
		rows.push(
			["ネットワーク", d.network.cidr],
			["ネットワーク名", d.network.name],
			["範囲", d.network.start_address && d.network.end_address
				? `${d.network.start_address} – ${d.network.end_address}`
				: null],
			["国 (RDAP)", d.network.country],
		);
	}
	if (d.asn) {
		rows.push(
			["ASN", d.asn.number != null ? `AS${d.asn.number}` : null],
			["AS名", d.asn.name],
		);
	}
	if (d.geolocation) {
		const g = d.geolocation;
		rows.push(
			["所在地", [g.city, g.region, g.country].filter(Boolean).join(", ") || null],
			["座標", g.lat != null && g.lon != null ? `${g.lat}, ${g.lon}` : null],
			["タイムゾーン", g.timezone],
			["ISP", g.isp],
		);
	}

	return (
		<ScrollArea style={{ maxHeight: 400 }}>
			<Flex direction="column" gap="1">
				{rows.map(([label, value]) =>
					value ? (
						<Flex key={label} gap="2" align="baseline">
							<Text size="1" color="gray" style={{ minWidth: 100 }}>
								{label}
							</Text>
							<Code size="1">{value}</Code>
						</Flex>
					) : null,
				)}
			</Flex>
		</ScrollArea>
	);
}

function JsonResult({ data }: { data: Record<string, unknown> }) {
	return (
		<ScrollArea style={{ maxHeight: 300 }}>
			<Code size="1">
				<pre style={{ margin: 0 }}>{JSON.stringify(data, null, 2)}</pre>
			</Code>
		</ScrollArea>
	);
}

function ConnectionInfo() {
	return (
		<Card>
			<Heading size="3" mb="2">
				接続情報
			</Heading>
			<Flex direction="column" gap="1">
				<Text size="2">
					MCP: <Code>https://kit.ich.sh/scan/mcp</Code>
				</Text>
				<Text size="2">
					REST: <Code>https://kit.ich.sh/scan/api/</Code>
				</Text>
			</Flex>
		</Card>
	);
}
