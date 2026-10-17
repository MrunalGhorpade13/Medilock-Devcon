import { Link } from "react-router-dom";
import { Shield, Github, ExternalLink } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-6 text-slate-900 dark:text-white">
        <Shield className="inline h-8 w-8 mr-2 align-middle" /> About MediLock
      </h1>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
        MediLock is an emergency medical lockbox dApp built for the Devcon hackathon. It stores a patient's critical medical information encrypted in the browser, anchors a commitment on Ethereum Sepolia, and provides a QR code that trusted first responders can scan to retrieve the data.
      </p>
      <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 mb-6">
        <li>Zero‑knowledge privacy – data never touches the chain unencrypted.</li>
        <li>Audit‑able access logs on‑chain for every QR scan.</li>
        <li>Soulbound ERC‑721 Medical ID NFT guarantees a single record per address.</li>
        <li>Expiring QR codes and key rotation for added security.</li>
      </ul>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <a href="https://github.com/your-org/medilock-devcon" target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center gap-2">
          <Github className="h-4 w-4" /> View on GitHub
        </a>
        <Link to="/" className="btn-secondary flex items-center gap-2">
          <ExternalLink className="h-4 w-4" /> Back to Home
        </Link>
      </div>
      <p className="text-sm text-center text-slate-500 dark:text-slate-400">
        © 2026 MediLock – built with Solidity, Vite, React, wagmi v2, and TailwindCSS.
      </p>
    </div>
  );
}
