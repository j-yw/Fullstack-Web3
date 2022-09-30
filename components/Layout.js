import React from "react";
import NextLink from "next/link";

export function Layout({ children }) {
	return (
		<main style={{ maxWidth: "1280px", margin: "0 auto" }}>
			<div>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<NextLink href="/" passHref>
						<a style={{ textDecoration: "none" }}>
							<h1>DEMO DAO</h1>
						</a>
					</NextLink>
				</div>
				<hr />
				<div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
					<h2>
						<NextLink href="/whitelist">Whitelist</NextLink>
					</h2>
					<h2>
						<NextLink href="/mint-nft">Mint NFT</NextLink>
					</h2>
					<h2>
						<NextLink href="/claim-token">Claim Token</NextLink>
					</h2>
					<h2>
						<NextLink href="/vote">Vote here</NextLink>
					</h2>
				</div>
			</div>
			{children}
		</main>
	);
}
