import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { Layout } from "../components";

const chains = [
	chain.mainnet,
	chain.goerli,
	chain.polygon,
	chain.polygonMumbai,
	chain.arbitrum,
	chain.arbitrumGoerli,
	chain.optimism,
	chain.optimismGoerli,
	chain.hardhat,
	chain.localhost,
];

const { provider } = configureChains(chains, [
	alchemyProvider({ apiKey: process.env.ALCHEMY_API_KEY }),
	publicProvider(),
]);

const { connectors } = getDefaultWallets({
	appName: "DEVS DAO",
	chains,
});

const wagmiClient = createClient({
	autoConnect: false,
	provider,
	connectors,
});

function MyApp({ Component, pageProps }) {
	return (
		<WagmiConfig client={wagmiClient}>
			<RainbowKitProvider chains={chains}>
				<Layout>
					<Component {...pageProps} />
				</Layout>
			</RainbowKitProvider>
		</WagmiConfig>
	);
}

export default MyApp;
