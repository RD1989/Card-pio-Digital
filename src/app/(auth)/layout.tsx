"use client";

import { motion } from "framer-motion";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-premium-dark relative overflow-hidden selection:bg-amber-500/30">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] bg-amber-500/10 pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] bg-amber-600/5 pointer-events-none" />
      
      {/* Decorative center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[200px] bg-zinc-900/50 pointer-events-none" />

      <main className="relative z-10 w-full flex flex-col items-center justify-center px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </main>

      <footer className="fixed bottom-8 left-0 right-0 z-10 text-center">
        <p className="text-[9px] text-zinc-800 font-black tracking-[0.5em] uppercase italic pointer-events-none">
          Powered by Menu Pro ⚡ premium dashboard
        </p>
      </footer>
    </div>
  );
}
