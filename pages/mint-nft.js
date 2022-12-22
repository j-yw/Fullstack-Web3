import { utils } from "ethers";
import { useState } from "react";
import { ThreeDots } from "react-loader-spinner";
import { DEVS_NFT_ABI, DEVS_NFT_CONTRACT_ADDRESS } from "../constants";

import {
	useAccount,
	usePrepareContractWrite,
	useContractWrite,
	useWaitForTransaction,
	useContractRead,
} from "wagmi";

export default function MintNftPage() {
	const { address: connectedWalletAddress, isConnected: isWalletConnected } =
		useAccount();

	const [isOwner, setIsOwner] = useState(false);
	const [isPresaleEnded, setIsPresaleEnded] = useState(false);

	// Contract Write prepare configs
	const { config: presaleConfig } = usePrepareContractWrite({
		address: DEVS_NFT_CONTRACT_ADDRESS,
		abi: DEVS_NFT_ABI,
		functionName: "presaleMint",
		args: [{ value: utils.parseEther("0.01") }],
	});

	const { config: publicMintConfig } = usePrepareContractWrite({
		address: DEVS_NFT_CONTRACT_ADDRESS,
		abi: DEVS_NFT_ABI,
		functionName: "mint",
		args: [{ value: utils.parseEther("0.02") }],
	});

	const { config: startPresaleConfig } = usePrepareContractWrite({
		address: DEVS_NFT_CONTRACT_ADDRESS,
		abi: DEVS_NFT_ABI,
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

	//Contract Read Functions
	const { data: isPresaleStarted } = useContractRead({
		address: DEVS_NFT_CONTRACT_ADDRESS,
		abi: DEVS_NFT_ABI,
		functionName: "presaleStarted",
	});

	const { data } = useContractRead({
		address: DEVS_NFT_CONTRACT_ADDRESS,
		abi: DEVS_NFT_ABI,
		functionName: "presaleEnded",
		enabled: isPresaleStarted,
		onSuccess(data) {
			const presaleEnded = data.lt(Math.floor(Date.now() / 1000));
			setIsPresaleEnded(presaleEnded);
		},
	});

	const { data: contractOwner } = useContractRead({
		address: DEVS_NFT_CONTRACT_ADDRESS,
		abi: DEVS_NFT_ABI,
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
		address: DEVS_NFT_CONTRACT_ADDRESS,
		abi: DEVS_NFT_ABI,
		functionName: "tokenIds",
		watch: true,
	});

	const { data: totalSupply } = useContractRead({
		address: DEVS_NFT_CONTRACT_ADDRESS,
		abi: DEVS_NFT_ABI,
		functionName: "maxTokenIds",
	});

	//Render Markup
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
			{/* <h1>
				Whitelisted Accounts:{" "}
				<strong>{numberOfWhitelistedAddresses}</strong>
			</h1> */}
			<h1>
				{numberOfTokensMinted?.toString()} of {totalSupply?.toString()}{" "}
				have been minted
			</h1>
			<br />
			<hr />
			<h2>
				{isPresaleStarted && !isPresaleEnded
					? "Your are whitelisted, join presale now"
					: "Mint your NFT Now"}
			</h2>
			{renderButton()}
		</>
	);
}
