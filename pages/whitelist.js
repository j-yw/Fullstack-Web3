import { WHITELIST_CONTRACT_ADDRESS, WHITELIST_ABI } from "../constants";
import { ThreeDots } from "react-loader-spinner";
import {
	useSigner,
	useAccount,
	usePrepareContractWrite,
	useContractWrite,
	useContractRead,
} from "wagmi";

export default function home() {
	const { address, isDisconnected } = useAccount();
	const { data: signer } = useSigner();

	// prepare config will cause contract write to be undefined when switching wallets in metamask
	const { config: whitelistContractConfig } = usePrepareContractWrite({
		addressOrName: WHITELIST_CONTRACT_ADDRESS,
		contractInterface: WHITELIST_ABI,
		signerOrProvider: signer,
		functionName: "addAddresssToWhitelist",
		enabled: false,
	});

	const { write: addToWhitelist, isLoading: isJoiningWhitelist } =
		useContractWrite({
			addressOrName: WHITELIST_CONTRACT_ADDRESS,
			contractInterface: WHITELIST_ABI,
			signerOrProvider: signer,
			functionName: "addAddresssToWhitelist",
			enabled: false,
		});

	const { data: numberOfWhitelistedAddresses } = useContractRead({
		addressOrName: WHITELIST_CONTRACT_ADDRESS,
		contractInterface: WHITELIST_ABI,
		functionName: "numAddressesWhitelisted",
		enabled: address,
		cacheTime: 2_000,
	});

	const { data: isAddressWhitelisted, isLoading: isWhitelistedLoading } =
		useContractRead({
			addressOrName: WHITELIST_CONTRACT_ADDRESS,
			contractInterface: WHITELIST_ABI,
			functionName: "whitelistedAddresses",
			args: [address],
			enabled: address,
			cacheTime: 2_000,
			onSuccess(data) {
				console.log(data);
			},
		});

	return (
		<>
			<h1>Welcome to DEVS NFT</h1>
			<h1>
				Whitelisted Accounts{" "}
				<strong>{numberOfWhitelistedAddresses}</strong>
			</h1>
			<h1>
				{isAddressWhitelisted
					? `Thank you for Joining`
					: "Join the whitelist now"}
			</h1>
			<button
				style={{
					minWidth: "240px",
					height: "48px",
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
		</>
	);
}
