"use client"

import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card"
import { ScoreGauge } from "./ScoreGauge"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/AuthContext"
import { AuthModal } from "./AuthModal"
import {
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Info,
    Wind,
    Car,
    GraduationCap,
    Hospital,
    Waves,
    Tag,
    Building2,
    ShieldCheck,
    ChevronDown,
    ChevronUp,
    TrendingUp,
    ArrowRight,
    Zap,
    MapPin,
    Target
} from "lucide-react"
import { cn, BACKEND_URL } from "@/lib/utils"
import { PropertyChat } from "./PropertyChat"

const formatValue = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`
    return `₹${val.toLocaleString()}`
}

interface SignalDetails {
    [key: string]: string | number | boolean | string[] | undefined | null;
}

interface Signal {
    score?: number;
    summary: string;
    details?: SignalDetails;
    [key: string]: any;
}

interface BuyerProfile {
    suitable_for?: string[];
    not_suitable_for?: string[];
}

interface AnalysisResult {
    numeric_score?: number;
    confidence?: number;
    decision: string;
    recommendation: string;
    summary: string;
    region?: {
        label: string;
        tier: string;
    };
    address?: string;
    end_use_assumed?: string;
    positive_factors?: string[];
    buy_conditions?: string[];
    primary_risks?: string[];
    buyer_profile?: BuyerProfile;
    signals?: {
        [key: string]: Signal;
    };
    [key: string]: any;
}

interface ResultViewProps {
    data: AnalysisResult
}

export function ResultView({ data }: ResultViewProps) {
    const [showRaw, setShowRaw] = useState(false)
    const { user, token, refreshUser } = useAuth()
    const [isUnlocked, setIsUnlocked] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [unlocking, setUnlocking] = useState(false)

    if (!data) return null

    const handleUnlock = async () => {
        if (!user || user.credits <= 0) {
            setShowAuthModal(true)
            return
        }
        
        setUnlocking(true)
        try {
            const res = await fetch(`${BACKEND_URL}/consume-credit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token })
            })
            if (res.ok) {
                await refreshUser()
                setIsUnlocked(true)
            } else {
                setShowAuthModal(true)
            }
        } catch(e) {
            console.error(e)
            setShowAuthModal(true)
        }
        setUnlocking(false)
    }

    const getDecisionIcon = (decision: string) => {
        switch (decision) {
            case "BUY": return <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            case "CAUTION": return <AlertTriangle className="w-8 h-8 text-amber-400" />
            case "AVOID": return <XCircle className="w-8 h-8 text-red-400" />
            default: return <Info className="w-8 h-8 text-sky-400" />
        }
    }

    const getDecisionColor = (decision: string) => {
        switch (decision) {
            case "BUY": return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
            case "CAUTION": return "text-amber-400 border-amber-500/30 bg-amber-500/10"
            case "AVOID": return "text-red-400 border-red-500/30 bg-red-500/10"
            default: return "text-sky-400 border-sky-500/30 bg-sky-500/10"
        }
    }

    const formatDetailValue = (key: string, value: any): string => {
        if (value === null || value === undefined) return "N/A"
        if (typeof value === "boolean") return value ? "Yes" : "No"
        if (Array.isArray(value)) return value.join(", ")
        if (typeof value === "number") {
            const keyLower = key.toLowerCase();
            if (keyLower === 'elevation') return `${value} m`;
            if (keyLower.includes('distance') && !keyLower.includes('km')) return `${value} km`;
            if (keyLower.includes('duration') && !keyLower.includes('min')) return `${value} mins`;
            return value.toLocaleString('en-IN');
        }
        return String(value)
    }

    const formatDetailKey = (key: string): string => {
        return key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    }

    // Risk Categorization Heuristic
    const isRent = data.end_use_assumed === "rent" || data.intent === "rent"

    const criticalRisks = data.primary_risks?.filter(risk =>
        /hospital|medical|emergency|critical|danger|illegal/.test(risk.toLowerCase())
    ) || []

    const moderateRisks = data.primary_risks?.filter(risk =>
        !/hospital|medical|emergency|critical|danger|illegal/.test(risk.toLowerCase())
    ) || []

    const SignalItem = ({ title, score, summary, icon: Icon, details, formatValue, isRent }: any) => (
        <motion.div
            whileHover={{ y: -5 }}
            className="p-5 rounded-2xl glass-dark border border-slate-800/50 space-y-3 transition-all hover:border-sky-500/30"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-100 font-semibold">
                    <div className="p-2 rounded-lg bg-slate-800/50">
                        <Icon className="w-4 h-4 text-sky-400" />
                    </div>
                    <span className="text-sm">{title}</span>
                </div>
                {score !== undefined && score !== null && (
                    <div className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-tighter",
                        score >= 0.7 ? "bg-emerald-500/20 text-emerald-400" :
                            score >= 0.5 ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                    )}>
                        {Math.round(score * 100)}%
                    </div>
                )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed min-h-[40px]">{summary}</p>

            <AnimatePresence>
                {details && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 pt-3 border-t border-slate-700/50 space-y-3"
                    >
                        {/* Special handling for nearby hospitals/schools lists */}
                        {(details.nearby_hospitals || details.nearby_schools) ? (
                            <div className="space-y-2">
                                {(details.nearby_hospitals || details.nearby_schools).map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center text-[10px] bg-slate-900/40 p-2 rounded-lg border border-white/5">
                                        <div className="flex flex-col max-w-[70%]">
                                            <span className="text-slate-200 font-bold truncate">{item.name}</span>
                                            {item.address && <span className="text-slate-500 truncate">{item.address}</span>}
                                        </div>
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className="text-sky-400 font-black">{item.duration_min}m</span>
                                            <span className="text-slate-500 text-[8px]">{item.distance_km}km</span>
                                        </div>
                                    </div>
                                ))}
                                {details.traffic_applied && (
                                    <div className="pt-1 flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">Live Traffic Active</span>
                                    </div>
                                )}
                                {details.is_live_research && (
                                    <div className="pt-2 flex flex-col gap-2">
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 w-fit">
                                            <div className="w-1 h-1 rounded-full bg-sky-400 animate-ping" />
                                            <span className="text-[8px] text-sky-400 font-black uppercase tracking-widest">Real-time Web Search Results</span>
                                        </div>
                                        {details.citations && Array.isArray(details.citations) && details.citations.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {details.citations.slice(0, 3).map((cite: string, i: number) => (
                                                    <span key={i} className="text-[7px] text-slate-600 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 truncate max-w-[100px]">
                                                        {cite.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            Object.entries(details)
                                .filter(([key]) => !['benchmarks', 'citations', 'is_live_research', 'traffic_applied'].includes(key))
                                .map(([key, value]) => {
                                    if (value === null || value === undefined) return null;

                                    const isAmount = ['price', 'avg', 'rate', 'cost', 'fee', 'rent', 'budget'].some(k => key.toLowerCase().includes(k));
                                    const displayValue = typeof value === 'object' && value !== null
                                        ? JSON.stringify(value) // Convert objects to string for display
                                        : (isAmount && typeof value === 'number' ? formatValue(value as number) : formatDetailValue(key, value));

                                    return (
                                        <div key={key} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">
                                                {key === 'local_avg' ? (isRent ? 'Typical Rent' : 'Typical Price') : formatDetailKey(key)}
                                            </span>
                                            <span className="text-xs text-white font-medium">
                                                {displayValue}
                                            </span>
                                        </div>
                                    )
                                })
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl mx-auto space-y-10 pb-20 px-4"
        >
            {/* Primary Result Section */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative glass-dark rounded-[2rem] border border-white/5 overflow-hidden">
                    <div className="p-8 md:p-12 space-y-10">
                        <div className="flex flex-col lg:flex-row gap-12 items-start">
                            {/* Left Col: Decision & Rec */}
                            <div className="flex-1 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-5 py-2 rounded-full border text-sm font-bold tracking-wider shadow-inner",
                                            getDecisionColor(data.decision)
                                        )}>
                                            {getDecisionIcon(data.decision)}
                                            {data.decision}
                                        </div>
                                        {data.region && (
                                            <span className="px-4 py-2 rounded-full bg-slate-800/80 text-slate-400 text-[10px] uppercase tracking-widest border border-slate-700 font-bold">
                                                {data.region.label} • {data.region.tier}
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                                        Investment Verdict
                                    </h1>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-4 top-0 bottom-0 w-1.5 bg-sky-500 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
                                    <p className="text-xl md:text-2xl text-slate-200 leading-relaxed font-medium pl-6">
                                        "{data.recommendation}"
                                    </p>
                                </div>

                                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-sm text-slate-400 leading-relaxed italic">
                                    {data.summary}
                                </div>
                            </div>

                            {/* Right Col: Score Gauge */}
                            <div className="flex flex-col items-center justify-center p-8 glass border border-white/10 rounded-3xl min-w-[300px] shadow-2xl relative overflow-hidden group/gauge">
                                <div className="absolute inset-0 bg-sky-500/5 opacity-0 group-hover/gauge:opacity-100 transition-opacity duration-500" />
                                <ScoreGauge score={data.numeric_score || 0} label="Decision Strength" />
                                <div className="space-y-4 mt-6 w-full text-center">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">
                                        Safe Zone Analysis
                                    </p>
                                    {data.confidence !== undefined && (
                                        <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-bold text-sky-400 shadow-xl">
                                            <ShieldCheck className="w-4 h-4" />
                                            Confidence: {Math.round(data.confidence * 100)}%
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {!isUnlocked && (
                <div className="relative z-20 flex flex-col items-center justify-center -mt-8 mb-8">
                    <div className="p-8 rounded-3xl glass-dark border border-sky-500/30 text-center shadow-[0_0_50px_rgba(14,165,233,0.15)] glow-effect max-w-xl mx-auto backdrop-blur-md">
                        <ShieldCheck className="w-12 h-12 text-sky-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-black text-white mb-2">Detailed Diligence Locked</h3>
                        <p className="text-slate-400 text-sm mb-6">Unlock deep technical signals, exact pricing benchmarks, live web research citations, and risk-mitigation Chat API.</p>
                        <button 
                            onClick={handleUnlock}
                            disabled={unlocking}
                            className="bg-sky-500 hover:bg-sky-400 px-8 py-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-sky-500/20 transition-all w-full flex items-center justify-center gap-2"
                        >
                            {unlocking ? "Processing..." : user && user.credits > 0 ? "Unlock Report (1 Credit)" : "Unlock Full Report"}
                        </button>
                        {user && (
                            <p className="text-[10px] uppercase font-bold text-slate-500 mt-4 tracking-widest">
                                Available Credits: {user.credits}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Performance Indicators Grid */}
            <div className={`transition-all duration-1000 ${isUnlocked ? 'opacity-100' : 'opacity-[0.03] blur-lg pointer-events-none select-none'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="glass-dark border-white/5 transition-all hover:border-sky-500/30">
                    <CardContent className="p-6 space-y-2">
                        <TrendingUp className="w-5 h-5 text-sky-400 mb-2" />
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Entry Price</p>
                        <p className="text-2xl font-black text-white">
                            {typeof data.signals?.pricing?.details?.input_price === 'number'
                                ? formatValue(data.signals.pricing.details.input_price)
                                : 'N/A'}
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-dark border-white/5 transition-all hover:border-emerald-500/30">
                    <CardContent className="p-6 space-y-2">
                        <Target className="w-5 h-5 text-emerald-400 mb-2" />
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Recommended Cap</p>
                        <p className="text-2xl font-black text-emerald-400">
                            {typeof data.signals?.pricing?.details?.recommended_band === 'number'
                                ? formatValue(data.signals.pricing.details.recommended_band)
                                : typeof data.signals?.pricing?.details?.recommended_band === 'object' && data.signals.pricing.details.recommended_band !== null
                                    ? `${formatValue(data.signals.pricing.details.recommended_band.low)} - ${formatValue(data.signals.pricing.details.recommended_band.high)}`
                                    : (data.signals?.pricing?.details?.recommended_band || 'N/A')}
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-dark border-white/5 transition-all hover:border-amber-500/30">
                    <CardContent className="p-6 space-y-2">
                        <Zap className="w-5 h-5 text-amber-400 mb-2" />
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Analysis Mode</p>
                        <p className="text-2xl font-black text-white capitalize">
                            {data.intent || data.end_use_assumed?.replace('_', ' ') || 'Both'}
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-dark border-white/5 transition-all hover:border-indigo-500/30">
                    <CardContent className="p-6 space-y-2">
                        <MapPin className="w-5 h-5 text-indigo-400 mb-2" />
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Region Tier</p>
                        <p className="text-2xl font-black text-white capitalize">
                            {data.region?.tier?.replace('_', ' ') || 'N/A'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Risk & Anomaly Warnings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Market Anomaly (Conditional) */}
                {data.region?.tier === "tier_1" && data.signals?.pricing?.details?.pricing_basis === "no_comparables" && (
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="lg:col-span-2">
                        <div className="p-8 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-10">
                                <AlertTriangle className="w-32 h-32 text-amber-500" />
                            </div>
                            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                                <div className="p-6 rounded-[2rem] bg-amber-500/20 text-amber-500 shrink-0">
                                    <AlertTriangle className="w-12 h-12" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black text-amber-500">Market Anomaly Detected</h3>
                                    <p className="text-slate-300 leading-relaxed max-w-2xl">
                                        In Tier-1 locations, absence of recent comparable transactions is highly atypical and often indicates underlying legal or access complexities.
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        {['Legal Scrutiny Required', 'Road Width Proof', 'Land Approval Check'].map((t) => (
                                            <span key={t} className="px-4 py-1.5 rounded-full bg-slate-900/50 text-amber-500/80 text-[10px] font-black uppercase tracking-widest border border-amber-500/10">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Critical Risks */}
                {criticalRisks.length > 0 && (
                    <div className="p-8 rounded-[2rem] bg-red-500/5 border border-red-500/20 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500 text-white">
                                <XCircle className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Deal-Breaker Risks</h3>
                        </div>
                        <ul className="space-y-4">
                            {criticalRisks.map((risk, i) => (
                                <li key={i} className="flex items-start gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/10 text-sm text-slate-200">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0 animate-pulse" />
                                    {risk}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Negotiable Risks */}
                {moderateRisks.length > 0 && (
                    <div className="p-8 rounded-[2rem] bg-amber-500/5 border border-amber-500/20 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500 text-slate-950">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Negotiable Risks</h3>
                        </div>
                        <ul className="space-y-4">
                            {moderateRisks.map((risk, i) => (
                                <li key={i} className="flex items-start gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/10 text-sm text-slate-200">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                                    {risk}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Deep Analysis Signals */}
            <div className="space-y-8">
                <div className="space-y-2 text-center">
                    <h2 className="text-3xl font-black text-white tracking-tight">Signal Analysis</h2>
                    <p className="text-slate-500 text-sm max-w-xl mx-auto">
                        Granular logic-gated scoring for environmental, social, and economic indicators.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.signals?.pricing && (
                        <SignalItem
                            title="Pricing Intelligence"
                            score={data.signals.pricing.score}
                            summary={data.signals.pricing.summary}
                            icon={Tag}
                            details={data.signals.pricing.details}
                            formatValue={formatValue}
                            isRent={isRent}
                        />
                    )}
                    {data.signals?.road_access && (
                        <SignalItem
                            title="Infrastructure Access"
                            score={data.signals.road_access.score}
                            summary={data.signals.road_access.summary}
                            icon={Car}
                            details={data.signals.road_access.details}
                            formatValue={formatValue}
                            isRent={isRent}
                        />
                    )}
                    {data.signals?.flood_risk && (
                        <SignalItem
                            title="Environmental Safety"
                            score={data.signals.flood_risk.score}
                            summary={data.signals.flood_risk.summary}
                            icon={Waves}
                            details={data.signals.flood_risk.details}
                            formatValue={formatValue}
                            isRent={isRent}
                        />
                    )}
                    {data.signals?.crime_safety && (
                        <SignalItem
                            title="Safety & Law Enforcement"
                            score={data.signals.crime_safety.score}
                            summary={data.signals.crime_safety.summary}
                            icon={ShieldCheck}
                            details={data.signals.crime_safety.details}
                            formatValue={formatValue}
                            isRent={isRent}
                        />
                    )}
                    {data.signals?.air_quality && (
                        <SignalItem
                            title="Pollution Index"
                            score={data.signals.air_quality.score}
                            summary={data.signals.air_quality.summary}
                            icon={Wind}
                            details={data.signals.air_quality.details}
                            formatValue={formatValue}
                            isRent={isRent}
                        />
                    )}
                    {data.signals?.hospital_access && (
                        <SignalItem
                            title="Medical Proximity"
                            score={data.signals.hospital_access.score}
                            summary={data.signals.hospital_access.summary}
                            icon={Hospital}
                            details={data.signals.hospital_access.details}
                            formatValue={formatValue}
                            isRent={isRent}
                        />
                    )}
                    {data.signals?.school_access && (
                        <SignalItem
                            title="Edu Ecosystem"
                            score={data.signals.school_access.score}
                            summary={data.signals.school_access.summary}
                            icon={GraduationCap}
                            details={data.signals.school_access.details}
                            formatValue={formatValue}
                            isRent={isRent}
                        />
                    )}
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={() => setShowRaw(!showRaw)}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl border border-white/5 glass-dark text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all hover:text-white hover:border-white/10"
                    >
                        {showRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {showRaw ? "Collapse Full Data" : "Inspect Raw Signals"}
                    </button>
                </div>
            </div>

            {/* Bottom: Recommendations & AI Chat */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Favor vs Conditions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="glass-dark border-white/5 rounded-[2rem]">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-3 text-emerald-400">
                                    <CheckCircle2 className="w-5 h-5" /> Positive Drivers
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-4">
                                    {data.positive_factors?.map((factor: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                            {factor}
                                        </li>
                                    )) || <p className="text-sm text-slate-500">None identified.</p>}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="glass-dark border-white/5 rounded-[2rem]">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-3 text-amber-400">
                                    <Zap className="w-5 h-5" /> Deal Safeguards
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-4">
                                    {data.buy_conditions?.map((condition: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                                            {condition}
                                        </li>
                                    )) || <p className="text-sm text-slate-500">No specific conditions.</p>}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Final Bottom Line */}
                    <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-indigo-950 border border-white/10 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-12 opacity-5">
                            <Building2 className="w-48 h-48 text-white" />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-sky-500 shadow-lg shadow-sky-500/20">
                                    <TrendingUp className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Bottom Line</h3>
                            </div>

                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                <p className="text-lg font-bold text-white flex items-center gap-2">
                                    Verdict: <span className={cn("px-3 py-1 rounded-lg", getDecisionColor(data.decision))}>{data.decision}</span>
                                </p>
                                <p className="text-slate-300 leading-relaxed text-sm">
                                    {data.summary}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
                                <div>
                                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-5">Primary Target Hub</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {data.buyer_profile?.suitable_for?.map((p: string, i: number) => (
                                            <span key={i} className="px-4 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 text-[10px] font-black">
                                                {p}
                                            </span>
                                        )) || <span className="text-slate-500 text-xs">No specific recommendations.</span>}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-5">Strategic Exclusion</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {data.buyer_profile?.not_suitable_for?.map((p: string, i: number) => (
                                            <span key={i} className="px-4 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/10 text-[10px] font-black">
                                                {p}
                                            </span>
                                        )) || <span className="text-slate-500 text-xs">No specific warnings.</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Property Chat */}
                <div className="lg:col-span-1">
                    <div className="sticky top-8">
                        <PropertyChat evaluationData={data} />
                    </div>
                </div>
            </div>
            </div>

            <AuthModal 
                isOpen={showAuthModal} 
                onClose={() => setShowAuthModal(false)} 
                onSuccess={async () => {
                    setShowAuthModal(false)
                    setUnlocking(true)
                    try {
                        const tokenStr = localStorage.getItem("auth_token") || token;
                        const res = await fetch(`${BACKEND_URL}/consume-credit`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ token: tokenStr })
                        })
                        if (res.ok) {
                            await refreshUser()
                            setIsUnlocked(true)
                        } else {
                            setShowAuthModal(true)
                        }
                    } catch(e) {
                        console.error(e)
                    }
                    setUnlocking(false)
                }}
            />

            <div className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] pt-10">
                End of Report • Generative Intelligence Verification ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
            </div>
        </motion.div>
    )
}
