import React from "react";
import {
	Navbar,
	Text,
	Button,
	Switch,
	Spacer,
	Container,
	useTheme,
} from "@nextui-org/react";
import { useTheme as useNextTheme } from "next-themes";
import Link from "next/link";
import { SunIcon, MoonIcon } from "./icons";

export function Layout({ children }) {
	const { setTheme } = useNextTheme();
	const { isDark } = useTheme();

	return (
		<>
			<Navbar isBordered variant="floating">
				<Navbar.Brand>
					<Text b color="inherit" hideIn="xs">
						DAO DEMO
					</Text>
				</Navbar.Brand>
				<Navbar.Content>
					<Navbar.Item>
						<Link href="/whitelist">Whitelist</Link>
					</Navbar.Item>
					<Navbar.Item href="/mint-nft">
						<Link href="/mint-nft">Mint NFT</Link>
					</Navbar.Item>
					<Navbar.Item href="/claim-token">
						<Link href="/claim-token">Claim Token</Link>
					</Navbar.Item>
					<Navbar.Item href="/vote">
						<Link href="/vote">Vote here</Link>
					</Navbar.Item>
					<Switch
						checked={isDark}
						onChange={(e) =>
							setTheme(e.target.checked ? "dark" : "light")
						}
						size="xl"
						iconOn={<SunIcon filled />}
						iconOff={<MoonIcon filled />}
					/>
				</Navbar.Content>
			</Navbar>
			<Spacer />
			<Container>{children}</Container>
		</>
	);
}
