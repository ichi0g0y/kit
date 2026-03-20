import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { DnsRecordType } from "../../shared/types";
import { scanDns } from "./tools/scan-dns";
import { scanDomain } from "./tools/scan-domain";

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
		const result = await scanDomain(domain);
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
