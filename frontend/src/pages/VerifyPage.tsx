import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useRecord } from "@/hooks/useContracts";
import { importKey, decrypt } from "@/lib/crypto";
import { fetchRecord } from "@/lib/storage";
import { Shield, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import { TxStatus } from "@/components/TransactionToast";

interface MedicalData {
  fullName: string;
  dob: string;
  bloodType: string;
  allergies: { value: string }[];
  conditions: { value: string }[];
  medications: string;
  emergencyContacts: { name: string; phone: string; relation: string }[];
}

export default function VerifyPage() {
  const { address } = useParams<{ address: string }>();
  const [keyB64, setKeyB64] = useState<string>("");
  const [data, setData] = useState<MedicalData | null>(null);
  const [error, setError] = useState<string>("");
  const { data: record, refetch } = useRecord(address as `0x${string}`);

  // Extract key from URL fragment on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#key=")) {
      setKeyB64(decodeURIComponent(hash.substring(5)));
    } else {
      setError("Decryption key not found in URL fragment.");
    }
  }, []);

  // Fetch and decrypt when we have address, record, and key
  useEffect(() => {
    const run = async () => {
      if (!address || !record || !keyB64) return;
      try {
        // Assume record contains ipfsCid field (string) – adjust if different
        const cid = (record as any).ipfsCid as string;
        const encryptedBlob = await fetchRecord(cid);
        const cryptoKey = await importKey(keyB64);
        const decrypted = await decrypt<MedicalData>(encryptedBlob, cryptoKey);
        setData(decrypted);
      } catch (e: any) {
        setError(e?.message ?? "Failed to decrypt record");
      }
    };
    run();
  }, [address, record, keyB64]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-danger-500 mx-auto" />
          <h2 className="text-xl font-bold">Error</h2>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">Decrypting record…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-center mb-6">Verified Medical Record</h1>
      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-4">
            <p className="text-xs uppercase text-slate-400">Patient</p>
            <p className="text-lg font-bold">{data.fullName}</p>
            <p className="text-sm">DOB: {data.dob}</p>
          </div>
          <div className="bg-danger-600 text-white rounded-2xl flex items-center justify-center">
            <p className="text-xs uppercase text-red-200 mb-1">Blood Type</p>
            <p className="text-4xl font-extrabold">{data.bloodType}</p>
          </div>
        </div>
        {/* Allergies */}
        {data.allergies.length > 0 && (
          <div className="alert-danger">
            <p className="font-bold flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Allergies</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.allergies.map((a, i) => (
                <span key={i} className="bg-danger-600 text-white text-sm font-semibold px-3 py-1 rounded-lg">{a.value}</span>
              ))}
            </div>
          </div>
        )}
        {/* Conditions */}
        {data.conditions.length > 0 && (
          <div className="alert-amber">
            <p className="font-bold flex items-center gap-2"><Shield className="h-4 w-4" /> Conditions</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.conditions.map((c, i) => (
                <span key={i} className="bg-amber-500 text-white text-sm font-semibold px-3 py-1 rounded-lg">{c.value}</span>
              ))}
            </div>
          </div>
        )}
        {/* Medications */}
        {data.medications && (
          <div className="card">
            <p className="font-semibold flex items-center gap-2"><Shield className="h-4 w-4" /> Medications</p>
            <p className="text-sm whitespace-pre-line">{data.medications}</p>
          </div>
        )}
        {/* Emergency contacts */}
        {data.emergencyContacts.length > 0 && (
          <div className="card">
            <p className="font-semibold flex items-center gap-2"><ExternalLink className="h-4 w-4" /> Emergency Contacts</p>
            {data.emergencyContacts.map((c, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.relation}</p>
                </div>
                <a href={`tel:${c.phone}`} className="btn-primary text-sm">{c.phone}</a>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-6 text-center text-sm text-slate-500">
        <a href={`https://sepolia.etherscan.io/address/${address}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 justify-center">
          View on Etherscan <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
