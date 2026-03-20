import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { DnsRecordType } from "../../shared/types";
import { scanDns } from "./tools/scan-dns";
import { scanDomains } from "./tools/scan-domain";
import { scanIp } from "./tools/scan-ip";
import { suggestDomains } from "./tools/suggest-domains";

export const apiApp = new Hono();

apiApp.get(
	"/domain",
	zValidator(
		"query",
		z.object({
			domain: z.string().min(1),
		}),
	),
	async (c) => {
		const { domain } = c.req.valid("query");
		const result = await scanDomains(domain);
		return c.json(result);
	},
);

apiApp.get(
	"/suggest",
	zValidator(
		"query",
		z.object({
			keyword: z.string().min(1),
			tlds: z.string().optional(),
		}),
	),
	async (c) => {
		const { keyword, tlds: tldsStr } = c.req.valid("query");
		const tlds = tldsStr ? tldsStr.split(",") : undefined;
		const result = await suggestDomains(keyword, tlds);
		return c.json(result);
	},
);

function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string | null {
	return (
		c.req.header("cf-connecting-ip") ||
		c.req.header("x-real-ip") ||
		c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
		null
	);
}

apiApp.get("/myip", (c) => {
	const ip = getClientIp(c);
	return c.json({ ip: ip ?? null });
});

apiApp.get(
	"/ip",
	zValidator(
		"query",
		z.object({
			ip: z.string().min(1),
		}),
	),
	async (c) => {
		const { ip } = c.req.valid("query");
		const result = await scanIp(ip);
		return c.json(result);
	},
);

apiApp.get(
	"/dns",
	zValidator(
		"query",
		z.object({
			domain: z.string().min(1),
			types: z.string().optional(),
		}),
	),
	async (c) => {
		const { domain, types: typesStr } = c.req.valid("query");
		const types = typesStr
			? (typesStr.split(",") as DnsRecordType[])
			: undefined;
		const result = await scanDns(domain, types);
		return c.json(result);
	},
);
