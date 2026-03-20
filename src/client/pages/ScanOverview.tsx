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
import { useCallback, useState } from "react";

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
		description: "キーワードからドメイン候補を自動生成し空き状況をチェック",
		api: "GET /scan/api/suggest?keyword=myapp",
		placeholder: "キーワード（例: deaddrop）",
		buildUrl: (v: string) =>
			`/scan/api/suggest?keyword=${encodeURIComponent(v)}`,
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
		description: "IP アドレスの情報照会",
		api: "",
		placeholder: "",
		buildUrl: null,
		status: "coming" as const,
	},
	{
		name: "scan_ssl",
		description: "SSL 証明書の確認",
		api: "",
		placeholder: "",
		buildUrl: null,
		status: "coming" as const,
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
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState("");

	const run = useCallback(async () => {
		const val = input.trim();
		if (!val || !tool.buildUrl) return;
		setLoading(true);
		setResult(null);
		setError("");
		try {
			const resp = await fetch(tool.buildUrl(val));
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
	}, [input, tool]);

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
