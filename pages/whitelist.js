import { WHITELIST_CONTRACT_ADDRESS, WHITELIST_ABI } from "../constants";
import { ThreeDots } from "react-loader-spinner";
import {
	useAccount,
	usePrepareContractWrite,
	useContractWrite,
	useContractRead,
} from "wagmi";

export default function WhitelistPage() {
	const { address, isConnected: isWalletConnected } = useAccount();

	// prepare config will cause contract write to be undefined when switching wallets in metamask
	const { config: whitelistContractConfig } = usePrepareContractWrite({
		address: WHITELIST_CONTRACT_ADDRESS,
		abi: WHITELIST_ABI,
		functionName: "addAddresssToWhitelist",
	});

	const { write: addToWhitelist, isLoading: isJoiningWhitelist } =
		useContractWrite(whitelistContractConfig);

	const { data: numberOfWhitelistedAddresses } = useContractRead({
		address: WHITELIST_CONTRACT_ADDRESS,
		abi: WHITELIST_ABI,
		functionName: "numAddressesWhitelisted",
	});

	const { data: isAddressWhitelisted, isLoading: isWhitelistedLoading } =
		useContractRead({
			address: WHITELIST_CONTRACT_ADDRESS,
			abi: WHITELIST_ABI,
			functionName: "whitelistedAddresses",
			args: [address],
			enabled: address,
			cacheTime: 2_000,
			onSuccess(data) {
				console.log(data);
			},
		});

	if (!isWalletConnected) {
		return <h1>Please Connect Your Wallet</h1>;
	}

	return (
		<>
			<h1>Welcome to DEVS NFT</h1>
			<h1>
				Whitelisted Accounts:{" "}
				<strong>{numberOfWhitelistedAddresses}</strong>
			</h1>
			<br />
			<hr />

			<h2>
				{isAddressWhitelisted
					? `Thank you for Joining`
					: "Join the whitelist now"}
			</h2>
			<button
				style={{
					minWidth: "240px",
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
				}}
				disabled={isAddressWhitelisted}
				onClick={() => addToWhitelist()}
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
		</>
	);
}
