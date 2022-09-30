import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import { useEffect, useState, useRef } from "react";
import { WHITELIST_CONTRACT_ADDRESS, WHITELIST_ABI } from "../constants";

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
					<button>
						<p>Thanks for joining the whitelist</p>
					</button>
				);
			} else if (isLoading) {
				return <button>Loading...</button>;
			} else {
				return (
					<button onClick={addAddressToWhitelist}>
						<p>Join the Whitelist</p>
					</button>
				);
			}
		} else {
			return (
				<button onClick={connectWallet}>
					<p>Connect wallet</p>
				</button>
			);
		}
	}

	return (
		<>
			<br />
			<h1>Welcome to DEVS DAO</h1>
			<h2>Join out whitelist to get access to presale</h2>
			<br />
			{renderButton()}
		</>
	);
}
