import Web3Modal from "web3modal";
import { BigNumber, Contract, providers, utils } from "ethers";
import { useEffect, useRef, useState } from "react";
import {
	DEVS_TOKEN_CONTRACT_ADDRESS,
	DEVS_TOKEN_ABI,
	DEVS_NFT_CONTRACT_ADDRESS,
	DEVS_NFT_ABI,
} from "../constants";

export default function Home() {
	const web3ModalRef = useRef();

	const zero = BigNumber.from(0);

	const [isWalletConnected, setIsWalletConnected] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
	const [balanceOfToken, setBalancesOfToken] = useState(zero);
	const [tokenAmount, setTokenAmount] = useState(zero);
	const [tokensMinted, setTokensMinted] = useState(zero);
	const [isOwner, setIsOwner] = useState(false);
	const [contractBalance, setContractBalance] = useState(zero);

	async function getTokensToBeClaimed() {
		try {
			const provider = await getProviderOrSigner();
			const nftContract = new Contract(
				DEVS_NFT_CONTRACT_ADDRESS,
				DEVS_NFT_ABI,
				provider
			);

			const tokenContract = new Contract(
				DEVS_TOKEN_CONTRACT_ADDRESS,
				DEVS_TOKEN_ABI,
				provider
			);

			const signer = await getProviderOrSigner(true);
			const address = signer.getAddress();
			const balance = await nftContract.balanceOf(address);

			if (balance.toNumber() === 0) {
				setTokensToBeClaimed(zero);
			} else {
				var amount = 0;
				for (let i = 0; i < balance.toNumber(); i++) {
					const tokenId = await nftContract.tokenOfOwnerByIndex(
						address,
						i
					);
					const claimed = await tokenContract.tokenIdsClaimed(
						tokenId
					);

					if (!claimed) {
						amount++;
					}
				}
				setTokensToBeClaimed(BigNumber.from(zero));
			}
		} catch (error) {
			console.error(error);
			setTokensToBeClaimed(zero);
		}
	}

	async function getBalanceOfContract() {
		try {
			const provider = await getProviderOrSigner();

			const tokenContract = new Contract(
				DEVS_TOKEN_CONTRACT_ADDRESS,
				DEVS_TOKEN_ABI,
				provider
			);

			const balance = await tokenContract.getContractBalance();

			setContractBalance(balance);
		} catch (error) {
			console.error(error);
			setContractBalance(zero);
		}
	}

	async function getBalanceOfTokens() {
		try {
			const provider = await getProviderOrSigner();

			const tokenContract = new Contract(
				DEVS_TOKEN_CONTRACT_ADDRESS,
				DEVS_TOKEN_ABI,
				provider
			);
			const signer = await getProviderOrSigner(true);
			const address = await signer.getAddress();
			const balance = await tokenContract.balanceOf(address);

			setBalancesOfToken(balance);
		} catch (error) {
			console.error(error);
			setBalancesOfToken(zero);
		}
	}

	async function mintToken(amount) {
		try {
			const signer = await getProviderOrSigner(true);
			const tokenContract = new Contract(
				DEVS_TOKEN_CONTRACT_ADDRESS,
				DEVS_TOKEN_ABI,
				signer
			);
			const value = 0.001 * amount;
			const tx = await tokenContract.mint(amount, {
				value: utils.parseEther(value.toString()),
			});
			setIsLoading(true);
			await tx.wait();
			setIsLoading(false);

			window.alert("Tokens Minted");

			await getBalanceOfTokens();
			await getTotalTokensMinted();
			await getTokensToBeClaimed();
		} catch (error) {
			console.error(error);
		}
	}

	async function claimTokens() {
		try {
			const signer = await getProviderOrSigner(true);
			const tokenContract = new Contract(
				DEVS_TOKEN_CONTRACT_ADDRESS,
				DEVS_TOKEN_ABI,
				signer
			);

			const tx = await tokenContract.claim();
			setIsLoading(true);
			await tx.wait();
			setIsLoading(false);

			window.alert("Token Claimed");

			await getBalanceOfTokens();
			await getTotalTokensMinted();
			await getTokensToBeClaimed();
		} catch (error) {
			console.error(error);
		}
	}

	async function getTotalTokensMinted() {
		try {
			const provider = await getProviderOrSigner();
			const tokenContract = new Contract(
				DEVS_TOKEN_CONTRACT_ADDRESS,
				DEVS_TOKEN_ABI,
				provider
			);
			const _tokensMinted = await tokenContract.totalSupply();
			setTokensMinted(_tokensMinted);
		} catch (error) {
			console.error(error);
		}
	}

	async function getOwner() {
		try {
			const provider = await getProviderOrSigner();
			const tokenContract = new Contract(
				DEVS_TOKEN_CONTRACT_ADDRESS,
				DEVS_TOKEN_ABI,
				provider
			);
			const _owner = await tokenContract.owner();
			const signer = await getProviderOrSigner(true);
			const address = await signer.getAddress();

			if (address.toLowerCase() === _owner.toLowerCase()) {
				setIsOwner(true);
			}
		} catch (error) {
			console.error(error.message);
		}
	}

	async function withdraw() {
		try {
			const signer = await getProviderOrSigner(true);

			const tokenContract = new Contract(
				DEVS_TOKEN_CONTRACT_ADDRESS,
				DEVS_TOKEN_ABI,
				signer
			);

			const tx = await tokenContract.withdraw();
			setIsLoading(true);
			await tx.wait();
			setIsLoading(false);
			await getOwner();
		} catch (error) {
			console.error(error);
		}
	}

	async function connectWallet() {
		try {
			await getProviderOrSigner();
			setIsWalletConnected(true);
		} catch (error) {
			console.error(error);
		}
	}

	async function getProviderOrSigner(needSigner = false) {
		const provider = await web3ModalRef.current.connect();
		const web3Provider = new providers.Web3Provider(provider);
		const { chainId } = await web3Provider.getNetwork();

		if (chainId !== 5) {
			window.alert("Change the network to Goerli");
			throw new Error(
				"Using the wrong network, Change the network to Goerli"
			);
		}

		if (needSigner) {
			const signer = web3Provider.getSigner();
			return signer;
		}

		return web3Provider;
	}

	useEffect(() => {
		if (!isWalletConnected) {
			web3ModalRef.current = new Web3Modal({
				network: "goerli",
				providerOptions: {},
				disableInjectedProvider: false,
			});
			connectWallet();
			getTotalTokensMinted();
			getBalanceOfTokens();
			getBalanceOfContract();
			getTokensToBeClaimed();
			// withdraw();
		}
	}, [isWalletConnected, contractBalance, balanceOfToken]);

	function renderButton() {
		if (!isWalletConnected) {
			return <button onClick={connectWallet}>Connect Wallet</button>;
		}

		if (isLoading) {
			return <button rounded>Loading...</button>;
		}

		if (isWalletConnected && isOwner) {
			return <button onClick={withdraw}>Withdraw Coins</button>;
		}

		if (tokensToBeClaimed > 0) {
			return (
				<>
					<p>{tokensToBeClaimed * 10} Tokens can be claimed</p>
					<button onClick={claimTokens}>Claim Token</button>
				</>
			);
		}

		return (
			<>
				<br />
				<input
					onChange={(e) => {
						if (tokenAmount) {
							setTokenAmount(BigNumber.from(e.target.value));
						}
					}}
				></input>
				<br />
				<button onClick={() => mintToken(tokenAmount)}>
					Mint Tokens
				</button>
				<br />
				{utils.formatEther(contractBalance) !== "0.0" && (
					<button onClick={withdraw}>Withdraw Coins</button>
				)}
			</>
		);
	}

	return (
		<>
			{isWalletConnected ? (
				<div>
					<h1>You have {utils.formatEther(balanceOfToken)} Tokens</h1>
					<h2>
						Overall {utils.formatEther(tokensMinted)} of 10000 have
						been minted
					</h2>
					{utils.formatEther(contractBalance) !== "0.0" ? (
						<h2>
							contract balance:{" "}
							{utils.formatEther(contractBalance)}
						</h2>
					) : null}
					{renderButton()}
				</div>
			) : (
				<div>
					<button onClick={connectWallet}>Connect Wallet</button>
				</div>
			)}
		</>
	);
}
