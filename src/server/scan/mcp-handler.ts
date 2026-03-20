import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { Context } from "hono";
import { createMcpServer } from "./mcp";

export async function mcpHandler(c: Context) {
	const server = createMcpServer();
	const transport = new WebStandardStreamableHTTPServerTransport({
		sessionIdGenerator: undefined,
	});
	await server.connect(transport);
	return transport.handleRequest(c.req.raw);
}
