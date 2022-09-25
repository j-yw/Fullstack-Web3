import Web3Modal from "web3modal";
import { Contract, providers } from "ethers";
import { useEffect, useRef, useState } from "react";
import {
	DEVS_DAO_CONTRACT_ADDRESS,
	DEVS_DAO_ABI,
	DEVS_NFT_CONTRACT_ADDRESS,
	DEVS_NFT_ABI,
} from "../constants";

export default function VotePage() {
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
	//BUG: NFT price is higher than the contract balance
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
			DEVS_NFT_CONTRACT_ADDRESS,
			DEVS_NFT_ABI,
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
			return <h1> loading, waiting for transaction</h1>;
		} else if (nftBalance === 0) {
			return (
				<>
					<h2>You do not own any NFTs</h2>
					<h2>So you cannot create proposal or vote</h2>
				</>
			);
		} else {
			return (
				<>
					<div>
						<label>Fake NFT Token ID to Purchase: </label>
						<input
							style={{ minWidth: "220px" }}
							placeholder="0"
							type="number"
							onChange={(e) => setFakeNftTokenId(e.target.value)}
						/>
						<button
							style={{ minWidth: "240px" }}
							onClick={createProposal}
						>
							Create
						</button>
					</div>
				</>
			);
		}
	}

	function renderViewProposalsTab() {
		if (isLoading) {
			return <h1>Loading... Waiting for transaction...</h1>;
		} else if (proposals.length === 0) {
			return <h1>No proposals have been created</h1>;
		} else {
			return (
				<div>
					{proposals.map((p, index) => (
						<div key={index}>
							<p>Proposal ID: {p.proposalId}</p>
							<p>Fake NFT to Purchase: {p.nftTokenId}</p>
							<p>Deadline: {p.deadline.toString()}</p>
							<p>Yay Votes: {p.yayVotes}</p>
							<p>Nay Votes: {p.nayVotes}</p>
							<p>Executed?: {p.executed.toString()}</p>
							{p.deadline.getTime() > Date.now() &&
							!p.executed ? (
								<div>
									<button
										style={{ minWidth: "240px" }}
										onClick={() =>
											voteOnProposal(p.proposalId, "YAY")
										}
									>
										Vote YAY
									</button>
									<button
										style={{ minWidth: "240px" }}
										onClick={() =>
											voteOnProposal(p.proposalId, "NAY")
										}
									>
										Vote NAY
									</button>
								</div>
							) : p.deadline.getTime() < Date.now() &&
							  !p.executed ? (
								<div>
									<button
										style={{ minWidth: "240px" }}
										onClick={() =>
											executeProposal([p.proposalId])
										}
									>
										Execute Proposal{" "}
										{p.yayVotes > p.nayVotes
											? "(YAY)"
											: "(NAY)"}
									</button>
								</div>
							) : (
								<div>Proposal Executed</div>
							)}
						</div>
					))}
				</div>
			);
		}
	}

	if (!isWalletConnected) {
		return <h1>Please Connect Your Wallet</h1>;
	}

	return (
		<>
			<h1>Welcome to DEVS DAO</h1>
			<h2>Your NFT balance is {nftBalance}</h2>
			<h2>Total number of proposals: {numberOfProposals}</h2>
			<button
				onClick={() => setSelectedTab("Create Proposal")}
				style={{ minWidth: "240px" }}
			>
				Create Proposal
			</button>
			<br />
			<button
				style={{ minWidth: "240px" }}
				onClick={() => setSelectedTab("View Proposals")}
			>
				View Proposal
			</button>
			{renderTabs()}
		</>
	);
}
