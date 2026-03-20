import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { Hono } from "hono";
import { apiApp } from "./api";
import { createMcpServer } from "./mcp";

export const scanApp = new Hono();

scanApp.route("/api", apiApp);

scanApp.all("/mcp", async (c) => {
	const server = createMcpServer();
	const transport = new WebStandardStreamableHTTPServerTransport({
		sessionIdGenerator: undefined,
	});
	await server.connect(transport);
	return transport.handleRequest(c.req.raw);
});
