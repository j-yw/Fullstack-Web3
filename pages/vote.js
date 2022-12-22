import { Contract, providers, utils } from "ethers";
import { ThreeDots } from "react-loader-spinner";
import { useEffect, useRef, useState } from "react";
import {
	DEVS_DAO_CONTRACT_ADDRESS,
	DEVS_DAO_ABI,
	DEVS_NFT_CONTRACT_ADDRESS,
	DEVS_NFT_ABI,
} from "../constants";

import {
	useAccount,
	usePrepareContractWrite,
	useWaitForTransaction,
	useContractWrite,
	useContractRead,
	useProvider,
	useContract,
	useBalance,
} from "wagmi";

export default function VotePage() {
	const [proposals, setProposals] = useState([]);
	const [fakeNftTokenId, setFakeNftTokenId] = useState("");
	const [selectedTab, setSelectedTab] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const { address: connectedWalletAddress, isConnected: isWalletConnected } =
		useAccount();

	const { data: treasuryBalance } = useBalance({
		address: DEVS_DAO_CONTRACT_ADDRESS,
	});

	const [proposalId, setProposalId] = useState("");
	const [vote, setVote] = useState("");

	const provider = useProvider();

	const daoContract = useContract({
		address: DEVS_DAO_CONTRACT_ADDRESS,
		abi: DEVS_DAO_ABI,
	});

	async function getProposalById(id) {
		try {
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

	const {
		data: numberOfProposals,
		isLoading: isNumberOfProposalsLoading,
		isSuccess: isNumberOfProposalsSuccess,
	} = useContractRead({
		address: DEVS_DAO_CONTRACT_ADDRESS,
		abi: DEVS_DAO_ABI,
		functionName: "numberOfProposals",
		watch: true,
	});

	const {
		data: nftBalance,
		isLoading: isNftBalanceLoading,
		isSuccess: isNftBalanceSuccess,
	} = useContractRead({
		address: DEVS_NFT_CONTRACT_ADDRESS,
		abi: DEVS_NFT_ABI,
		functionName: "balanceOf",
		args: [connectedWalletAddress],
		watch: true,
	});

	const { config: createProposalDataConfig } = usePrepareContractWrite({
		address: DEVS_DAO_CONTRACT_ADDRESS,
		abi: DEVS_DAO_ABI,
		functionName: "createProposal",
		args: [fakeNftTokenId],
		onSuccess: () => {
			getAllProposals();
		},
	});

	const { data: createProposalData, write: createProposal } =
		useContractWrite(createProposalDataConfig);

	const {
		isError: isCreateProposalError,
		isLoading: isCreateProposalLoading,
		isSuccess: isCreateProposalSuccess,
	} = useWaitForTransaction({
		hash: createProposalData?.hash,
		wait: createProposalData?.wait,
	});

	const { config: voteDataConfig } = usePrepareContractWrite({
		address: DEVS_DAO_CONTRACT_ADDRESS,
		abi: DEVS_DAO_ABI,
		functionName: "voteOnProposal",
		args: [proposalId, vote],
	});

	const { data: voteData, write: voteOnProposal } =
		useContractWrite(voteDataConfig);

	const { config: executeDataConfig } = usePrepareContractWrite({
		addressOrName: DEVS_DAO_CONTRACT_ADDRESS,
		contractInterface: DEVS_DAO_ABI,
		functionName: "executeProposal",
		args: [proposalId],
	});

	const { data: executeData, write: execute } =
		useContractWrite(executeDataConfig);

	const {
		isError: isVotingError,
		isLoading: isVotingLoading,
		isSuccess: isVotingSuccess,
	} = useWaitForTransaction({
		hash: voteData?.hash,
		wait: voteData?.wait,
	});

	const {
		isError: isExecuteError,
		isLoading: isExecuteLoading,
		isSuccess: isExecuteSuccess,
	} = useWaitForTransaction({
		hash: executeData?.hash,
		wait: executeData?.wait,
	});

	useEffect(() => {
		getAllProposals();
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
							style={{
								minWidth: "240px",
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
							}}
							onClick={createProposal}
						>
							{isCreateProposalLoading ? (
								<>
									<ThreeDots
										height="18"
										width="18"
										radius="9"
										color="#e5e5e5"
										ariaLabel="three-dots-loading"
										wrapperClassName=""
										visible={true}
									/>
								</>
							) : (
								<>
									{isCreateProposalSuccess ? (
										<>Proposal Created</>
									) : (
										<span>Create</span>
									)}
								</>
							)}
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
					{proposals?.map((p, index) => (
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
										style={{
											display: "flex",
											justifyContent: "center",
											alignItems: "center",
											minWidth: "240px",
										}}
										onClick={() => {
											setProposalId(p.proposalId);
											setVote("0");
											voteOnProposal([]);
										}}
									>
										{isVotingLoading ? (
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
											<span>Vote YAY</span>
										)}
									</button>
									<button
										style={{
											display: "flex",
											justifyContent: "center",
											alignItems: "center",
											minWidth: "240px",
										}}
										onClick={() => {
											setProposalId(p.proposalId);
											setVote("1");
											voteOnProposal([]);
										}}
									>
										{isVotingLoading ? (
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
											<span>Vote NAY</span>
										)}
									</button>
								</div>
							) : p.deadline.getTime() < Date.now() &&
							  !p.executed ? (
								<div>
									<button
										style={{
											display: "flex",
											justifyContent: "center",
											alignItems: "center",
											minWidth: "240px",
										}}
										onClick={() => {
											setProposalId(p.proposalId);
											execute([]);
										}}
									>
										{isExecuteLoading ? (
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
											<span>
												Execute Proposal{" "}
												{p.yayVotes > p.nayVotes
													? "(YAY)"
													: "(NAY)"}
											</span>
										)}
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
			<h2>
				{isNftBalanceLoading ? (
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
					<span>
						Your NFT balance is{" "}
						{isNftBalanceSuccess && nftBalance.toString()}
					</span>
				)}
			</h2>

			<h2>
				{isNumberOfProposalsLoading ? (
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
					<span>
						Total number of proposals:{" "}
						{isNumberOfProposalsSuccess &&
							numberOfProposals.toString()}
					</span>
				)}
			</h2>

			<h2>Treasury Balance {treasuryBalance?.formatted}</h2>

			<button
				onClick={() => setSelectedTab("Create Proposal")}
				style={{
					minWidth: "240px",
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<span>Create Proposal</span>
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
