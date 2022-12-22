import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import {
	mainnet,
	goerli,
	configureChains,
	createClient,
	WagmiConfig,
} from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { infuraProvider } from "wagmi/providers/infura";
import { publicProvider } from "wagmi/providers/public";
import { Layout } from "../components";

const chains = [mainnet, goerli];

const { provider } = configureChains(chains, [
	infuraProvider({
		apiKey: process.env.NEXT_PUBLIC_INFURA_API_KEY,
		priority: 0,
	}),
	alchemyProvider({
		apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
		priority: 1,
	}),
	publicProvider({ stallTimeout: 5_000, priority: 2 }),
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
