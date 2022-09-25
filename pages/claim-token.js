import { BigNumber, Contract, providers, utils } from "ethers";
import { useEffect, useRef, useState } from "react";
import {
	DEVS_TOKEN_CONTRACT_ADDRESS,
	DEVS_TOKEN_ABI,
	DEVS_NFT_CONTRACT_ADDRESS,
	DEVS_NFT_ABI,
} from "../constants";

import {
	useSigner,
	useAccount,
	usePrepareContractWrite,
	useContractWrite,
	useContractRead,
	useProvider,
	useContract,
} from "wagmi";

export default function Home() {
	const {
		address: connectedWalletAddress,
		isConnected: isWalletConnected,
		isDisconnected: isWalletDisconnected,
	} = useAccount();

	const { data: signer } = useSigner();
	const provider = useProvider();
	const zero = BigNumber.from(0);

	const [isLoading, setIsLoading] = useState(false);
	const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
	const [balanceOfToken, setBalancesOfToken] = useState(zero);
	const [tokenAmount, setTokenAmount] = useState(zero);
	const [tokensMinted, setTokensMinted] = useState(zero);
	const [isOwner, setIsOwner] = useState(false);
	const [contractBalance, setContractBalance] = useState(zero);

	const nftContract = useContract({
		addressOrName: DEVS_NFT_CONTRACT_ADDRESS,
		contractInterface: DEVS_NFT_ABI,
		signerOrProvider: provider,
	});

	const tokenContract = useContract({
		addressOrName: DEVS_TOKEN_CONTRACT_ADDRESS,
		contractInterface: DEVS_TOKEN_ABI,
		signerOrProvider: signer,
	});

	async function getTokensToBeClaimed() {
		try {
			const balance = await nftContract.balanceOf(connectedWalletAddress);

			if (balance.toNumber() === 0) {
				setTokensToBeClaimed(zero);
			} else {
				var amount = 0;
				for (let i = 0; i < balance.toNumber(); i++) {
					const tokenId = await nftContract.tokenOfOwnerByIndex(
						connectedWalletAddress,
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
			const balance = await tokenContract.getContractBalance();
			setContractBalance(balance);
		} catch (error) {
			console.error(error);
			setContractBalance(zero);
		}
	}

	async function getBalanceOfTokens() {
		try {
			const balance = await tokenContract.balanceOf(
				connectedWalletAddress
			);
			setBalancesOfToken(balance);
		} catch (error) {
			console.error(error);
			setBalancesOfToken(zero);
		}
	}

	async function mintToken(amount) {
		try {
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
			const _tokensMinted = await tokenContract.totalSupply();
			setTokensMinted(_tokensMinted);
		} catch (error) {
			console.error(error);
		}
	}

	async function getOwner() {
		try {
			const _owner = await tokenContract.owner();
			if (connectedWalletAddress.toLowerCase() === _owner.toLowerCase()) {
				setIsOwner(true);
			}
		} catch (error) {
			console.error(error.message);
		}
	}

	async function withdraw() {
		try {
			const tx = await tokenContract.withdraw();
			setIsLoading(true);
			await tx.wait();
			setIsLoading(false);
			await getOwner();
		} catch (error) {
			console.error(error);
		}
	}

	// useEffect(() => {
	// 	getTotalTokensMinted();
	// 	getBalanceOfTokens();
	// 	getBalanceOfContract();
	// 	getTokensToBeClaimed();
	// 	// withdraw();
	// }, [isWalletConnected, contractBalance, balanceOfToken]);

	function renderButton() {
		if (isLoading) {
			return <button style={{ minWidth: "240px" }}>loading...</button>;
		}

		if (isWalletConnected && isOwner) {
			return (
				<button style={{ minWidth: "240px" }} onClick={withdraw}>
					Withdraw Coins
				</button>
			);
		}

		if (tokensToBeClaimed > 0) {
			return (
				<>
					<h1>{tokensToBeClaimed * 10} Tokens can be claimed</h1>
					<button style={{ minWidth: "240px" }} onClick={claimTokens}>
						Claim Token
					</button>
				</>
			);
		}

		return (
			<>
				<input
					style={{ minWidth: "220px" }}
					onChange={(e) => {
						if (tokenAmount) {
							setTokenAmount(BigNumber.from(e.target.value));
						}
					}}
				></input>
				<button
					style={{ minWidth: "240px" }}
					onClick={() => mintToken(tokenAmount)}
				>
					Mint Tokens
				</button>
				{utils.formatEther(contractBalance) !== "0.0" ? (
					<button style={{ minWidth: "240px" }} onClick={withdraw}>
						Withdraw Coins
					</button>
				) : null}
			</>
		);
	}

	if (!isWalletConnected) {
		return <h1>Please Connect Your Wallet</h1>;
	}

	return (
		<>
			{isWalletConnected ? (
				<>
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
				</>
			) : (
				<></>
			)}
		</>
	);
}
