import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { infuraProvider } from "wagmi/providers/infura";
import { publicProvider } from "wagmi/providers/public";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
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
	infuraProvider({ apiKey: process.env.INFURA_API_KEY, priority: 0 }),
	alchemyProvider({ apiKey: process.env.ALCHEMY_API_KEY, priority: 1 }),
	publicProvider({ priority: 2 }),
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
