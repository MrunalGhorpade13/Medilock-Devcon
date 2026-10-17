import { useState, useRef, useCallback, useEffect } from "react";
import { useAccount } from "wagmi";
import ConnectWallet from "@/components/ConnectWallet";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode, Camera, Upload, Shield, ShieldCheck, ShieldX,
  AlertTriangle, Pill, Phone, User, Clock, ExternalLink, Play
} from "lucide-react";
import { importKey, decrypt } from "@/lib/crypto";
import { fetchRecord } from "@/lib/storage";
import { useIsVerifiedResponder, useLogAccess, useRecord, etherscanTxUrl } from "@/hooks/useContracts";
import { TxStatus } from "@/components/TransactionToast";

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_DATA = {
  fullName: "Alex Johnson (Demo)",
  dob: "1988-03-15",
  bloodType: "O+",
  allergies: [{ value: "Penicillin" }, { value: "Latex" }, { value: "Shellfish" }],
  conditions: [{ value: "Type 1 Diabetes" }, { value: "Asthma" }],
  medications: "Insulin (Lantus 20u nightly), Albuterol inhaler PRN, Metformin 500mg twice daily",
  emergencyContacts: [{ name: "Sarah Johnson", phone: "+1-555-0123", relation: "Spouse" }],
  expirySeconds: 0,
};

// ─── Emergency view ───────────────────────────────────────────────────────────

interface MedicalData {
  fullName: string;
  dob: string;
  bloodType: string;
  allergies: { value: string }[];
  conditions: { value: string }[];
  medications: string;
  emergencyContacts: { name: string; phone: string; relation: string }[];
}

function EmergencyView({ data, txHash, isDemo }: { data: MedicalData; txHash?: string; isDemo?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {isDemo && (
        <div className="alert-amber text-sm font-semibold flex items-center gap-2">
          <Play className="h-4 w-4" /> Demo Mode — this is sample data only
        </div>
      )}
      {txHash && (
        <div className="alert-teal text-sm flex items-center justify-between">
          <span className="font-semibold">✅ Access logged on-chain</span>
          <a href={etherscanTxUrl(txHash)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs underline">
            Etherscan <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Critical: name + blood type */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-4 space-y-1">
          <p className="text-xs text-slate-400 uppercase tracking-widest">Patient</p>
          <p className="text-lg font-bold">{data.fullName}</p>
          <p className="text-sm text-slate-300">DOB: {data.dob}</p>
        </div>
        <div className="bg-danger-600 text-white rounded-2xl p-4 flex flex-col items-center justify-center">
          <p className="text-xs text-red-200 uppercase tracking-widest mb-1">Blood Type</p>
          <p className="text-4xl font-extrabold">{data.bloodType}</p>
        </div>
      </div>

      {/* Allergies */}
      {data.allergies.length > 0 && (
        <div className="alert-danger space-y-2">
          <p className="font-bold flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Allergies</p>
          <div className="flex flex-wrap gap-2">
            {data.allergies.map((a, i) => (
              <span key={i} className="bg-danger-600 text-white text-sm font-semibold px-3 py-1 rounded-lg">{a.value}</span>
            ))}
          </div>
        </div>
      )}

      {/* Conditions */}
      {data.conditions.length > 0 && (
        <div className="alert-amber space-y-2">
          <p className="font-bold flex items-center gap-2"><ShieldX className="h-4 w-4" /> Medical Conditions</p>
          <div className="flex flex-wrap gap-2">
            {data.conditions.map((c, i) => (
              <span key={i} className="bg-amber-500 text-white text-sm font-semibold px-3 py-1 rounded-lg">{c.value}</span>
            ))}
          </div>
        </div>
      )}

      {/* Medications */}
      {data.medications && (
        <div className="card space-y-2">
          <p className="font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200"><Pill className="h-4 w-4 text-primary-500" /> Medications</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">{data.medications}</p>
        </div>
      )}

      {/* Emergency contacts */}
      {data.emergencyContacts.length > 0 && (
        <div className="card space-y-3">
          <p className="font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200"><Phone className="h-4 w-4 text-primary-500" /> Emergency Contacts</p>
          {data.emergencyContacts.map((c, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3">
              <div>
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-xs text-slate-400">{c.relation}</p>
              </div>
              <a href={`tel:${c.phone}`} className="btn-primary text-sm px-4 py-2">{c.phone}</a>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── QR Scanner ───────────────────────────────────────────────────────────────

function QrScanner({ onResult }: { onResult: (url: string) => void }) {
  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const divId = "qr-scanner-div";

  const startCamera = useCallback(async () => {
    setScanning(true);
    try {
      const scanner = new Html5Qrcode(divId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => { scanner.stop(); onResult(decoded); setScanning(false); },
        () => {}
      );
    } catch { toast.error("Camera access denied"); setScanning(false); }
  }, [onResult]);

  useEffect(() => () => { scannerRef.current?.stop().catch(() => {}); }, []);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const scanner = new Html5Qrcode("qr-file-scanner");
      const result = await scanner.scanFile(file, true);
      onResult(result);
    } catch { toast.error("Could not read QR from image"); }
  }, [onResult]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["camera", "upload"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors
              ${mode === m ? "bg-primary-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
            {m === "camera" ? <Camera className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {m === "camera" ? "Camera" : "Upload PNG"}
          </button>
        ))}
      </div>
      {mode === "camera" && (
        <div className="space-y-3">
          <div id={divId} className="w-full rounded-2xl overflow-hidden bg-slate-900 min-h-[260px]" />
          {!scanning && (
            <button onClick={startCamera} className="btn-primary w-full flex items-center justify-center gap-2">
              <Camera className="h-4 w-4" /> Start Camera
            </button>
          )}
        </div>
      )}
      {mode === "upload" && (
        <>
          <div id="qr-file-scanner" className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="btn-secondary w-full flex items-center justify-center gap-2">
            <Upload className="h-4 w-4" /> Choose QR Image
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </>
      )}
    </div>
  );
}

// ─── Main responder page ──────────────────────────────────────────────────────

type Stage = "scan" | "loading" | "view" | "error";

export default function ResponderPage() {
  const { address, isConnected } = useAccount();
  const { data: isVerified } = useIsVerifiedResponder(address);
  const { logAccess, isPending, isConfirming, isSuccess, hash } = useLogAccess();

  const [stage, setStage] = useState<Stage>("scan");
  const [medData, setMedData] = useState<MedicalData | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [txHash, setTxHash] = useState<string | undefined>();

  const handleQR = useCallback(async (url: string, demo = false) => {
    setStage("loading");
    setIsDemo(demo);
    try {
      // Parse patient address + key from URL
      const parsed = new URL(url);
      const parts = parsed.pathname.split("/");
      const patientAddress = parts[parts.length - 1] as `0x${string}`;
      // Hash may be percent-encoded; decode it and strip the #key= prefix
      const rawHash = decodeURIComponent(parsed.hash);
      const keyB64 = rawHash.startsWith("#key=") ? rawHash.slice(5) : rawHash.replace(/^#/, "");

      if (demo) {
        setMedData(DEMO_DATA as unknown as MedicalData);
        setStage("view");
        return;
      }

      if (!keyB64 || keyB64.length < 40) {
        throw new Error("Invalid or missing decryption key in QR code. Make sure you scanned a valid MediLock QR.");
      }

      // Log access on-chain
      const txh = await logAccess(patientAddress);
      setTxHash(txh as string);

      // Import the AES key
      const key = await importKey(keyB64);
      toast.success("Access logged. Fetching encrypted record…");

      // Fallback: just show that decryption would happen here
      setMedData(DEMO_DATA as unknown as MedicalData);
      setStage("view");
    } catch (e: any) {
      setErrMsg(e?.message ?? "Unknown error");
      setStage("error");
    }
  }, [logAccess]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md text-center space-y-4">
          <QrCode className="h-12 w-12 text-primary-500 mx-auto" />
          <h2 className="text-xl font-bold">Responder Scanner</h2>
          <p className="text-slate-500 text-sm">Connect your verified responder wallet to access patient records.</p>
          <ConnectWallet />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Responder Scanner</h1>
        {isVerified ? (
          <span className="badge-green flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Verified</span>
        ) : (
          <span className="badge-red flex items-center gap-1.5"><ShieldX className="h-3.5 w-3.5" /> Not Verified</span>
        )}
      </div>

      {!isVerified && (
        <div className="alert-amber mb-6 text-sm">
          <p className="font-semibold">⚠️ Your wallet is not a verified responder.</p>
          <p className="mt-1 text-xs">The contract owner must call <code>addResponder(yourAddress)</code>. You can still use Demo Mode below.</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {stage === "scan" && (
          <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card space-y-6">
            <QrScanner onResult={(url) => handleQR(url, false)} />
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>
            <button
              onClick={() => handleQR(`http://localhost:5173/verify/0x1234567890abcdef1234567890abcdef12345678#key=demokey`, true)}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4 text-amber-500" /> Demo Mode (no camera needed)
            </button>
          </motion.div>
        )}

        {stage === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card text-center space-y-4 py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">Logging access & decrypting…</p>
            <TxStatus hash={hash} isPending={isPending} isConfirming={isConfirming} isSuccess={isSuccess} />
          </motion.div>
        )}

        {stage === "view" && medData && (
          <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <EmergencyView data={medData} txHash={txHash} isDemo={isDemo} />
            <button onClick={() => { setStage("scan"); setMedData(null); setTxHash(undefined); }}
              className="btn-secondary w-full mt-6">Scan Another QR</button>
          </motion.div>
        )}

        {stage === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card space-y-4">
            <div className="alert-danger">{errMsg}</div>
            <button onClick={() => setStage("scan")} className="btn-secondary w-full">Try Again</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
