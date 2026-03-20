import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { scanDns } from "./tools/scan-dns";
import { scanDomains } from "./tools/scan-domain";
import { scanIp } from "./tools/scan-ip";
import { suggestDomains } from "./tools/suggest-domains";

export function createMcpServer() {
	const server = new McpServer({
		name: "kit-scan",
		version: "0.3.0",
	});

	server.tool(
		"scan_domain",
		"ドメイン名の利用可否をチェックする。スペースまたはカンマ区切りで複数指定可（最大50件）。",
		{
			domain: z
				.string()
				.describe(
					"ドメイン名（例: example.com）。複数はスペースかカンマ区切り",
				),
		},
		async ({ domain }) => {
			const result = await scanDomains(domain);
			return {
				content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
			};
		},
	);

	server.tool(
		"suggest_domain",
		"キーワードからドメイン名候補を自動生成し、利用可否をチェックする。",
		{
			keyword: z.string().describe("ドメイン名のベースとなるキーワード"),
			tlds: z
				.array(z.string())
				.optional()
				.describe(
					"チェック対象のTLD（デフォルト: com, net, org, io, dev, app, me, sh, xyz）",
				),
		},
		async ({ keyword, tlds }) => {
			const result = await suggestDomains(keyword, tlds);
			return {
				content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
			};
		},
	);

	server.tool(
		"scan_ip",
		"IPアドレスの詳細情報を照会する（逆引きDNS、ネットワーク範囲、組織、ASN、地理情報、abuse連絡先）。",
		{
			ip: z.string().describe("IPアドレス（IPv4 or IPv6）"),
		},
		async ({ ip }) => {
			const result = await scanIp(ip);
			return {
				content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
			};
		},
	);

	server.tool(
		"scan_dns",
		"ドメインのDNSレコードを照会する。A/AAAA/MX/TXT/NS/CNAME/SOAに対応。",
		{
			domain: z.string().describe("ドメイン名"),
			types: z
				.array(z.enum(["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA"]))
				.optional()
				.describe("照会するレコードタイプ（デフォルト: A, AAAA, MX）"),
		},
		async ({ domain, types }) => {
			const result = await scanDns(domain, types);
			return {
				content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
			};
		},
	);

	return server;
}
