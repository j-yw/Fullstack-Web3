import Web3Modal from "web3modal";
import { Text, Button, Spacer, Loading } from "@nextui-org/react";
import { Contract, providers, utils } from "ethers";
import { useEffect, useRef, useState } from "react";
import { DEVS_NFT_ABI, DEVS_NFT_CONTRACT_ADDRESS } from "../constants";

export default function Home() {
	const [isWalletConnected, setIsWalletConnected] = useState(false);
	const [isPresaleStarted, setIsPresaleStarted] = useState(false);
	const [isPresaleEnded, setIsPresaleEnded] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isOwner, setIsOwner] = useState(false);
	const [isTokenIdsMinted, setIsTokenIdsMinted] = useState("0");

	const web3ModalRef = useRef();

	async function presaleMint() {
		try {
			const signer = await getProviderOrSigner(true);
			const nftContract = new Contract(
				DEVS_NFT_CONTRACT_ADDRESS,
				DEVS_NFT_ABI,
				signer
			);
			const tx = await nftContract.presaleMint({
				value: utils.parseEther("0.01"),
			});

			setIsLoading(true);
			await tx.wait();
			setIsLoading(false);

			window.alert("NFT Minted!");
		} catch (error) {
			console.error(error);
		}
	}

	async function publicMint() {
		try {
			const signer = await getProviderOrSigner(true);
			const nftContract = new Contract(
				DEVS_NFT_CONTRACT_ADDRESS,
				DEVS_NFT_ABI,
				signer
			);
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

	async function connectWallet() {
		try {
			await getProviderOrSigner();
			setIsWalletConnected(true);
		} catch (error) {
			console.error(error);
		}
	}

	async function startPresale() {
		try {
			const signer = await getProviderOrSigner(true);

			const nftContract = new Contract(
				DEVS_NFT_CONTRACT_ADDRESS,
				DEVS_NFT_ABI,
				signer
			);

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
			const provider = await getProviderOrSigner();

			const nftContract = new Contract(
				DEVS_NFT_CONTRACT_ADDRESS,
				DEVS_NFT_ABI,
				provider
			);

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
			const provider = await getProviderOrSigner();

			const nftContract = new Contract(
				DEVS_NFT_CONTRACT_ADDRESS,
				DEVS_NFT_ABI,
				provider
			);

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
			const provider = await getProviderOrSigner();
			const nftContract = new Contract(
				DEVS_NFT_CONTRACT_ADDRESS,
				DEVS_NFT_ABI,
				provider
			);
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
			const provider = await getProviderOrSigner();

			const nftContract = new Contract(
				DEVS_NFT_CONTRACT_ADDRESS,
				DEVS_NFT_ABI,
				provider
			);

			const _tokenIds = await nftContract.tokenIds();

			setIsTokenIdsMinted(_tokenIds.toString());
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

			const _presaleStarted = checkIfPresaleStarted();

			if (_presaleStarted) {
				checkIfPresaleEnded();
			}

			getTokenIdsMinted();

			const presaleEndedInterval = setInterval(async () => {
				const _presaleStarted = await checkIfPresaleStarted();
				if (!_presaleStarted) {
					const _presaleEnded = await checkIfPresaleEnded();
					if (!_presaleEnded) {
						clearInterval(presaleEndedInterval);
					}
				}
			}, 5 * 1000);

			setInterval(async () => {
				await getTokenIdsMinted();
			}, 5 * 1000);
		}
	}, [isWalletConnected]);

	function renderButton() {
		if (!isWalletConnected) {
			return (
				<Button
					size="xl"
					shadow
					color="gradient"
					css={{ minWidth: "368px" }}
					onPress={connectWallet}
				>
					Connect Wallet
				</Button>
			);
		}

		if (isLoading) {
			return (
				<Button
					disabled
					size="xl"
					shadow
					color="gradient"
					css={{ minWidth: "368px" }}
				>
					<Loading type="points-opacity" color="currentColor" />
				</Button>
			);
		}

		if (isOwner && !isPresaleStarted) {
			return (
				<Button
					size="xl"
					shadow
					color="gradient"
					css={{ minWidth: "368px" }}
					onPress={startPresale}
				>
					Start Presale
				</Button>
			);
		}

		if (!isPresaleStarted) {
			return (
				<Button
					size="xl"
					shadow
					color="gradient"
					css={{ minWidth: "368px" }}
				>
					Presale Started
				</Button>
			);
		}

		if (isPresaleStarted && !isPresaleEnded) {
			return (
				<>
					<Text
						size={36}
						weight="bold"
						css={{
							textGradient:
								"45deg, $purple600 -20%, $pink600 100%",
						}}
					>
						Your address is whitelisted for presale
					</Text>
					<Spacer />
					<Button
						size="xl"
						shadow
						color="gradient"
						css={{ minWidth: "368px" }}
						onClick={presaleMint}
					>
						Presale Mint
					</Button>
				</>
			);
		}

		if (isPresaleStarted && isPresaleEnded) {
			return <Button onClick={publicMint}>Public Mint</Button>;
		}
	}

	return (
		<>
			<Text
				size={72}
				weight="bold"
				css={{
					textGradient: "45deg, $blue600 -20%, $pink600 50%",
				}}
			>
				Welcome to Devs NFT
			</Text>
			<Text
				size={48}
				weight="bold"
				css={{
					textGradient: "45deg, $yellow600 -20%, $pink600 50%",
				}}
			>
				Mint Your NFTs Now
			</Text>
			<Text
				size={48}
				weight="bold"
				css={{
					textGradient: "45deg, $purple600 -20%, $pink600 100%",
				}}
			>
				{isTokenIdsMinted} of 20 have been minted
			</Text>
			{renderButton()}
		</>
	);
}
