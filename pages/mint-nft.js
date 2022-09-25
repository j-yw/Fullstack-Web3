import { utils } from "ethers";
import { useState } from "react";
import { ThreeDots } from "react-loader-spinner";
import {
	DEVS_NFT_ABI,
	DEVS_NFT_CONTRACT_ADDRESS,
	WHITELIST_CONTRACT_ADDRESS,
	WHITELIST_ABI,
} from "../constants";

import {
	useSigner,
	useAccount,
	usePrepareContractWrite,
	useContractWrite,
	useWaitForTransaction,
	useContractRead,
} from "wagmi";

export default function MintNftPage() {
	const { address: connectedWalletAddress, isConnected: isWalletConnected } =
		useAccount();
	const { data: signer } = useSigner();

	const [isOwner, setIsOwner] = useState(false);
	const [isPresaleEnded, setIsPresaleEnded] = useState(false);

	// Contract Write prepare configs
	const { config: presaleConfig } = usePrepareContractWrite({
		addressOrName: DEVS_NFT_CONTRACT_ADDRESS,
		contractInterface: DEVS_NFT_ABI,
		signerOrProvider: signer,
		functionName: "presaleMint",
		args: [{ value: utils.parseEther("0.01") }],
	});

	const { config: publicMintConfig } = usePrepareContractWrite({
		addressOrName: DEVS_NFT_CONTRACT_ADDRESS,
		contractInterface: DEVS_NFT_ABI,
		signerOrProvider: signer,
		functionName: "mint",
		args: [{ value: utils.parseEther("0.02") }],
	});

	const { config: startPresaleConfig } = usePrepareContractWrite({
		addressOrName: DEVS_NFT_CONTRACT_ADDRESS,
		contractInterface: DEVS_NFT_ABI,
		signerOrProvider: signer,
		functionName: "startPresale",
	});

	//Contract Write Functions
	const { data: presaleMintData, write: presaleMint } =
		useContractWrite(presaleConfig);

	const { isError: isPresaleError, isLoading: isPresaleMintLoading } =
		useWaitForTransaction({
			hash: presaleMintData?.hash,
			wait: presaleMintData?.wait,
		});

	const { data: publicMintData, write: publicMint } =
		useContractWrite(publicMintConfig);

	const { isError: isPublicMintError, isLoading: isPublicMintLoading } =
		useWaitForTransaction({
			hash: publicMintData?.hash,
			wait: publicMintData?.wait,
		});

	const { data: startPresaleData, write: startPresale } =
		useContractWrite(startPresaleConfig);

	const { isError: isStartPresaleError, isLoading: isStartPresaleLoading } =
		useWaitForTransaction({
			hash: startPresaleData?.hash,
			wait: startPresaleData?.wait,
		});

	// prepare config will cause contract write to be undefined when switching wallets in metamask
	const { config: whitelistContractConfig } = usePrepareContractWrite({
		addressOrName: WHITELIST_CONTRACT_ADDRESS,
		contractInterface: WHITELIST_ABI,
		signerOrProvider: signer,
		functionName: "addAddresssToWhitelist",
		enabled: false,
	});

	const { data: whitelistData, write: addToWhitelist } = useContractWrite({
		addressOrName: WHITELIST_CONTRACT_ADDRESS,
		contractInterface: WHITELIST_ABI,
		signerOrProvider: signer,
		functionName: "addAddresssToWhitelist",
		enabled: false,
	});

	const {
		isLoading: isJoiningWhitelist,
		isSuccess: isJoiningWhitelistSuccess,
	} = useWaitForTransaction({
		hash: whitelistData?.hash,
		wait: whitelistData?.wait,
	});

	//Contract Read Functions
	const { data: numberOfWhitelistedAddresses } = useContractRead({
		addressOrName: WHITELIST_CONTRACT_ADDRESS,
		contractInterface: WHITELIST_ABI,
		functionName: "numAddressesWhitelisted",
		enabled: connectedWalletAddress || isJoiningWhitelistSuccess,
		cacheTime: 2_000,
	});

	const { data: isAddressWhitelisted, isLoading: isWhitelistedLoading } =
		useContractRead({
			addressOrName: WHITELIST_CONTRACT_ADDRESS,
			contractInterface: WHITELIST_ABI,
			functionName: "whitelistedAddresses",
			args: [connectedWalletAddress],
			enabled: connectedWalletAddress,
			cacheTime: 2_000,
			onSuccess(data) {
				console.log("isWhitelisted", data);
			},
		});

	const { data: isPresaleStarted } = useContractRead({
		addressOrName: DEVS_NFT_CONTRACT_ADDRESS,
		contractInterface: DEVS_NFT_ABI,
		functionName: "presaleStarted",
	});

	const { data } = useContractRead({
		addressOrName: DEVS_NFT_CONTRACT_ADDRESS,
		contractInterface: DEVS_NFT_ABI,
		functionName: "presaleEnded",
		enabled: isPresaleStarted,
		onSuccess(data) {
			const presaleEnded = data.lt(Math.floor(Date.now() / 1000));
			setIsPresaleEnded(presaleEnded);
		},
	});

	const { data: contractOwner } = useContractRead({
		addressOrName: DEVS_NFT_CONTRACT_ADDRESS,
		contractInterface: DEVS_NFT_ABI,
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

	const { data: numberOfTokensMinted } = useContractRead({
		addressOrName: DEVS_NFT_CONTRACT_ADDRESS,
		contractInterface: DEVS_NFT_ABI,
		functionName: "tokenIds",
		watch: true,
	});

	function renderButton() {
		if (
			isPresaleMintLoading ||
			isPublicMintLoading ||
			isStartPresaleLoading
		) {
			return (
				<button
					style={{
						minWidth: "240px",
						height: "48px",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<ThreeDots
						height="18"
						width="18"
						radius="9"
						color="#e5e5e5"
						ariaLabel="three-dots-loading"
						wrapperClassName=""
						visible={true}
					/>
				</button>
			);
		}

		if (!isAddressWhitelisted) {
			return (
				<button
					style={{
						minWidth: "240px",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
					}}
					disabled={isAddressWhitelisted}
					onClick={() => addToWhitelist([])}
				>
					{isJoiningWhitelist || isWhitelistedLoading ? (
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
						"Join Whitelist"
					)}
				</button>
			);
		}
		if (isOwner && !isPresaleStarted) {
			return (
				<button onClick={startPresale} style={{ minWidth: "240px" }}>
					Start Presale
				</button>
			);
		}

		if (!isPresaleStarted) {
			return (
				<button style={{ minWidth: "240px" }}>Presale Started</button>
			);
		}

		if (isPresaleStarted && !isPresaleEnded) {
			return (
				<>
					<button
						style={{ minWidth: "240px" }}
						onClick={() => presaleMint()}
					>
						Presale Mint
					</button>
				</>
			);
		}

		if (isPresaleStarted && isPresaleEnded) {
			return (
				<button
					style={{ minWidth: "240px" }}
					onClick={() => publicMint()}
				>
					Public Mint
				</button>
			);
		}
	}

	if (!isWalletConnected) {
		return <h1>Please Connect Your Wallet</h1>;
	}

	return (
		<>
			<h1>Welcome! Get your NFTs now</h1>
			<h1>
				Whitelisted Accounts:{" "}
				<strong>{numberOfWhitelistedAddresses}</strong>
			</h1>
			<h1>{numberOfTokensMinted?.toString()} of 20 have been minted</h1>
			<br />
			<hr />
			<h2>
				{!isAddressWhitelisted
					? "Join the whitelist, we are in presale"
					: isPresaleStarted && !isPresaleEnded
					? "Your are whitelisted, join presale now"
					: "Mint your NFT Now"}
			</h2>
			<br />
			{renderButton()}
		</>
	);
}
