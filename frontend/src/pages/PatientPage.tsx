import { useState, useRef, useCallback } from "react";
import { useAccount } from "wagmi";
import ConnectWallet from "@/components/ConnectWallet";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  Shield, ChevronRight, ChevronLeft, Plus, X, Download,
  Printer, ToggleLeft, ToggleRight, Clock, RefreshCw, ExternalLink, CheckCircle2
} from "lucide-react";
import { generateKey, exportKey, encrypt, computeCommitment } from "@/lib/crypto";
import { uploadToPinata, encodeForChain } from "@/lib/storage";
import { useRegisterRecord, useUpdateRecord, useRevokeRecord, useReactivateRecord, useIsRegistered, useRecord } from "@/hooks/useContracts";
import { TxStatus } from "@/components/TransactionToast";

// ─── Zod schema ───────────────────────────────────────────────────────────────

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"] as const;
const EXPIRY_OPTIONS = [
  { label: "Never", value: 0 },
  { label: "24 hours", value: 86400 },
  { label: "7 days", value: 604800 },
  { label: "30 days", value: 2592000 },
] as const;

const medicalSchema = z.object({
  fullName: z.string().min(2, "Name required"),
  dob: z.string().min(1, "Date of birth required"),
  bloodType: z.enum(BLOOD_TYPES),
  allergies: z.array(z.object({ value: z.string().min(1) })),
  conditions: z.array(z.object({ value: z.string().min(1) })),
  medications: z.string(),
  emergencyContacts: z.array(z.object({
    name: z.string().min(1, "Name required"),
    phone: z.string().min(1, "Phone required"),
    relation: z.string(),
  })),
  expirySeconds: z.number(),
});

type MedicalForm = z.infer<typeof medicalSchema>;

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const steps = ["Medical Info", "Encrypt & Register", "Emergency Card"];
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
              ${i + 1 < step ? "bg-primary-500 text-white" : i + 1 === step ? "bg-primary-600 text-white ring-4 ring-primary-200 dark:ring-primary-900" : "bg-slate-200 dark:bg-slate-700 text-slate-400"}`}>
              {i + 1 < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i + 1 === step ? "text-primary-600 dark:text-primary-400" : "text-slate-400"}`}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-16 sm:w-24 h-0.5 mx-1 transition-all duration-500 ${step > i + 1 ? "bg-primary-500" : "bg-slate-200 dark:bg-slate-700"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Tag input ────────────────────────────────────────────────────────────────

function TagInput({ fields, append, remove, placeholder }: {
  fields: { id: string; value: string }[];
  append: (v: { value: string }) => void;
  remove: (i: number) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");
  const add = () => {
    if (input.trim()) { append({ value: input.trim() }); setInput(""); }
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input className="input flex-1" value={input} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder} />
        <button type="button" onClick={add} className="btn-secondary px-4 py-3 rounded-xl"><Plus className="h-4 w-4" /></button>
      </div>
      {fields.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fields.map((f, i) => (
            <span key={f.id} className="badge-teal flex items-center gap-1.5 py-1.5 px-3">
              {f.value}
              <button type="button" onClick={() => remove(i)}><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 1: Medical Form ─────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: (data: MedicalForm) => void }) {
  const { register, control, handleSubmit, formState: { errors } } = useForm<MedicalForm>({
    resolver: zodResolver(medicalSchema),
    defaultValues: {
      bloodType: "Unknown",
      allergies: [],
      conditions: [],
      emergencyContacts: [{ name: "", phone: "", relation: "" }],
      expirySeconds: 0,
    },
  });
  const allergies = useFieldArray({ control, name: "allergies" });
  const conditions = useFieldArray({ control, name: "conditions" });
  const contacts = useFieldArray({ control, name: "emergencyContacts" });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name *</label>
          <input {...register("fullName")} className="input" placeholder="Jane Doe" />
          {errors.fullName && <p className="text-xs text-danger-500 mt-1">{errors.fullName.message}</p>}
        </div>
        <div>
          <label className="label">Date of Birth *</label>
          <input {...register("dob")} type="date" className="input" />
        </div>
      </div>
      <div>
        <label className="label">Blood Type</label>
        <select {...register("bloodType")} className="input">
          {BLOOD_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Allergies</label>
        <TagInput fields={allergies.fields as { id: string; value: string }[]} append={allergies.append} remove={allergies.remove} placeholder="Add allergy (press Enter)" />
      </div>
      <div>
        <label className="label">Medical Conditions</label>
        <TagInput fields={conditions.fields as { id: string; value: string }[]} append={conditions.append} remove={conditions.remove} placeholder="Add condition (press Enter)" />
      </div>
      <div>
        <label className="label">Current Medications</label>
        <textarea {...register("medications")} className="input resize-none h-20" placeholder="List medications and dosages…" />
      </div>
      <div>
        <label className="label">Emergency Contacts</label>
        <div className="space-y-3">
          {contacts.fields.map((f, i) => (
            <div key={f.id} className="grid grid-cols-3 gap-2">
              <input {...register(`emergencyContacts.${i}.name`)} className="input" placeholder="Name" />
              <input {...register(`emergencyContacts.${i}.phone`)} className="input" placeholder="Phone" />
              <input {...register(`emergencyContacts.${i}.relation`)} className="input" placeholder="Relation" />
            </div>
          ))}
          <button type="button" onClick={() => contacts.append({ name: "", phone: "", relation: "" })}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" /> Add contact
          </button>
        </div>
      </div>
      <div>
        <label className="label flex items-center gap-2"><Clock className="h-4 w-4" /> QR Expiry</label>
        <select {...register("expirySeconds", { valueAsNumber: true })} className="input">
          {EXPIRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <p className="text-xs text-slate-400 mt-1">After expiry, first responders cannot log access. "Never" is recommended for everyday carry.</p>
      </div>
      <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
        Continue to Encrypt <ChevronRight className="h-4 w-4" />
      </button>
    </form>
  );
}

// ─── Step 2: Encrypt & Register ───────────────────────────────────────────────

type Step2Status = "idle" | "encrypting" | "uploading" | "tx" | "done" | "error";

function Step2({
  formData, address, onBack, onDone,
}: { formData: MedicalForm; address: `0x${string}`; onBack: () => void; onDone: (qrUrl: string) => void }) {
  const [status, setStatus] = useState<Step2Status>("idle");
  const [errMsg, setErrMsg] = useState("");
  const { registerRecord, isPending, isConfirming, isSuccess, hash } = useRegisterRecord();

  const statusLabel: Record<Step2Status, string> = {
    idle: "Ready to encrypt",
    encrypting: "Encrypting in browser…",
    uploading: "Uploading to IPFS…",
    tx: "Sending transaction…",
    done: "Registered!",
    error: "Error",
  };

  const run = useCallback(async () => {
    try {
      setStatus("encrypting");
      const key = await generateKey();
      const exported = await exportKey(key);
      const { blob } = await encrypt(formData, key);
      const commitment = computeCommitment(blob);

      setStatus("uploading");
      let cid = "";
      let onChainHex: `0x${string}` | undefined;
      try {
        cid = await uploadToPinata(blob);
      } catch {
        onChainHex = encodeForChain(blob);
      }

      setStatus("tx");
      const expiresAt = formData.expirySeconds > 0
        ? BigInt(Math.floor(Date.now() / 1000) + formData.expirySeconds)
        : 0n;
      const txHash = await registerRecord(commitment, cid, expiresAt);

      const qrUrl = `${window.location.origin}/verify/${address}#key=${exported}`;
      onDone(qrUrl);
      setStatus("done");
    } catch (e: any) {
      setStatus("error");
      setErrMsg(e?.message ?? "Unknown error");
    }
  }, [formData, address, registerRecord, onDone]);

  return (
    <div className="space-y-6">
      <div className="alert-teal text-sm space-y-2">
        <p className="font-semibold">🔒 How your privacy is protected:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Your data is encrypted <strong>in this browser</strong> with AES-256-GCM before leaving your device.</li>
          <li>The decryption key lives <strong>only in the QR code URL fragment</strong> (#key=…) — never sent to any server.</li>
          <li>Only the encrypted blob (unreadable without the key) is stored on IPFS.</li>
          <li>On-chain: a keccak256 commitment, IPFS CID, and access counter. <strong>No plaintext. Ever.</strong></li>
        </ul>
      </div>

      <div className="card bg-slate-50 dark:bg-slate-900/50 space-y-2 text-sm">
        <p className="font-semibold text-slate-700 dark:text-slate-300">Registering as:</p>
        <p className="font-mono text-xs text-slate-500 break-all">{address}</p>
        <p className="text-slate-500">Blood type: <strong>{formData.bloodType}</strong> · Allergies: <strong>{formData.allergies.length}</strong> · Contacts: <strong>{formData.emergencyContacts.length}</strong></p>
      </div>

      {status !== "idle" && (
        <div className="space-y-3">
          {(["encrypting", "uploading", "tx"] as Step2Status[]).map((s, i) => {
            const done = (["encrypting", "uploading", "tx"] as Step2Status[]).indexOf(status) > i || status === "done";
            const active = s === status;
            return (
              <div key={s} className={`flex items-center gap-3 text-sm px-4 py-2.5 rounded-xl transition-all ${done ? "text-primary-600 dark:text-primary-400" : active ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                <div className={`w-2 h-2 rounded-full ${done ? "bg-primary-500" : active ? "bg-amber-400 animate-pulse" : "bg-slate-300 dark:bg-slate-600"}`} />
                {statusLabel[s]}
              </div>
            );
          })}
        </div>
      )}

      <TxStatus hash={hash} isPending={isPending} isConfirming={isConfirming} isSuccess={isSuccess}
        isError={status === "error"} error={status === "error" ? new Error(errMsg) : null}
        successMsg="Record registered on-chain!" />

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2" disabled={status !== "idle"}>
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={run} disabled={status !== "idle"} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {status === "idle" ? <><Shield className="h-4 w-4" /> Encrypt & Register</> : statusLabel[status]}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Emergency Card ───────────────────────────────────────────────────

function Step3({ qrUrl, address }: { qrUrl: string; address: `0x${string}` }) {
  const { data: record, refetch } = useRecord(address);
  const { revokeRecord, isPending: rPending, isConfirming: rConfirming, isSuccess: rSuccess, hash: rHash } = useRevokeRecord();
  const { reactivateRecord, isPending: aPending, isConfirming: aConfirming, isSuccess: aSuccess, hash: aHash } = useReactivateRecord();
  const { updateRecord, isPending: uPending, isConfirming: uConfirming, isSuccess: uSuccess, hash: uHash } = useUpdateRecord();
  const qrRef = useRef<HTMLDivElement>(null);
  const active = (record as any)?.active !== false;

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "medilock-emergency-qr.svg"; a.click();
  };

  const rotateKey = async () => {
    try {
      const k = await generateKey(); const exp = await exportKey(k);
      toast.info("Regenerating encrypted record…");
    } catch { toast.error("Key rotation failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="alert-teal text-sm font-medium">
        ✅ Your record is live on Sepolia. Share this QR with a trusted person or keep it in your wallet.
      </div>

      {/* QR card */}
      <div className="card text-center space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white">🆘 Emergency Medical Access</h3>
        <p className="text-xs text-slate-500 font-mono break-all">{address}</p>
        <div ref={qrRef} className="inline-block p-4 bg-white rounded-2xl shadow-inner">
          <QRCodeSVG value={qrUrl} size={200} level="H" includeMargin />
        </div>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Scan with MediLock Responder Scanner. Key is in URL fragment — never transmitted to any server.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={downloadQR} className="btn-secondary flex items-center gap-2 text-sm">
            <Download className="h-4 w-4" /> Download QR
          </button>
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2 text-sm">
            <Printer className="h-4 w-4" /> Print Card
          </button>
        </div>
      </div>

      {/* Record status */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Record Status</span>
          <span className={active ? "badge-green" : "badge-red"}>{active ? "Active" : "Revoked"}</span>
        </div>
        {(record as any)?.accessCount !== undefined && (
          <p className="text-sm text-slate-500">Total accesses: <strong>{String((record as any).accessCount)}</strong></p>
        )}
        <div className="flex gap-3">
          {active ? (
            <button onClick={() => revokeRecord()} disabled={rPending || rConfirming}
              className="btn-danger flex items-center gap-2 text-sm">
              <ToggleRight className="h-4 w-4" /> Revoke Access
            </button>
          ) : (
            <button onClick={() => reactivateRecord()} disabled={aPending || aConfirming}
              className="btn-primary flex items-center gap-2 text-sm">
              <ToggleLeft className="h-4 w-4" /> Reactivate
            </button>
          )}
          <button onClick={rotateKey} disabled={uPending || uConfirming}
            className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className="h-4 w-4" /> Rotate Key
          </button>
        </div>
        <TxStatus hash={rHash ?? aHash ?? uHash} isPending={rPending || aPending || uPending}
          isConfirming={rConfirming || aConfirming || uConfirming}
          isSuccess={rSuccess || aSuccess || uSuccess} />
      </div>
    </div>
  );
}

// ─── Main patient page ────────────────────────────────────────────────────────

export default function PatientPage() {
  const { address, isConnected } = useAccount();
  const { data: isRegistered } = useIsRegistered(address);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<MedicalForm | null>(null);
  const [qrUrl, setQrUrl] = useState("");

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md text-center space-y-4">
          <Shield className="h-12 w-12 text-primary-500 mx-auto" />
          <h2 className="text-xl font-bold">Connect Your Wallet</h2>
          <p className="text-slate-500 text-sm">Connect your MetaMask (Sepolia) to register your medical profile.</p>
          <ConnectWallet />
        </div>
      </div>
    );
  }

  // Already registered — jump to card
  if (isRegistered && step === 1 && !formData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-center mb-8 text-slate-900 dark:text-white">Your Emergency Card</h1>
        <div className="alert-teal mb-6 text-sm">You already have a registered record. Manage it below.</div>
        <Step3 qrUrl={`${window.location.origin}/verify/${address}`} address={address!} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-center mb-2 text-slate-900 dark:text-white">Patient Registration</h1>
      <p className="text-center text-slate-500 text-sm mb-8">Your data never leaves your browser unencrypted.</p>
      <ProgressBar step={step} />
      <div className="card">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            {step === 1 && <Step1 onNext={(d) => { setFormData(d); setStep(2); }} />}
            {step === 2 && formData && (
              <Step2 formData={formData} address={address!} onBack={() => setStep(1)}
                onDone={(url) => { setQrUrl(url); setStep(3); }} />
            )}
            {step === 3 && <Step3 qrUrl={qrUrl} address={address!} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
