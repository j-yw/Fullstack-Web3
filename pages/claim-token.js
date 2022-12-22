import { BigNumber, Signer, utils } from "ethers";
import { useState } from "react";
import { ThreeDots } from "react-loader-spinner";
import {
	DEVS_TOKEN_CONTRACT_ADDRESS,
	DEVS_TOKEN_ABI,
	DEVS_NFT_CONTRACT_ADDRESS,
	DEVS_NFT_ABI,
} from "../constants";

import {
	useAccount,
	usePrepareContractWrite,
	useWaitForTransaction,
	useContractWrite,
	useContractRead,
	useContract,
	useSigner,
} from "wagmi";

export default function ClaimTokenPage() {
	const { address: connectedWalletAddress, isConnected: isWalletConnected } =
		useAccount();

	const { data: signer } = useSigner();

	const zero = BigNumber.from(0);

	const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
	const [tokenAmount, setTokenAmount] = useState(zero);
	const [isOwner, setIsOwner] = useState(false);
	const [isTokenClaimLoading, setIsTokenClaimLoading] = useState(false);

	const nftContract = useContract({
		address: DEVS_NFT_CONTRACT_ADDRESS,
		abi: DEVS_NFT_ABI,
		signerOrProvider: signer,
	});

	const tokenContract = useContract({
		address: DEVS_TOKEN_CONTRACT_ADDRESS,
		abi: DEVS_TOKEN_ABI,
		signerOrProvider: signer,
	});

	const { data: contractBalance } = useContractRead({
		address: DEVS_TOKEN_CONTRACT_ADDRESS,
		abi: DEVS_TOKEN_ABI,
		functionName: "getContractBalance",
		watch: true,
	});

	const { data: tokenBalance, isSuccess: isTokenBalanceSuccess } =
		useContractRead({
			address: DEVS_TOKEN_CONTRACT_ADDRESS,
			abi: DEVS_TOKEN_ABI,
			functionName: "balanceOf",
			args: [connectedWalletAddress],
			watch: true,
		});

	const { data: totalSupply, isSuccess: isTokenTotalSupplySuccess } =
		useContractRead({
			address: DEVS_TOKEN_CONTRACT_ADDRESS,
			abi: DEVS_TOKEN_ABI,
			functionName: "totalSupply",
			watch: true,
		});

	const { data: contractOwner, isLoading: isOwnerLoading } = useContractRead({
		address: DEVS_TOKEN_CONTRACT_ADDRESS,
		abi: DEVS_TOKEN_ABI,
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
			address: DEVS_NFT_CONTRACT_ADDRESS,
			abi: DEVS_NFT_ABI,
			functionName: "balanceOf",
			args: [connectedWalletAddress],
		});

	const { config: mintDataConfig } = usePrepareContractWrite({
		address: DEVS_TOKEN_CONTRACT_ADDRESS,
		abi: DEVS_TOKEN_ABI,
		functionName: "mint",
		args: [
			tokenAmount,
			// this value object is required in the mint function by a mapping
			// It can be larger than 0.001, not smaller
			{
				value: utils.parseEther((0.001 * tokenAmount).toString()),
			},
		],
	});

	const { data: mintData, write: mintToken } =
		useContractWrite(mintDataConfig);

	const { isError: isMintError, isLoading: isMinting } =
		useWaitForTransaction({
			hash: mintData?.hash,
			wait: mintData?.wait,
		});

	const { data: claimData, write: claimTokens } = useContractWrite({
		address: DEVS_TOKEN_CONTRACT_ADDRESS,
		abi: DEVS_TOKEN_ABI,
		functionName: "claim",
	});

	const { isError: isClaimError, isLoading: isClaiming } =
		useWaitForTransaction({
			hash: claimData?.hash,
			wait: claimTokens?.wait,
		});

	const { data: withdrawData, write: withdraw } = useContractWrite({
		addressOrName: DEVS_TOKEN_CONTRACT_ADDRESS,
		contractInterface: DEVS_TOKEN_ABI,
		functionName: "withdraw",
	});

	const { isError: isWithdrawError, isLoading: isWithdrawing } =
		useWaitForTransaction({
			hash: withdrawData?.hash,
			wait: withdrawData?.wait,
		});

	//TODO: Refactor
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

	if (!isWalletConnected) {
		return <h1>Please Connect Your Wallet</h1>;
	}

	console.log(tokensToBeClaimed);

	return (
		<>
			<h1>
				Token balance:{" "}
				{isTokenBalanceSuccess && utils.formatEther(tokenBalance)}
			</h1>
			<h1>
				{tokenBalance && utils.formatEther(tokenBalance)} of{" "}
				{totalSupply && utils.formatEther(totalSupply)} have been minted
			</h1>
			<br />
			<hr />
			<h2>{tokensToBeClaimed.toString()} NFT Available for claiming</h2>

			{tokensToBeClaimed.toNumber() === 0 && (
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
			)}

			{tokensToBeClaimed > 0 && !isTokenClaimLoading && (
				<button
					style={{
						minWidth: "240px",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
					}}
					onClick={claimTokens}
				>
					{isClaiming ? (
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
						`
					Claim ${tokensToBeClaimed * 10} Token
					`
					)}
				</button>
			)}
			<br />
			<hr />
			<h2>You can also mint tokens by spending ETH</h2>
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
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minWidth: "240px",
				}}
				onClick={() => mintToken(tokenAmount)}
			>
				{isMinting ? (
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
					"Mint Tokens"
				)}
			</button>
			<br />
			<hr />
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
					{isOwner && (
						<>
							<h2>Your are the owner of the contract</h2>
							<button
								style={{
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									minWidth: "240px",
								}}
								onClick={() => withdraw([])}
							>
								{isWithdrawing ? (
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
									`
							Withdraw ${utils.formatEther(contractBalance)} Coins
							`
								)}
							</button>
						</>
					)}
				</>
			)}
		</>
	);
}
