import { Hono } from "hono";
import { cors } from "hono/cors";
import { scanApp } from "./scan";

const app = new Hono();

app.use("/scan/api/*", cors());
app.use("/scan/mcp/*", cors());

app.route("/scan", scanApp);

app.get("/api/health", (c) =>
	c.json({ name: "kit", version: "0.1.0", status: "ok" }),
);

export default app;
