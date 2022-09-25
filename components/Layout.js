import React from "react";
import NextLink from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Layout({ children }) {
	return (
		<main style={{ maxWidth: "1280px", margin: "0 auto" }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<NextLink href="/" passHref>
					<a style={{ textDecoration: "none" }}>
						<h1>Welcome to Devs DAO</h1>
					</a>
				</NextLink>
				<ConnectButton />
			</div>
			<hr />
			<div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
				<h2 style={{ marginTop: "8px" }}>
					<NextLink href="/whitelist" prefetch>
						Join Now
					</NextLink>
				</h2>
				<h2 style={{ marginTop: "8px" }}>
					<NextLink href="/mint-nft" prefetch>
						Mint NFT
					</NextLink>
				</h2>
				<h2 style={{ marginTop: "8px" }}>
					<NextLink href="/claim-token" prefetch>
						Claim Tokens
					</NextLink>
				</h2>
				<h2 style={{ marginTop: "8px" }}>
					<NextLink href="/vote" prefetch>
						Proposals
					</NextLink>
				</h2>
			</div>
			{children}
		</main>
	);
}
