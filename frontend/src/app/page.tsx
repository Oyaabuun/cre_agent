"use client"

import React, { useState } from "react"
import { PropertyForm } from "@/components/PropertyForm"
import { ResultView } from "@/components/ResultView"
import { SearchLoading } from "@/components/SearchLoading"
import { motion, AnimatePresence } from "framer-motion"
import { Building2, ShieldCheck, Zap, BrainCircuit, TrendingUp, Sparkles } from "lucide-react"
import { useAuth } from "@/lib/AuthContext"
import { AuthModal } from "@/components/AuthModal"
import { BACKEND_URL } from "@/lib/utils"

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { user, logout } = useAuth()
  const [showGlobalAuth, setShowGlobalAuth] = useState(false)

  const handleEvaluate = async (formData: any) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`${BACKEND_URL}/decision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to evaluate property. Please check if the backend is running.")
      }

      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-mesh relative overflow-hidden">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-bold text-xl text-white">
              <div className="bg-sky-500 p-1.5 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              SiteMind<span className="text-sky-500">AI</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-xs uppercase font-bold tracking-widest ml-6">
              <a href="/" className="text-sky-400 border-b-2 border-sky-500 pb-1 px-1">Asset Evaluator</a>
              <a href="/cre-agent" className="text-slate-400 hover:text-sky-400 transition-colors pb-1 px-1 flex items-center gap-1">
                CRE AI Agent
                <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold">NEW</span>
              </a>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            {user ? (
               <div className="flex items-center gap-4">
                  <span className="text-white font-bold tracking-widest uppercase text-[10px]">
                     Balance: <span className="text-sky-400">{user.credits} Credits</span>
                  </span>
                  <button onClick={() => setShowGlobalAuth(true)} className="text-[10px] font-bold text-sky-400 border border-sky-400/30 px-3 py-1 rounded-md hover:bg-sky-500/10 transition-colors uppercase tracking-widest">
                      Buy More
                  </button>
                  <button onClick={logout} className="text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-red-400 transition-colors">
                      Logout
                  </button>
               </div>
            ) : (
                <button onClick={() => setShowGlobalAuth(true)} className="px-5 py-2 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20 text-xs tracking-widest uppercase">
                  Sign In / Top Up
                </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold uppercase tracking-wider"
        >
          <Zap className="w-3 h-3" /> Powered by AI Decision Engine
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl md:text-7xl font-extrabold text-white tracking-tight"
        >
          Smart Property <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">Intelligence.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl text-lg text-slate-400 leading-relaxed"
        >
          Evaluate real estate assets using multi-dimensional signals including pricing trends,
          livability metrics, environmental risks, and local connectivity.
        </motion.p>
      </div>

      {/* Features & Tech Stack Section */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-md hover:bg-slate-800/60 hover:border-sky-500/40 transition-all duration-300 group shadow-lg shadow-black/20"
          >
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-sky-500/20 transition-all duration-300">
              <BrainCircuit className="w-7 h-7 text-sky-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              Gemini AI Powered
              <Sparkles className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              Leveraging advanced <span className="text-sky-300">Google Gemini LLMs</span> in the backend for deep multi-dimensional reasoning and automated property valuation.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-md hover:bg-slate-800/60 hover:border-emerald-500/40 transition-all duration-300 group shadow-lg shadow-black/20"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Safety Intelligence</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              Exclusive <span className="text-emerald-300">"Peace of Mind" engine</span> evaluating local police sentiment via <b>Google Places API</b> and analyzing real-time neighborhood crime data using <b>NewsData.io</b>.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-md hover:bg-slate-800/60 hover:border-purple-500/40 transition-all duration-300 group shadow-lg shadow-black/20"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300">
              <TrendingUp className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Market Precision</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              Data-driven insights into hyper-local pricing trends and <span className="text-purple-300">investment potential</span> tailored to you, powered by <b>Gemini Search Grounding</b>.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-md hover:bg-slate-800/60 hover:border-indigo-500/40 transition-all duration-300 group shadow-lg shadow-black/20"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
              <Building2 className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Holistic Evaluation</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              Comprehensive scoring integrating environmental risks via <b>WAQI (World Air Quality Index)</b> and connectivity/infrastructure via <b>Google Maps APIs</b>.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-12 pb-24">
        <PropertyForm onSubmit={handleEvaluate} loading={loading} />

        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="py-12"
            >
              <SearchLoading />
            </motion.div>
          )}

          {error && !loading && (
            <motion.div
              key="error-state"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-2xl mx-auto p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center"
            >
              {error}
            </motion.div>
          )}

          {result && !loading && (
            <motion.div
              key="result-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <ResultView data={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-sky-500/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -z-10" />

      <AuthModal 
        isOpen={showGlobalAuth} 
        onClose={() => setShowGlobalAuth(false)} 
        onSuccess={() => setShowGlobalAuth(false)} 
      />
    </main>
  )
}
