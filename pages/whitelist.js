import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import { useEffect, useState, useRef } from "react";
import { WHITELIST_CONTRACT_ADDRESS, WHITELIST_ABI } from "../constants";
import { Text, Button, Loading, Spacer } from "@nextui-org/react";

export default function home() {
	const [isWalletConnected, setIsWalletConnected] = useState(false);
	const [isJoinedWhitelist, setIsJoinedWhitelist] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);
	const web3ModalRef = useRef();

	useEffect(() => {
		if (!isWalletConnected) {
			web3ModalRef.current = new Web3Modal({
				network: "goerli",
				providerOptions: {},
				disableInjectedProvider: false,
			});
			connectWallet();
		}
	}, [isWalletConnected]);

	async function getProviderOrSigner(needSinger = false) {
		const provider = await web3ModalRef.current.connect();
		const web3Provider = new providers.Web3Provider(provider);
		const { chainId } = await web3Provider.getNetwork();

		if (chainId !== 5) {
			window.alert("Change the network to goerli");
			throw new Error("Change the network to goerli");
		}

		if (needSinger) {
			const signer = web3Provider.getSigner();
			return signer;
		}

		return web3Provider;
	}

	async function addAddressToWhitelist() {
		try {
			const signer = await getProviderOrSigner(true);
			const whitelistContract = new Contract(
				WHITELIST_CONTRACT_ADDRESS,
				WHITELIST_ABI,
				signer
			);

			const tx = await whitelistContract.addAddresssToWhitelist();
			setIsLoading(true);
			await tx.wait();
			setIsLoading(false);
			await getNumberOfWhitelisted();
			setIsJoinedWhitelist(true);
		} catch (error) {
			console.error(error);
		}
	}

	async function getNumberOfWhitelisted() {
		try {
			const provider = await getProviderOrSigner();
			const whitelistContract = new Contract(
				WHITELIST_CONTRACT_ADDRESS,
				WHITELIST_ABI,
				provider
			);
			const _numberOfWhitelisted =
				await whitelistContract.numAddressesWhitelisted();
			setNumberOfWhitelisted(_numberOfWhitelisted);
		} catch (error) {
			console.error(error);
		}
	}

	async function checkIfAddressInWhiteList() {
		try {
			const signer = await getProviderOrSigner(true);
			const whitelistContract = new Contract(
				WHITELIST_CONTRACT_ADDRESS,
				WHITELIST_ABI,
				signer
			);

			const address = await signer.getAddress();
			const _joinedWhitelist =
				await whitelistContract.whitelistedAddresses(address);

			setIsJoinedWhitelist(_joinedWhitelist);
		} catch (error) {
			console.error(error);
		}
	}

	async function connectWallet() {
		try {
			await getProviderOrSigner();
			setIsWalletConnected(true);
			checkIfAddressInWhiteList();
			getNumberOfWhitelisted();
		} catch (error) {
			console.error(error);
		}
	}

	function renderButton() {
		if (isWalletConnected) {
			if (isJoinedWhitelist) {
				return (
					<Button
						flat
						auto
						rounded
						color="gradient"
						size="xl"
						css={{ minWidth: "368px" }}
					>
						<Text size={16} weight="bold" transform="uppercase">
							Thanks for joining the whitelist
						</Text>
					</Button>
				);
			} else if (isLoading) {
				return (
					<Button
						flat
						auto
						rounded
						color="gradient"
						size="xl"
						css={{ minWidth: "368px" }}
					>
						<Loading
							type="points-opacity"
							color="currentColor"
							size="sm"
						/>
					</Button>
				);
			} else {
				return (
					<Button
						onClick={addAddressToWhitelist}
						flat
						auto
						rounded
						color="gradient"
						size="xl"
						css={{ minWidth: "368px" }}
					>
						<Text
							css={{ color: "inherit" }}
							size={16}
							weight="bold"
							transform="uppercase"
						>
							Join the Whitelist
						</Text>
					</Button>
				);
			}
		} else {
			return (
				<Button
					onClick={connectWallet}
					flat
					auto
					rounded
					color="gradient"
					size="xl"
					css={{ minWidth: "368px" }}
				>
					<Text
						css={{ color: "inherit" }}
						size={16}
						weight="bold"
						transform="uppercase"
					>
						Connect wallet
					</Text>
				</Button>
			);
		}
	}

	return (
		<>
			<Spacer />
			<Text
				size={72}
				weight="bold"
				css={{
					textGradient: "45deg, $blue600 -20%, $pink600 50%",
				}}
			>
				Welcome to DEVS DAO
			</Text>
			<Text
				size={48}
				weight="bold"
				css={{
					textGradient: "45deg, $yellow600 -20%, $pink600 50%",
				}}
			>
				Join out whitelist to get access to presale
			</Text>
			<Spacer />
			{renderButton()}
		</>
	);
}
