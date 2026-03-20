import { Hono } from "hono";
import { cors } from "hono/cors";
import { apiApp } from "./scan/api";
import { mcpHandler } from "./scan/mcp-handler";

type Env = { Bindings: { ASSETS: { fetch: typeof fetch } } };

const app = new Hono<Env>();

app.use("/scan/api/*", cors());
app.use("/scan/mcp/*", cors());

app.route("/scan/api", apiApp);
app.all("/scan/mcp", mcpHandler);

app.get("/api/health", (c) =>
	c.json({ name: "kit", version: "0.1.0", status: "ok" }),
);

app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
