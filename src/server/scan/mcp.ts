import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { scanDns } from "./tools/scan-dns";
import { scanDomain } from "./tools/scan-domain";

export function createMcpServer() {
	const server = new McpServer({
		name: "kit-scan",
		version: "0.1.0",
	});

	server.tool(
		"scan_domain",
		"ドメイン名の利用可否をチェックする。RDAPベースで精度重視の判定を行う。",
		{ domain: z.string().describe("ドメイン名（例: example.com）") },
		async ({ domain }) => {
			const result = await scanDomain(domain);
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
