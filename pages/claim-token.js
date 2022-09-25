import { BigNumber, utils } from "ethers";
import { useState } from "react";
import { ThreeDots } from "react-loader-spinner";
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
	const [tokenAmount, setTokenAmount] = useState(zero);
	const [isOwner, setIsOwner] = useState(false);
	const [isTokenClaimLoading, setIsTokenClaimLoading] = useState(false);

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

	const { data: contractBalance } = useContractRead({
		addressOrName: DEVS_TOKEN_CONTRACT_ADDRESS,
		contractInterface: DEVS_TOKEN_ABI,
		functionName: "getContractBalance",
	});

	const { data: tokenBalance, isSuccess: isTokenBalanceSuccess } =
		useContractRead({
			addressOrName: DEVS_TOKEN_CONTRACT_ADDRESS,
			contractInterface: DEVS_TOKEN_ABI,
			functionName: "balanceOf",
			args: [connectedWalletAddress],
		});

	const { data: totalSupply, isSuccess: isTokenTotalSupplySuccess } =
		useContractRead({
			addressOrName: DEVS_TOKEN_CONTRACT_ADDRESS,
			contractInterface: DEVS_TOKEN_ABI,
			functionName: "totalSupply",
		});

	const { data: contractOwner, isLoading: isOwnerLoading } = useContractRead({
		addressOrName: DEVS_TOKEN_CONTRACT_ADDRESS,
		contractInterface: DEVS_TOKEN_ABI,
		functionName: "owner",
		async onSuccess(contractOwner) {
			if (
				connectedWalletAddress.toLowerCase() ===
				contractOwner.toLowerCase()
			) {
				setIsOwner(true);
			}
		},
	});

	const { data: nftBalance, isSuccess: isNftBalanceSuccess } =
		useContractRead({
			addressOrName: DEVS_NFT_CONTRACT_ADDRESS,
			contractInterface: DEVS_NFT_ABI,
			functionName: "balanceOf",
			args: [connectedWalletAddress],
		});

	async function getTokensToBeClaimed() {
		try {
			if (isNftBalanceSuccess) {
				const balance = nftBalance;
				setIsTokenClaimLoading(true);

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

					setTokensToBeClaimed(BigNumber.from(amount));
					setIsTokenClaimLoading(false);
				}
			} else {
				throw Error("NFT balance not available");
			}
		} catch (error) {
			console.error(error);
			setTokensToBeClaimed(zero);
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
		} catch (error) {
			console.error(error);
		}
	}

	async function withdraw() {
		try {
			const tx = await tokenContract.withdraw();
			setIsLoading(true);
			await tx.wait();
			setIsLoading(false);
		} catch (error) {
			console.error(error);
		}
	}

	if (!isWalletConnected) {
		return <h1>Please Connect Your Wallet</h1>;
	}

	return (
		<>
			<h1>NFT balance: {tokensToBeClaimed.toString()}</h1>

			<h1>
				Token balance:{" "}
				{isTokenBalanceSuccess && utils.formatEther(tokenBalance)}
			</h1>

			<h1>
				{utils.formatEther(tokenBalance)} of{" "}
				{utils.formatEther(totalSupply)} have been minted
			</h1>

			<button
				onClick={getTokensToBeClaimed}
				style={{
					minWidth: "240px",
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				{isTokenClaimLoading ? (
					<ThreeDots
						height="18"
						width="18"
						radius="9"
						color="#e5e5e5"
						ariaLabel="three-dots-loading"
						wrapperClassName=""
						visible={true}
					/>
				) : (
					"Check Eligibility"
				)}
			</button>

			{tokensToBeClaimed > 0 && !isTokenClaimLoading && (
				<button style={{ minWidth: "240px" }} onClick={claimTokens}>
					Claim {tokensToBeClaimed * 10} Token
				</button>
			)}

			<h1>You can also mint tokens by spending ETH</h1>

			<input
				style={{ minWidth: "220px" }}
				placeholder="number of tokens to mint"
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

			{isOwnerLoading ? (
				<ThreeDots
					height="72"
					width="72"
					radius="9"
					color="#e5e5e5"
					ariaLabel="three-dots-loading"
					wrapperClassName=""
					visible={true}
				/>
			) : (
				<>
					<h1>Your are the owner of the contract</h1>
					<button style={{ minWidth: "240px" }} onClick={withdraw}>
						Withdraw {utils.formatEther(contractBalance)} Coins
					</button>
				</>
			)}
		</>
	);
}
