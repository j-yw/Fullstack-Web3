import { utils } from "ethers";
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
	useWaitForTransaction,
	useContractWrite,
	useContractRead,
	useProvider,
	useContract,
} from "wagmi";

export default function ClaimTokenPage() {
	const { address: connectedWalletAddress, isConnected: isWalletConnected } =
		useAccount();

	const { data: signer } = useSigner();
	const provider = useProvider();

	const [tokensToBeClaimed, setTokensToBeClaimed] = useState(0);
	const [tokenAmount, setTokenAmount] = useState(0);
	const [isOwner, setIsOwner] = useState(false);
	const [isTokenClaimLoading, setIsTokenClaimLoading] = useState(false);

	//TODO: Refactor
	async function getTokensToBeClaimed() {
		try {
			if (isNftBalanceSuccess) {
				const balance = nftBalance;
				setIsTokenClaimLoading(true);

				if (balance.toNumber() === 0) {
					setTokensToBeClaimed(0);
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

					setTokensToBeClaimed(amount);
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
		watch: true,
	});

	const { data: tokenBalance, isSuccess: isTokenBalanceSuccess } =
		useContractRead({
			addressOrName: DEVS_TOKEN_CONTRACT_ADDRESS,
			contractInterface: DEVS_TOKEN_ABI,
			functionName: "balanceOf",
			args: [connectedWalletAddress],
			watch: true,
		});

	const { data: totalSupply, isSuccess: isTokenTotalSupplySuccess } =
		useContractRead({
			addressOrName: DEVS_TOKEN_CONTRACT_ADDRESS,
			contractInterface: DEVS_TOKEN_ABI,
			functionName: "totalSupply",
			watch: true,
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

	const { data: mintData, write: mintToken } = useContractWrite({
		addressOrName: DEVS_TOKEN_CONTRACT_ADDRESS,
		contractInterface: DEVS_TOKEN_ABI,
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

	const { isError: isMintError, isLoading: isMinting } =
		useWaitForTransaction({
			hash: mintData?.hash,
			wait: mintData?.wait,
		});

	const { data: claimData, write: claimTokens } = useContractWrite({
		addressOrName: DEVS_TOKEN_CONTRACT_ADDRESS,
		contractInterface: DEVS_TOKEN_ABI,
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

	if (!isWalletConnected) {
		return <h1>Please Connect Your Wallet</h1>;
	}

	return (
		<>
			<h1>
				Token balance:{" "}
				{isTokenBalanceSuccess &&
					utils.formatEther(tokenBalance.toString())}
			</h1>

			<h1>
				{utils.formatEther(tokenBalance.toString())} of{" "}
				{utils.formatEther(totalSupply.toString())} have been minted
			</h1>

			<br />
			<hr />

			<h2>{tokensToBeClaimed.toString()} NFT Available for claiming</h2>
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
					setTokenAmount(e.target.value);
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
							Withdraw ${utils.formatEther(contractBalance.toString())} Coins
							`
						)}
					</button>
				</>
			)}
		</>
	);
}
