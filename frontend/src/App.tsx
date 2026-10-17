import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { Toaster } from "sonner";
import ConnectWallet from "./components/ConnectWallet";
import { AnimatePresence, motion } from "framer-motion";
import LandingPage from "./pages/LandingPage";
import PatientPage from "./pages/PatientPage";
import ResponderPage from "./pages/ResponderPage";
import VerifyPage from "./pages/VerifyPage";
import AboutPage from "./pages/AboutPage";
import Navbar from "./components/Navbar";
import { useDarkMode } from "./hooks/useDarkMode";

function WrongNetwork() {
  const { switchChain } = useSwitchChain();
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="card max-w-md text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Wrong Network</h2>
        <p className="text-slate-500 text-sm">
          MediLock runs on <strong>Sepolia testnet</strong>. Please switch your wallet to Sepolia.
        </p>
        <button
          className="btn-primary w-full"
          onClick={() => switchChain({ chainId: sepolia.id })}
        >
          Switch to Sepolia
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const chainId = useChainId();
  const [isDark, toggleDark] = useDarkMode();

  // Show wrong network screen if connected to wrong chain
  if (chainId && chainId !== sepolia.id) {
    return (
      <div className={isDark ? "dark" : ""}>
        <DisclaimerBanner />
        <WrongNetwork />
        <Toaster position="bottom-right" richColors />
      </div>
    );
  }

  return (
    <div className={isDark ? "dark" : ""}>
      <DisclaimerBanner />
      <BrowserRouter>
        <Navbar isDark={isDark} toggleDark={toggleDark} />
        <main className="pt-14">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/patient" element={<PatientPage />} />
              <Route path="/responder" element={<ResponderPage />} />
              <Route path="/verify/:address" element={<VerifyPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
        <Toaster position="bottom-right" richColors closeButton />
      </BrowserRouter>
    </div>
  );
}

function DisclaimerBanner() {
  return (
    <div className="disclaimer-banner">
      ⚠️ Hackathon prototype on Sepolia testnet — do not enter real medical data
    </div>
  );
}
