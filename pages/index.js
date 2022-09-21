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
import { useTheme as useNextTheme } from "next-themes";
import {
	Navbar,
	Text,
	Button,
	Link,
	Switch,
	Spacer,
	Container,
	useTheme,
} from "@nextui-org/react";

export default function Home() {
	const { setTheme } = useNextTheme();
	const { isDark, type } = useTheme();
	const [treasuryBalance, setTreasuryBalance] = useState("0");
	const [numberOfProposals, setNumberOfProposals] = useState("0");
	const [proposals, setProposals] = useState([]);
	const [nftBalance, setNftBalance] = useState(0);
	const [fakeNftTokenId, setFakeNftTokenId] = useState("");
	const [selectedTab, setSelectedTab] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isWalletConnected, setIsWalletConnected] = useState(false);
	const [currentTime, setCurrentTime] = useState("");
	const web3ModalRef = useRef();

	async function getTimeFromContract() {
		try {
			const provider = await getProviderOrSigner();
			const contract = getDaoContractInstance(provider);
			const time = await contract.getTime();
			setCurrentTime(new Date(time.toNumber() * 1000));
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

	async function getDAOTreasuryBalance() {
		try {
			const provider = await getProviderOrSigner();
			const balance = await provider.getBalance(
				DEVS_DAO_CONTRACT_ADDRESS
			);
			setTreasuryBalance(balance.toString());
		} catch (error) {
			console.error(error);
		}
	}

	async function getNumberOfDaoProposals() {
		try {
			const provider = await getProviderOrSigner();
			const contract = getDaoContractInstance(provider);
			const daoProposals = await contract.numberOfProposals();
			setNumberOfProposals(daoProposals.toString());
		} catch (error) {
			console.error(error);
		}
	}

	async function getUserNFTBalance() {
		try {
			const signer = await getProviderOrSigner(true);
			const address = await signer.getAddress();
			const nftContract = getNftDevsContractInstance(signer);
			const balance = await nftContract.balanceOf(address);
			setNftBalance(parseInt(balance.toString()));
		} catch (error) {
			console.error(error);
		}
	}

	async function createProposal() {
		try {
			const signer = await getProviderOrSigner(true);
			const daoContract = getDaoContractInstance(signer);
			const txn = await daoContract.createProposal(fakeNftTokenId);
			console.log(
				`🍀 \n | 🍄 file: index.js \n | 🍄 line 75 \n | 🍄 createProposal \n | 🍄 txn`,
				txn
			);
			console.log(
				`🍀 \n | 🍄 file: index.js \n | 🍄 line 75 \n | 🍄 createProposal \n | 🍄 fakeNftTokenId`,
				fakeNftTokenId
			);
			setIsLoading(true);
			await txn.wait();
			await getNumberOfDaoProposals();
			setIsLoading(false);
		} catch (error) {
			console.error(error);
			window.alert(error.data.message);
		}
	}

	async function getProposalById(id) {
		try {
			const provider = await getProviderOrSigner();
			const daoContract = getDaoContractInstance(provider);
			const proposal = await daoContract.proposals(id);
			const parsedProposal = {
				proposalId: id,
				nftTokenId: proposal.nftTokenId.toString(),
				deadline: new Date(
					parseInt(proposal.deadline.toString()) * 1000
				),
				yayVotes: proposal.yayVotes.toString(),
				nayVotes: proposal.nayVotes.toString(),
				executed: proposal.executed,
			};
			return parsedProposal;
		} catch (error) {
			console.error(error);
		}
	}
	async function getAllProposals() {
		try {
			const proposals = [];
			for (let i = 0; i < numberOfProposals; i++) {
				const proposal = await getProposalById(i);
				proposals.push(proposal);
			}
			console.log(
				`🍀 \n | 🍄 file: index.js \n | 🍄 line 106 \n | 🍄 getAllProposals \n | 🍄 proposals`,
				proposals
			);
			setProposals(proposals);
			return proposals;
		} catch (error) {
			console.error(error);
		}
	}
	async function voteOnProposal(proposalId, _vote) {
		try {
			const signer = await getProviderOrSigner(true);
			const daoContract = getDaoContractInstance(signer);
			let vote = _vote === "YAY" ? 0 : 1;
			const txn = await daoContract.voteOnProposal(proposalId, vote);
			setIsLoading(true);
			await txn.wait();
			setIsLoading(false);
			await getAllProposals();
		} catch (error) {
			console.error(error);
			window.alert(error.data.message);
		}
	}

	async function executeProposal(proposalId) {
		try {
			const signer = await getProviderOrSigner(true);
			const daoContract = getDaoContractInstance(signer);
			const txn = await daoContract.executeProposal(proposalId);
			setIsLoading(true);
			await txn.wait();
			setIsLoading(false);
			await getAllProposals();
		} catch (error) {
			console.error(error);
			console.log(
				`🍀 \n | 🍄 file: index.js \n | 🍄 line 147 \n | 🍄 executeProposal \n | 🍄 error`,
				error
			);
			window.alert(error);
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

			connectWallet().then(() => {
				getAllProposals();
				getDAOTreasuryBalance();
				getUserNFTBalance();
				getNumberOfDaoProposals();
				getTimeFromContract();
			});
		}
	}, [isWalletConnected]);

	useEffect(() => {
		if (selectedTab === "View Proposals") {
			console.log("yay");
			getAllProposals();
		}
	}, [selectedTab]);

	function renderTabs() {
		if (selectedTab === "Create Proposal") {
			return renderCreateProposalTab();
		} else if (selectedTab === "View Proposals") {
			return renderViewProposalsTab();
		}
		return null;
	}

	function renderCreateProposalTab() {
		if (isLoading) {
			return (
				<>
					<div> loading, waiting for transaction</div>
				</>
			);
		} else if (nftBalance === 0) {
			return (
				<>
					<div>You do not own any NFTs</div>
					<div>So you cannot create proposal or vote</div>
				</>
			);
		} else {
			return (
				<>
					<div>
						<label>Fake NFT Token ID to Purchase: </label>
						<input
							placeholder="0"
							type="number"
							onChange={(e) => setFakeNftTokenId(e.target.value)}
						/>
						<button onClick={createProposal}>Create</button>
					</div>
				</>
			);
		}
	}

	function renderViewProposalsTab() {
		if (isLoading) {
			return (
				<div className={styles.description}>
					Loading... Waiting for transaction...
				</div>
			);
		} else if (proposals.length === 0) {
			return (
				<div className={styles.description}>
					No proposals have been created
				</div>
			);
		} else {
			return (
				<div>
					{proposals.map((p, index) => (
						<div key={index} className={styles.proposalCard}>
							<p>Proposal ID: {p.proposalId}</p>
							<p>Fake NFT to Purchase: {p.nftTokenId}</p>
							<p>Deadline: {p.deadline.toString()}</p>
							<p>Yay Votes: {p.yayVotes}</p>
							<p>Nay Votes: {p.nayVotes}</p>
							<p>Executed?: {p.executed.toString()}</p>
							{p.deadline.getTime() > Date.now() &&
							!p.executed ? (
								<div className={styles.flex}>
									<button
										className={styles.button2}
										onClick={() =>
											voteOnProposal(p.proposalId, "YAY")
										}
									>
										Vote YAY
									</button>
									<button
										className={styles.button2}
										onClick={() =>
											voteOnProposal(p.proposalId, "NAY")
										}
									>
										Vote NAY
									</button>
								</div>
							) : p.deadline.getTime() < Date.now() &&
							  !p.executed ? (
								<div className={styles.flex}>
									<button
										className={styles.button2}
										onClick={() =>
											executeProposal(p.proposalId)
										}
									>
										Execute Proposal{" "}
										{p.yayVotes > p.nayVotes
											? "(YAY)"
											: "(NAY)"}
									</button>
								</div>
							) : (
								<div className={styles.description}>
									Proposal Executed
								</div>
							)}
						</div>
					))}
				</div>
			);
		}
	}

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
			<Navbar isBordered variant="floating">
				<Navbar.Brand>
					<Text b color="inherit" hideIn="xs">
						ACME
					</Text>
				</Navbar.Brand>
				<Navbar.Content hideIn="xs">
					<Navbar.Link href="#">Whitelist</Navbar.Link>
					<Navbar.Link href="#">Mint NFT</Navbar.Link>
					<Navbar.Link href="#">Claim Token</Navbar.Link>
					<Navbar.Link isActive href="#">
						Vote
					</Navbar.Link>
				</Navbar.Content>
				<Navbar.Content>
					<Navbar.Link color="inherit" href="#">
						Login
					</Navbar.Link>
					<Navbar.Item>
						<Button auto flat as={Link} href="#">
							Sign Up
						</Button>
					</Navbar.Item>
					<Switch
						checked={isDark}
						onChange={(e) =>
							setTheme(e.target.checked ? "dark" : "light")
						}
					/>
				</Navbar.Content>
			</Navbar>

			<main className={styles.main}>
				<h1>Welcome to DEVS DAO</h1>
				<div>
					Your NFT balance is {nftBalance}
					<br />
					Total number of proposals: {numberOfProposals}
				</div>
				<div>
					<button onClick={() => setSelectedTab("Create Proposal")}>
						Create Proposal
					</button>
				</div>
				<div>
					<button onClick={() => setSelectedTab("View Proposals")}>
						View Proposal
					</button>
				</div>
				{renderTabs()}
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
