import { useEffect } from "react";
import { toast } from "sonner";
import { etherscanTxUrl } from "@/hooks/useContracts";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

interface TxToastOptions {
  hash?: `0x${string}`;
  isPending?: boolean;
  isConfirming?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  error?: Error | null;
  pendingMsg?: string;
  successMsg?: string;
  errorMsg?: string;
}

/**
 * Hook: shows sonner toasts for the full transaction lifecycle.
 * Usage: call useTxToast({ hash, isPending, isConfirming, isSuccess, isError, error })
 */
export function useTxToast({
  hash,
  isPending,
  isConfirming,
  isSuccess,
  isError,
  error,
  pendingMsg = "Submitting transaction…",
  successMsg = "Transaction confirmed!",
  errorMsg = "Transaction failed",
}: TxToastOptions) {
  useEffect(() => {
    if (isPending) {
      toast.loading(pendingMsg, { id: "tx-pending", description: "Check your wallet…" });
    }
  }, [isPending, pendingMsg]);

  useEffect(() => {
    if (isConfirming && hash) {
      toast.loading("Waiting for confirmation…", {
        id: "tx-pending",
        description: (
          <a
            href={etherscanTxUrl(hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 underline"
          >
            View on Etherscan <ExternalLink className="h-3 w-3" />
          </a>
        ),
      });
    }
  }, [isConfirming, hash]);

  useEffect(() => {
    if (isSuccess && hash) {
      toast.success(successMsg, {
        id: "tx-pending",
        description: (
          <a
            href={etherscanTxUrl(hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 underline text-emerald-700"
          >
            View on Etherscan <ExternalLink className="h-3 w-3" />
          </a>
        ),
        duration: 6000,
      });
    }
  }, [isSuccess, hash, successMsg]);

  useEffect(() => {
    if (isError) {
      toast.error(errorMsg, {
        id: "tx-pending",
        description: error?.message?.slice(0, 100) ?? "Unknown error",
        duration: 8000,
      });
    }
  }, [isError, error, errorMsg]);
}

// ─── Inline TX status bar ─────────────────────────────────────────────────────

interface TxStatusProps {
  hash?: `0x${string}`;
  isPending?: boolean;
  isConfirming?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  error?: Error | null;
  successMsg?: string;
}

export function TxStatus({ hash, isPending, isConfirming, isSuccess, isError, error, successMsg = "Confirmed!" }: TxStatusProps) {
  if (!isPending && !isConfirming && !isSuccess && !isError) return null;

  return (
    <div className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium
      ${isSuccess ? "alert-teal" : isError ? "alert-danger" : "alert-amber"}`}>
      {(isPending || isConfirming) && <Loader2 className="h-4 w-4 animate-spin mt-0.5 shrink-0" />}
      {isSuccess && <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />}
      {isError && <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
      <div className="flex flex-col gap-0.5">
        <span>
          {isPending && "Waiting for wallet…"}
          {isConfirming && "Confirming on-chain…"}
          {isSuccess && successMsg}
          {isError && `Error: ${error?.message?.slice(0, 80) ?? "Unknown"}`}
        </span>
        {hash && (
          <a
            href={etherscanTxUrl(hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs underline opacity-80 hover:opacity-100"
          >
            View on Etherscan <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
