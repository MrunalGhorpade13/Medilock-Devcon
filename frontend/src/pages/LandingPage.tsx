import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, QrCode, Activity, Lock, Eye, Globe, ChevronRight, ExternalLink } from "lucide-react";
import addresses from "@/contracts/addresses.json";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function LandingPage() {
  const hasAddress = addresses.mediLockRegistry !== "0x0000000000000000000000000000000000000000";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-emerald-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 pt-24 pb-20 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-sm font-semibold px-4 py-2 rounded-full mb-8">
            <Shield className="h-4 w-4" /> Ethereum Sepolia · ERC-721 Soulbound
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6"
        >
          Your emergency medical info,
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-400">
            encrypted & on-chain.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10"
        >
          MediLock stores your critical medical data encrypted in a QR code.
          First responders scan it in seconds. Every access is permanently auditable on Ethereum.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/patient" className="btn-primary flex items-center justify-center gap-2 text-base">
            Register as Patient <ChevronRight className="h-4 w-4" />
          </Link>
          <Link to="/responder" className="btn-secondary flex items-center justify-center gap-2 text-base">
            <QrCode className="h-4 w-4" /> Responder Scanner
          </Link>
        </motion.div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Lock, step: "1", title: "Patient Registers", desc: "Fill your medical form. Data is encrypted in-browser with AES-256-GCM. Only the QR code holds the key — never a server.", color: "text-teal-500" },
            { icon: QrCode, step: "2", title: "Carry Your QR", desc: "Download your emergency card. The QR encodes your wallet address + the decryption key in the URL fragment (#key=…).", color: "text-emerald-500" },
            { icon: Activity, step: "3", title: "Responder Scans", desc: "A verified first responder scans your QR, decrypts your data locally, and the access is logged on-chain for full auditability.", color: "text-primary-500" },
          ].map(({ icon: Icon, step, title, desc, color }, i) => (
            <motion.div key={step} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="card text-center space-y-4">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 ${color} text-2xl font-bold mx-auto`}>
                <Icon className="h-7 w-7" />
              </div>
              <div className="text-xs font-bold tracking-widest text-slate-400 uppercase">Step {step}</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Privacy section ────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-12">What's On-Chain vs Off-Chain</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card border-l-4 border-primary-500 space-y-4">
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold">
              <Globe className="h-5 w-5" /> On-Chain (Public)
            </div>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              {["keccak256 commitment (proves integrity, reveals nothing)", "IPFS CID of encrypted blob", "Record active/inactive state", "Total access count", "Responder address + timestamp of each access", "Soulbound Medical ID NFT (ERC-721)"].map(item => (
                <li key={item} className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">✓</span>{item}</li>
              ))}
            </ul>
          </div>
          <div className="card border-l-4 border-danger-500 space-y-4">
            <div className="flex items-center gap-2 text-danger-600 dark:text-danger-400 font-bold">
              <Lock className="h-5 w-5" /> Off-Chain / Private
            </div>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              {["Name, date of birth, blood type", "Allergies and medical conditions", "Medications and dosages", "Emergency contacts", "Decryption key (QR fragment only, never sent to any server)", "All plaintext medical data"].map(item => (
                <li key={item} className="flex items-start gap-2"><span className="text-danger-500 mt-0.5">✗</span>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6 max-w-xl mx-auto">
          Medical data is <strong>never public</strong>. Every emergency access is <strong>transparent and auditable</strong>.
        </p>
      </section>

      {/* ── Contract link ──────────────────────────────────────────────── */}
      {hasAddress && (
        <section className="max-w-5xl mx-auto px-4 pb-20 text-center">
          <div className="inline-flex flex-col sm:flex-row gap-3 items-center bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 px-6 py-4">
            <Shield className="h-5 w-5 text-primary-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Deployed on Sepolia:</span>
            <a href={`https://sepolia.etherscan.io/address/${addresses.mediLockRegistry}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm font-mono text-primary-600 dark:text-primary-400 hover:underline">
              {addresses.mediLockRegistry.slice(0, 10)}…{addresses.mediLockRegistry.slice(-8)}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </section>
      )}

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 pb-24 text-center">
        <div className="card bg-gradient-to-br from-teal-500 to-emerald-500 text-white border-0 shadow-lg space-y-4">
          <h2 className="text-2xl font-bold">Ready to protect your health data?</h2>
          <p className="text-teal-100">Connect your wallet and register your emergency profile in under 2 minutes.</p>
          <Link to="/patient" className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold px-8 py-3 rounded-xl hover:bg-teal-50 transition-colors">
            Get Started <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
