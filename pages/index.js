import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { Contract, providers } from "ethers";
import { utils } from "ethers";
import { useEffect, useRef, useState } from "react";
import Web3Modal, { setLocal } from "web3modal";
import {
	DEVS_DAO_CONTRACT_ADDRESS,
	NFT_DEVS_CONTRACT_ADDRESS,
	DEVS_DAO_ABI,
	NFT_DEVS_ABI,
} from "../constants";

export default function Home() {
	const [treasuryBalance, setTreasuryBalance] = useState("0");
	const [numberOfProposals, setNumberOfProposals] = useState("0");
	const [proposals, setProposals] = useState([]);
	const [nftBalance, setNftBalance] = useState(0);
	const [fakeNftTokenId, setFakeNftTokenId] = useState("");
	const [selectTab, setSelectedTab] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isWalletConnected, setIsWalletConnected] = useState(false);
	const web3ModalRef = useRef();

	async function connectWallet() {
		try {
			await getProvidersOrSigner();
			setIsWalletConnected(true);
		} catch (error) {
			console.error(error);
		}
	}

	async function getDAOTreasuryBalance() {
		try {
			const provider = await getProvidersOrSigner();
			const balance = await provider.getBalance(
				DEVS_DAO_CONTRACT_ADDRESS
			);
			setTreasuryBalance(balance.toString());
		} catch (error) {
			console.error(erroe);
		}
	}

	async function getNumberOfDaoProposals() {
		try {
			const provider = await getProvidersOrSigner();
			const contract = getDaoContractInstance(provider);
			const daoProposals = await contract.numberOfProposals();
			setNumberOfProposals(daoProposals.toString());
		} catch (error) {
			console.error(error);
		}
	}

	async function getUserNFTBalance() {
		try {
			const signer = await getProvidersOrSigner(true);
			const nftContract = getNftDevsContractInstance(signer);
			const balance = await nftContract.balanceOf(signer.getAddress());
			setNftBalance(parseInt(balance.toString()));
		} catch (error) {
			console.error(error);
		}
	}

	async function createProposal() {
		try {
			const signer = await getProvidersOrSigner(true);
			const daoContract = getDaoContractInstance(signer);
			const txn = await daoContract.createProposal(fakeNftTokenId);
			setIsLoading(true);
			await txn.wait();
			await getNumberOfDaoProposals();
			setIsLoading(false);
		} catch (error) {
			console.error(error);
			window.alert(error.data.message);
		}
	}

	async function getProposalById() {}
	async function getAllProposals() {}
	async function voteOnProposal() {}
	async function executeProposal() {}

	async function getProvidersOrSigner(needSigner = false) {
		const provider = await web3ModalRef.current.connect();
		const web3Provider = new providers.Web3Provider(provider);

		const { chainId } = await web3Provider.getNetwork();
		if (chainId !== 5) {
			window.alert("Please Change to GOERLI network");
			throw new Error("Wrone network, please switch GOERLI network");
		}

		if (needSigner) {
			const signer = web3Provider.getSigner();
			return signer;
		}
	}

	function getDaoContractInstance(providerOrSigner) {
		return new Contract(
			DEVS_DAO_CONTRACT_ADDRESS,
			DEVS_DAO_ABI,
			providerOrSigner
		);
	}
	function getNftDevsContractInstance(providerOrSigner) {
		return new Contract(
			NFT_DEVS_CONTRACT_ADDRESS,
			NFT_DEVS_ABI,
			providerOrSigner
		);
	}

	useEffect(() => {
		if (!isWalletConnected) {
			web3ModalRef.current = new Web3Modal({
				network: "goerli",
				providerOptions: {},
				disableInjectedProvider: false,
			});

			connectWallet().then(() => {});
		}
	}, [isWalletConnected]);

	return (
		<div className={styles.container}>
			<Head>
				<title>Create Next App</title>
				<meta
					name="description"
					content="Generated by create next app"
				/>
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className={styles.main}>
				<h1>Start here</h1>
			</main>

			<footer className={styles.footer}>
				<a
					href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
					target="_blank"
					rel="noopener noreferrer"
				>
					Powered by{" "}
					<span className={styles.logo}>
						<Image
							src="/vercel.svg"
							alt="Vercel Logo"
							width={72}
							height={16}
						/>
					</span>
				</a>
			</footer>
		</div>
	);
}
