import {
	Badge,
	Box,
	Card,
	Code,
	Flex,
	Grid,
	Heading,
	Table,
	Text,
} from "@radix-ui/themes";

const tools = [
	{
		name: "scan_domain",
		description: "ドメイン名の利用可否チェック（RDAP ベース + DNS fallback）",
		apiPath: "/scan/api/domain?domain=example.com",
		status: "available" as const,
	},
	{
		name: "scan_dns",
		description: "DNSレコード照会（A/AAAA/MX/TXT/NS/CNAME/SOA）",
		apiPath: "/scan/api/dns?domain=example.com&types=A,MX",
		status: "available" as const,
	},
	{
		name: "scan_domains_bulk",
		description: "複数ドメインの一括チェック",
		apiPath: "",
		status: "coming" as const,
	},
	{
		name: "scan_ip",
		description: "IP アドレスの情報照会",
		apiPath: "",
		status: "coming" as const,
	},
	{
		name: "scan_ssl",
		description: "SSL 証明書の確認",
		apiPath: "",
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

			<Grid columns="1" gap="4" mb="6">
				<Card>
					<Heading size="3" mb="3">
						接続情報
					</Heading>
					<Table.Root>
						<Table.Body>
							<Table.Row>
								<Table.RowHeaderCell>MCP</Table.RowHeaderCell>
								<Table.Cell>
									<Code>https://kit.ich.sh/scan/mcp</Code>
								</Table.Cell>
							</Table.Row>
							<Table.Row>
								<Table.RowHeaderCell>REST API</Table.RowHeaderCell>
								<Table.Cell>
									<Code>https://kit.ich.sh/scan/api/</Code>
								</Table.Cell>
							</Table.Row>
						</Table.Body>
					</Table.Root>
				</Card>
			</Grid>

			<Heading size="4" mb="3">
				ツール一覧
			</Heading>
			<Flex direction="column" gap="3">
				{tools.map((tool) => (
					<Card key={tool.name}>
						<Flex direction="column" gap="2">
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
							{tool.apiPath && (
								<Text size="1" color="gray">
									API: <Code>{tool.apiPath}</Code>
								</Text>
							)}
						</Flex>
					</Card>
				))}
			</Flex>
		</Box>
	);
}
