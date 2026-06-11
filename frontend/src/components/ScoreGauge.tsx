"use client"

import React from "react"
import { motion } from "framer-motion"

interface ScoreGaugeProps {
    score: number // 0 to 1
    label: string
}

export function ScoreGauge({ score, label }: ScoreGaugeProps) {
    const percentage = score * 100
    const color = score >= 0.7 ? "#10b981" : score >= 0.5 ? "#f59e0b" : "#ef4444"

    return (
        <div className="relative flex flex-col items-center justify-center">
            <svg className="w-48 h-48 transform -rotate-90">
                <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-slate-800"
                />
                <motion.circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke={color}
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 80}
                    initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - score) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-4xl font-bold text-white"
                >
                    {Math.round(percentage)}
                </motion.span>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
            </div>
        </div>
    )
}
