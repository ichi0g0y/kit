import { Box, Container, Flex, Link, Text } from "@radix-ui/themes";
import { Link as RouterLink, Outlet } from "react-router";

export function Layout() {
	return (
		<Box className="min-h-screen">
			<Box asChild className="border-b border-gray-800">
				<header>
					<Container size="3">
						<Flex justify="between" align="center" py="3">
							<Link asChild weight="bold" size="4" highContrast>
								<RouterLink to="/">kit</RouterLink>
							</Link>
							<Flex gap="4">
								<Link asChild size="2" color="gray">
									<RouterLink to="/scan">Scan</RouterLink>
								</Link>
							</Flex>
						</Flex>
					</Container>
				</header>
			</Box>

			<Container size="3" py="6">
				<Outlet />
			</Container>

			<Box asChild className="border-t border-gray-800 mt-auto">
				<footer>
					<Container size="3">
						<Flex justify="center" py="4">
							<Text size="1" color="gray">
								kit.ich.sh
							</Text>
						</Flex>
					</Container>
				</footer>
			</Box>
		</Box>
	);
}
