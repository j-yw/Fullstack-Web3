import { utils } from "ethers";
import { useEffect, useState } from "react";
import { DEVS_NFT_ABI, DEVS_NFT_CONTRACT_ADDRESS } from "../constants";

import {
	useSigner,
	useAccount,
	usePrepareContractWrite,
	useContractWrite,
	useWaitForTransaction,
	useContractRead,
	useContract,
} from "wagmi";

export default function Home() {
	const [isPresaleStarted, setIsPresaleStarted] = useState(false);
	const [isPresaleEnded, setIsPresaleEnded] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isOwner, setIsOwner] = useState(false);
	const [isTokenIdsMinted, setIsTokenIdsMinted] = useState("0");

	const { data: signer } = useSigner();

	const {
		address,
		isConnected: isWalletConnected,
		isDisconnected: isWalletDisconnected,
	} = useAccount();

	const nftContract = useContract({
		addressOrName: DEVS_NFT_CONTRACT_ADDRESS,
		contractInterface: DEVS_NFT_ABI,
		signerOrProvider: signer,
	});

	const { config: nftContractConfig } = usePrepareContractWrite({
		addressOrName: DEVS_NFT_CONTRACT_ADDRESS,
		contractInterface: DEVS_NFT_ABI,
		signerOrProvider: signer,
		functionName: "presaleMint",
		args: [{ value: utils.parseEther("0.01") }],
		onSuccess(data) {
			console.log(
				`🍀 \n | 🍄 file: mint-nft.js \n | 🍄 line 44 \n | 🍄 onSuccess \n | 🍄 data`,
				data
			);
		},
	});

	const { data: presaleMintData, write: presaleMint } =
		useContractWrite(nftContractConfig);

	console.log(
		`🍀 \n | 🍄 file: mint-nft.js \n | 🍄 line 51 \n | 🍄 Home \n | 🍄 presaleMint`,
		presaleMint
	);

	const { isError, isLoading: isPresaleMintLoading } = useWaitForTransaction({
		hash: presaleMintData?.hash,
		wait: presaleMintData?.wait,
	});

	async function publicMint() {
		try {
			const tx = await nftContract.mint({
				value: utils.parseEther("0.02"),
			});

			setIsLoading(true);
			await tx.wait();
			setIsLoading(false);

			window.alert("NFT Minted");
		} catch (error) {
			console.error(error);
		}
	}

	async function startPresale() {
		try {
			const tx = await nftContract.startPresale();

			setIsLoading(true);

			await tx.wait();

			setIsLoading(false);

			await checkIfPresaleStarted();
		} catch (error) {
			console.error(error);
		}
	}

	async function checkIfPresaleStarted() {
		try {
			const _presaleStarted = await nftContract.presaleStarted();

			if (!_presaleStarted) {
				await getOwner();
			}

			setIsPresaleStarted(_presaleStarted);

			return _presaleStarted;
		} catch (error) {
			console.error(error);
			return false;
		}
	}

	async function checkIfPresaleEnded() {
		try {
			const _presaleEnded = await nftContract.presaleEnded();
			const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));

			if (hasEnded) {
				setIsPresaleEnded(true);
			} else {
				setIsPresaleEnded(false);
			}

			return hasEnded;
		} catch (error) {
			console.error(error);
			return false;
		}
	}

	async function getOwner() {
		try {
			const _owner = await nftContract.owner();
			const signer = await getProviderOrSigner(true);
			const address = await signer.getAddress();
			if (address.toLowerCase() === _owner.toLowerCase()) {
				setIsOwner(true);
			}
		} catch (error) {
			console.error(error);
		}
	}

	async function getTokenIdsMinted() {
		try {
			const _tokenIds = await nftContract.tokenIds();
			setIsTokenIdsMinted(_tokenIds.toString());
		} catch (error) {
			console.error(error);
		}
	}

	useEffect(() => {
		const _presaleStarted = checkIfPresaleStarted();

		if (_presaleStarted) {
			checkIfPresaleEnded();
		}

		getTokenIdsMinted();

		// const presaleEndedInterval = setInterval(async () => {
		// 	const _presaleStarted = await checkIfPresaleStarted();
		// 	if (!_presaleStarted) {
		// 		const _presaleEnded = await checkIfPresaleEnded();
		// 		if (!_presaleEnded) {
		// 			clearInterval(presaleEndedInterval);
		// 		}
		// 	}
		// }, 5 * 1000);

		// setInterval(async () => {
		// 	await getTokenIdsMinted();
		// }, 5 * 1000);
	}, [address, isWalletConnected, signer]);

	function renderButton() {
		if (!isWalletConnected) {
			return (
				<button style={{ minWidth: "240px" }}>Connect Wallet</button>
			);
		}

		if (isPresaleMintLoading) {
			return <button style={{ minWidth: "240px" }}>Loading...</button>;
		}

		if (isOwner && !isPresaleStarted) {
			return <button style={{ minWidth: "240px" }}>Start Presale</button>;
		}

		if (!isPresaleStarted) {
			return (
				<button style={{ minWidth: "240px" }}>Presale Started</button>
			);
		}

		if (isPresaleStarted && !isPresaleEnded) {
			return (
				<>
					<h1>Your address is whitelisted for presale</h1>
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
				<button style={{ minWidth: "240px" }} onClick={publicMint}>
					Public Mint
				</button>
			);
		}
	}

	return (
		<>
			<h1>Welcome to Devs NFT</h1>
			<h2>Mint Your NFTs Now</h2>
			<h2>{isTokenIdsMinted} of 20 have been minted</h2>
			{renderButton()}
		</>
	);
}
