import styles from "../styles/Home.module.css";
import { Contract, providers } from "ethers";
import { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import {
	DEVS_DAO_CONTRACT_ADDRESS,
	NFT_DEVS_CONTRACT_ADDRESS,
	DEVS_DAO_ABI,
	NFT_DEVS_ABI,
} from "../constants";
import { Text, Button, Spacer } from "@nextui-org/react";

export default function Home() {
	const [treasuryBalance, setTreasuryBalance] = useState("0");
	const [numberOfProposals, setNumberOfProposals] = useState("0");
	const [proposals, setProposals] = useState([]);
	const [nftBalance, setNftBalance] = useState(0);
	const [fakeNftTokenId, setFakeNftTokenId] = useState("");
	const [selectedTab, setSelectedTab] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isWalletConnected, setIsWalletConnected] = useState(false);
	const web3ModalRef = useRef();

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
			});
		}
	}, [isWalletConnected]);

	useEffect(() => {
		if (selectedTab === "View Proposals") {
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
		<>
			<Text
				size={72}
				weight="bold"
				css={{
					textGradient: "45deg, $blue600 -20%, $pink600 50%",
				}}
			>
				Welcome to DEVS DAO
			</Text>
			<Text
				size={48}
				weight="bold"
				css={{
					textGradient: "45deg, $yellow600 -20%, $pink600 50%",
				}}
			>
				Your NFT balance is {nftBalance}
			</Text>
			<Text
				size={48}
				weight="bold"
				css={{
					textGradient: "45deg, $yellow600 -20%, $pink600 50%",
				}}
			>
				Total number of proposals: {numberOfProposals}
			</Text>
			<Button
				onClick={() => setSelectedTab("Create Proposal")}
				flat
				auto
				rounded
				color="gradient"
				size="xl"
				css={{ minWidth: "368px" }}
			>
				<Text
					css={{ color: "inherit" }}
					size={16}
					weight="bold"
					transform="uppercase"
				>
					Notify Me Connect your wallet
				</Text>
			</Button>
			<Spacer />
			<Button
				flat
				auto
				rounded
				color="gradient"
				size="xl"
				css={{ minWidth: "368px" }}
				onClick={() => setSelectedTab("View Proposals")}
			>
				View Proposal
			</Button>
			{renderTabs()}
		</>
	);
}
