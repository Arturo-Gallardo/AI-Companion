import { motion } from "framer-motion";

export function DashboardShell() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-12">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            AI Focus Companion
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-50">
            Your study buddy is on the desktop
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">
            The companion window should be visible along the bottom edge of your
            screen. Phase 1 covers idle and walking. Dashboard features like
            rules, sessions, and analytics come next.
          </p>
        </motion.section>
      </div>
    </main>
  );
}
