import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { parseEventLogs } from "viem";
import registryAbi from "@/contracts/MediLockRegistry.json";
import nftAbi from "@/contracts/MediLockID.json";
import addresses from "@/contracts/addresses.json";
import type { Abi } from "viem";

export const REGISTRY_ADDRESS = addresses.mediLockRegistry as `0x${string}`;
export const NFT_ADDRESS = addresses.mediLockID as `0x${string}`;

// ─── Read hooks ──────────────────────────────────────────────────────────────

export function useIsRegistered(address?: `0x${string}`) {
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi: registryAbi.abi as Abi,
    functionName: "isRegistered",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useRecord(address?: `0x${string}`) {
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi: registryAbi.abi as Abi,
    functionName: "getRecord",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useIsVerifiedResponder(address?: `0x${string}`) {
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi: registryAbi.abi as Abi,
    functionName: "verifiedResponders",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useAccessCount(address?: `0x${string}`) {
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi: registryAbi.abi as Abi,
    functionName: "getAccessCount",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useNFTBalance(address?: `0x${string}`) {
  return useReadContract({
    address: NFT_ADDRESS,
    abi: nftAbi.abi as Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

// ─── Write hooks ─────────────────────────────────────────────────────────────

export function useRegisterRecord() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const registerRecord = async (
    commitment: `0x${string}`,
    cid: string,
    expiresAt: bigint
  ) => {
    return writeContractAsync({
      address: REGISTRY_ADDRESS,
      abi: registryAbi.abi as Abi,
      functionName: "registerRecord",
      args: [commitment, cid, expiresAt],
      chainId: sepolia.id,
    });
  };

  return { registerRecord, isPending, isConfirming, isSuccess, hash };
}

export function useUpdateRecord() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const updateRecord = async (
    commitment: `0x${string}`,
    cid: string,
    expiresAt: bigint
  ) => {
    return writeContractAsync({
      address: REGISTRY_ADDRESS,
      abi: registryAbi.abi as Abi,
      functionName: "updateRecord",
      args: [commitment, cid, expiresAt],
      chainId: sepolia.id,
    });
  };

  return { updateRecord, isPending, isConfirming, isSuccess, hash };
}

export function useRevokeRecord() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const revokeRecord = async () => {
    return writeContractAsync({
      address: REGISTRY_ADDRESS,
      abi: registryAbi.abi as Abi,
      functionName: "revokeRecord",
      args: [],
      chainId: sepolia.id,
    });
  };

  return { revokeRecord, isPending, isConfirming, isSuccess, hash };
}

export function useReactivateRecord() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const reactivateRecord = async () => {
    return writeContractAsync({
      address: REGISTRY_ADDRESS,
      abi: registryAbi.abi as Abi,
      functionName: "reactivateRecord",
      args: [],
      chainId: sepolia.id,
    });
  };

  return { reactivateRecord, isPending, isConfirming, isSuccess, hash };
}

export function useLogAccess() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const logAccess = async (patient: `0x${string}`) => {
    return writeContractAsync({
      address: REGISTRY_ADDRESS,
      abi: registryAbi.abi as Abi,
      functionName: "logAccess",
      args: [patient],
      chainId: sepolia.id,
    });
  };

  return { logAccess, isPending, isConfirming, isSuccess, hash };
}

export function useStoreOnChain() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const storeOnChain = async (data: `0x${string}`) => {
    return writeContractAsync({
      address: REGISTRY_ADDRESS,
      abi: registryAbi.abi as Abi,
      functionName: "storeEncryptedDataOnChain",
      args: [data],
      chainId: sepolia.id,
    });
  };

  return { storeOnChain, isPending, isConfirming, isSuccess, hash };
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export function etherscanTxUrl(hash: string) {
  return `https://sepolia.etherscan.io/tx/${hash}`;
}

export function etherscanAddressUrl(addr: string) {
  return `https://sepolia.etherscan.io/address/${addr}`;
}
