/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PINATA_JWT: string;
  readonly VITE_PINATA_GATEWAY: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_REGISTRY_ADDRESS: string;
  readonly VITE_MEDILOCK_ID_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
