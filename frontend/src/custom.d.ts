declare module 'vite';
declare module '@vitejs/plugin-react';
declare module 'path';
declare const __dirname: string;
declare module 'react-router-dom';
declare module 'framer-motion';
declare module 'lucide-react';
declare module '*.json' {
  const value: any;
  export default value;
}
// Minimal JSX intrinsic elements to silence TS errors in .tsx files
declare namespace JSX {
  interface IntrinsicElements {
    [elem: string]: any;
  }
}
