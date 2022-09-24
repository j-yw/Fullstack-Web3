import Head from "next/head";
import NextLink from "next/link";

export default function Home() {
	return (
		<div>
			<h1>Welcome to Devs DAO</h1>
			<h2>
				Start by <NextLink href="/whitelist">joining</NextLink> our
				whitelist, then you'll be able to participate in the presale of
				our NFTs
			</h2>
		</div>
	);
}
