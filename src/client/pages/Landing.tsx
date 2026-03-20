import { Badge, Box, Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import { Link } from "react-router";

const categories = [
	{
		name: "Scan",
		path: "/scan",
		description: "ドメイン、DNS、ネットワークの調査ツール群",
		status: "available" as const,
	},
	{
		name: "Git",
		path: "#",
		description: "Git リポジトリの分析・操作ツール群",
		status: "coming" as const,
	},
	{
		name: "Feed",
		path: "#",
		description: "RSS/Atom フィードの取得・変換ツール群",
		status: "coming" as const,
	},
];

export function Landing() {
	return (
		<Box>
			<Flex direction="column" gap="2" mb="6">
				<Heading size="8">kit</Heading>
				<Text size="4" color="gray">
					小さな道具箱。MCP と REST API で使えるツール群。
				</Text>
			</Flex>

			<Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="4">
				{categories.map((cat) => (
					<Link key={cat.name} to={cat.path} style={{ textDecoration: "none" }}>
						<Card
							className={
								cat.status === "coming"
									? "opacity-50 cursor-not-allowed"
									: "hover:bg-gray-900 transition-colors cursor-pointer"
							}
						>
							<Flex direction="column" gap="2">
								<Flex justify="between" align="center">
									<Heading size="4">{cat.name}</Heading>
									<Badge
										color={cat.status === "available" ? "cyan" : "gray"}
										variant="soft"
									>
										{cat.status === "available" ? "利用可能" : "準備中"}
									</Badge>
								</Flex>
								<Text size="2" color="gray">
									{cat.description}
								</Text>
							</Flex>
						</Card>
					</Link>
				))}
			</Grid>

			<Box mt="8">
				<Heading size="3" mb="3">
					使い方
				</Heading>
				<Flex direction="column" gap="2">
					<Text size="2" color="gray">
						MCP: 各カテゴリの <code>/mcp</code>{" "}
						エンドポイントをMCPクライアントに登録
					</Text>
					<Text size="2" color="gray">
						API: 各カテゴリの <code>/api</code> 配下のRESTエンドポイントを利用
					</Text>
				</Flex>
			</Box>
		</Box>
	);
}
