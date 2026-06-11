import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Zap, Search, Database, ShieldCheck, Map, Activity, CheckCircle2 } from "lucide-react"

const loadingSteps = [
  { text: "Resolving location and analyzing region tier...", icon: Map },
  { text: "Gathering live market comparisons and benchmarks...", icon: Search },
  { text: "Calculating livability: Air Quality, Hospitals & Schools...", icon: Activity },
  { text: "Assessing environmental factors and flood risk...", icon: ShieldCheck },
  { text: "Evaluating road access and commute stress...", icon: Database },
  { text: "AI Reasoner structuring final recommendation...", icon: Zap }
]

export function SearchLoading() {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Total estimated time: ~15 seconds
    const stepDuration = 2500 // 2.5s per step
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < loadingSteps.length - 1) return prev + 1
        return prev
      })
    }, stepDuration)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95 // Hold at 95% until complete
        // asymptotic approach to 95
        const increment = (95 - prev) * 0.05
        return prev + increment
      })
    }, 100)

    return () => {
      clearInterval(interval)
      clearInterval(progressInterval)
    }
  }, [])

  const ActiveIcon = loadingSteps[currentStep].icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-2xl mx-auto p-8 rounded-2xl bg-slate-900/80 border border-slate-700/50 shadow-xl backdrop-blur-xl relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-sky-500/10 blur-[50px] pointer-events-none" />

      <div className="relative flex flex-col items-center justify-center space-y-8 text-center">
        {/* Spinner & Active Icon */}
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 rounded-full border-2 border-slate-700 border-t-sky-500 border-r-sky-500/30"
          />
          <div className="absolute inset-0 flex items-center justify-center text-sky-400">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                transition={{ duration: 0.3 }}
              >
                <ActiveIcon className="w-8 h-8" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-4 w-full">
          <div className="flex items-center justify-center gap-2 text-slate-300 font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-emerald-400 font-semibold tracking-wide uppercase text-sm">
              AI Agent Active
            </span>
          </div>
          
          <div className="h-8 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-slate-100 text-lg sm:text-xl font-medium"
              >
                {loadingSteps[currentStep].text}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-medium px-1">
            <span>Analyzing multi-dimensional signals</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.1 }}
            />
          </div>
        </div>

        {/* Steps List (Subtle contextual UI) */}
        <div className="w-full pt-6 mt-4 border-t border-slate-800/50 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {loadingSteps.map((step, idx) => {
            const isCompleted = idx < currentStep
            const isActive = idx === currentStep
            const isPending = idx > currentStep

            return (
              <div 
                key={idx} 
                className={`flex items-center gap-2 text-xs transition-colors duration-300 ${
                  isCompleted ? "text-emerald-400" : isActive ? "text-sky-400" : "text-slate-600"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <div className={`w-3.5 h-3.5 rounded-full border ${isActive ? 'border-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)] bg-sky-400/20' : 'border-slate-700'}`} />
                )}
                <span className="truncate">{step.text.split(':')[0]}</span>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
