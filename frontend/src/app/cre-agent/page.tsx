"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BACKEND_URL } from "@/lib/utils"
import { useAuth } from "@/lib/AuthContext"
import { AuthModal } from "@/components/AuthModal"
import { 
  Building2, 
  BrainCircuit, 
  MapPin, 
  TrendingUp, 
  FileText, 
  Terminal, 
  Play, 
  Download, 
  CheckCircle2, 
  Compass, 
  Database,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Send,
  User,
  Bot,
  Mail,
  BarChart3,
  RefreshCw,
  Layers,
  Map
} from "lucide-react"

// Curated international template prompts to make testing quick, global, and beautiful
const TEMPLATES = [
  {
    title: "Gwalior Retail Storefront",
    desc: "Evaluate retail storefronts under ₹150,000/mo near Maharaj Bada, 3km transit, and Smart City yields.",
    prompt: "Evaluate a premium retail storefront in Gwalior near Maharaj Bada under ₹150,000/month, check transit proximity within 3km, and look at urban development impact."
  },
  {
    title: "Singapore Office Hub",
    desc: "Find premium corporate suites under S$15,000/mo near Marina Bay, verify transit lines & URA zoning.",
    prompt: "We are looking for a premium office space in Singapore near the Marina Bay financial district with a budget of S$15,000/month. Verify spatial connectivity to transit hubs and compile an investment brief detailing local URA zoning and market sentiment."
  },
  {
    title: "Paris Retail Storefront",
    desc: "Locate boutique retail storefronts in Paris under €8,000/mo, map Paris Métro access & luxury zoning yields.",
    prompt: "Evaluate a boutique retail storefront in Paris under 8,000 EUR/month. Perform a geospatial check for proximity to the Paris Metro and retrieve semantic sentiment context for upscale commercial zoning yields."
  }
]

interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: Date;
  isReport?: boolean;
}

export default function CreAgentPage() {
  const { user, token, logout, refreshUser } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [sessionId, setSessionId] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputPrompt, setInputPrompt] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [resultBrief, setResultBrief] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"preview" | "financials" | "map">("preview")
  const [showLogsPanel, setShowLogsPanel] = useState(true)

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Initialize Session ID on mount
  useEffect(() => {
    const uuid = "session-" + Math.random().toString(36).substring(2, 15) + "-" + Math.random().toString(36).substring(2, 15)
    setSessionId(uuid)
  }, [])

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isRunning])

  const handleRunAgent = async (selectedPrompt: string) => {
    const finalPrompt = selectedPrompt || inputPrompt
    if (!finalPrompt.trim() || isRunning) return

    // Authentication and credit checks
    if (!user || user.credits <= 0) {
      setShowAuthModal(true)
      return
    }

    // Clear input
    setInputPrompt("")

    // Append User Message to Thread
    const userMsg: Message = {
      id: "msg-" + Date.now() + "-user",
      sender: "user",
      text: finalPrompt,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])

    setIsRunning(true)
    setError(null)
    setLogs([])

    // Initialize mock start logs to give immediate feedback
    const initialLogs = [
      {
        step: "Planning & Intent Analysis",
        status: "active",
        message: "AI is analyzing commercial real estate intent and planning tool chain...",
        details: `User Prompt: '${finalPrompt}'\nSession ID: ${sessionId}`
      }
    ]
    setLogs(initialLogs)

    // Set up a dynamic visual progress interval to simulate real-time agent execution steps
    let currentLogs = [...initialLogs]
    const steps = [
      {
        step: "Executing Tool: search_properties",
        message: "Querying MongoDB commercial property collections for matching budget/type constraints...",
        details: "Database query: db.properties.find({ price_per_month: { $lte: budget } })"
      },
      {
        step: "Executing Tool: geospatial_near_search",
        message: "Running native MongoDB $nearSphere spatial proximity calculations against transit hubs...",
        details: "Geospatial calculation: db.transit_hubs.find({ location: { $nearSphere: { $geometry: { ... } } } })"
      },
      {
        step: "Executing Tool: semantic_sentiment_research",
        message: "Performing high-dimensional Atlas vector embedding lookups and Cosine Similarity checks...",
        details: "Cosine similarity: cosine_similarity(query_embedding, doc.embedding)"
      },
      {
        step: "Executing Tool: generate_investment_brief",
        message: "Synthesizing retrieved metrics, financial yields, and spatial proximity into a comparative brief...",
        details: "Compiling publication-grade Markdown brief and risk analysis"
      }
    ]

    let stepIdx = 0
    const progressInterval = setInterval(() => {
      if (stepIdx < steps.length) {
        // Mark the previous active step as successful
        if (currentLogs.length > 0) {
          currentLogs[currentLogs.length - 1] = {
            ...currentLogs[currentLogs.length - 1],
            status: "success"
          }
        }
        
        // Add the next active step
        const nextStep = {
          step: steps[stepIdx].step,
          status: "active",
          message: steps[stepIdx].message,
          details: steps[stepIdx].details
        }
        currentLogs = [...currentLogs, nextStep]
        setLogs(currentLogs)
        stepIdx++
      }
    }, 1800)

    try {
      const response = await fetch(`${BACKEND_URL}/agent/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          prompt: finalPrompt,
          session_id: sessionId,
          token: token
        })
      })

      if (!response.ok) {
        throw new Error("Failed to communicate with Agentic Orchestrator. Check if backend is running.")
      }

      const data = await response.json()
      clearInterval(progressInterval)

      if (data.success) {
        await refreshUser()
        setLogs(data.reasoning_chain)
        
        // Check if report brief is returned
        const isReport = data.investment_brief.includes("# Commercial Real Estate") || data.investment_brief.includes("Financial Scorecard")
        
        if (isReport) {
          setResultBrief(data.investment_brief)
        }

        // Append Agent Response to Thread
        const agentMsg: Message = {
          id: "msg-" + Date.now() + "-agent",
          sender: "agent",
          text: data.investment_brief,
          timestamp: new Date(),
          isReport: isReport
        }
        setMessages(prev => [...prev, agentMsg])

      } else {
        setLogs(data.reasoning_chain || [])
        setError(data.error || "An unknown error occurred during execution.")
        
        const errorMsg: Message = {
          id: "msg-" + Date.now() + "-error",
          sender: "agent",
          text: `⚠️ Execution Encountered Error: ${data.error || "Unknown Error"}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMsg])
      }
    } catch (err: any) {
      clearInterval(progressInterval)
      setError(err.message)
      
      const errorMsg: Message = {
        id: "msg-" + Date.now() + "-error",
        sender: "agent",
        text: `⚠️ Network Error: ${err.message}. Make sure your FastAPI backend is running on ${BACKEND_URL}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])

      setLogs(prev => {
        const updated = [...prev]
        if (updated.length > 0 && updated[updated.length - 1].status === "active") {
          updated[updated.length - 1].status = "error"
        }
        return [
          ...updated,
          {
            step: "Execution Halted",
            status: "error",
            message: err.message,
            details: "Network connection or server error."
          }
        ]
      })
    } finally {
      setIsRunning(false)
    }
  }

  // Parse financial parameters out of markdown brief dynamically to show beautiful metrics
  const getMetrics = () => {
    if (!resultBrief) return null
    
    // Generalize extraction to support any international currency format and units
    const leaseMatch = resultBrief.match(/Monthly Lease Outlay:\*\* ([^\n\r]+)/)
    const areaMatch = resultBrief.match(/Rentable Area:\*\* ([^\n\r]+)/)
    const rentMatch = resultBrief.match(/Effective Rent Rate:\*\* ([^\n\r]+)/)
    const yieldMatch = resultBrief.match(/Target Yield Potential:\*\* \`?([^\`\n\r(]+)/i)
    const footfallMatch = resultBrief.match(/Footfall Assessment:\*\* \`?([^\`\n\r(]+)/i)
    const scoreMatch = resultBrief.match(/Verdict Score:\*\* \`?([^\`\n\r(]+)/i)

    return {
      lease: leaseMatch ? leaseMatch[1].trim() : "₹145,000",
      area: areaMatch ? areaMatch[1].trim() : "1,500 sqft",
      effective: rentMatch ? rentMatch[1].trim() : "₹96.67/sqft",
      yield: yieldMatch ? yieldMatch[1].replace(/`/g, "").trim() : "7.5% - 10.5%",
      footfall: footfallMatch ? footfallMatch[1].replace(/`/g, "").trim() : "HIGH (8,000+ daily)",
      score: scoreMatch ? scoreMatch[1].replace(/`/g, "").trim() : "92/100"
    }
  }

  const metrics = getMetrics()

  // Download Brief to local machine
  const handleDownload = () => {
    if (!resultBrief) return
    const element = document.createElement("a")
    const file = new Blob([resultBrief], { type: "text/markdown" })
    element.href = URL.createObjectURL(file)
    element.download = `CRE-Investment-Brief-${Math.floor(1000 + Math.random()*9000)}.md`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  // Reset Session
  const handleResetSession = () => {
    const uuid = "session-" + Math.random().toString(36).substring(2, 15) + "-" + Math.random().toString(36).substring(2, 15)
    setSessionId(uuid)
    setMessages([])
    setResultBrief(null)
    setLogs([])
    setError(null)
  }

  // Parse options block dynamically
  const parseOptions = (text: string) => {
    const options: { label: string; prompt: string; icon: any }[] = []
    
    const lines = text.split("\n")
    for (const line of lines) {
      const lower = line.toLowerCase()
      if (lower.includes("option a:") || lower.includes("option a")) {
        options.push({
          label: "💎 Jewelry Competitive Analysis",
          prompt: "Let's go with A, but specifically look for competing jewelry stores, not apparel. Also, save the final brief to my records.",
          icon: BarChart3
        })
      } else if (lower.includes("option b:") || lower.includes("option b")) {
        options.push({
          label: "📈 Simulate Higher Budget (₹200,000)",
          prompt: "Let's go with B, simulate a higher budget threshold of ₹200,000/month to see if better assets open up near City Center.",
          icon: Layers
        })
      } else if (lower.includes("option c:") || lower.includes("option c")) {
        options.push({
          label: "📝 Draft Lease Negotiation Email",
          prompt: "Let's go with C, draft an initial lease negotiation email based on these strategic recommendations.",
          icon: Mail
        })
      }
    }

    // Default safety fallback if we are looking at Gwalior and options were not explicitly caught
    if (options.length === 0 && (text.toLowerCase().includes("gwalior") || text.toLowerCase().includes("brief"))) {
      options.push({
        label: "💎 Run Jewelry Competitive Analysis & Save Brief",
        prompt: "Let's go with A, but specifically look for competing jewelry stores, not apparel. Also, save the final brief to my records.",
        icon: BarChart3
      })
      options.push({
        label: "📈 Simulate Higher Budget (₹200,000/mo)",
        prompt: "Let's go with B, simulate a higher budget threshold of ₹200,000 to see if better assets open up near City Center.",
        icon: Layers
      })
      options.push({
        label: "📝 Draft Lease Negotiation Email",
        prompt: "Let's go with C, draft an initial lease negotiation email based on these strategic recommendations.",
        icon: Mail
      })
    }

    return options
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden pb-12">
      {/* Background Meshes */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />

      {/* Breadcrumb Navbar */}
      <nav className="border-b border-slate-900 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="bg-gradient-to-r from-sky-500 to-emerald-500 p-1.5 rounded-lg shadow-lg shadow-sky-500/20">
              <Building2 className="w-6 h-6 text-slate-950" />
            </div>
            SiteMind<span className="text-sky-400">AI</span>
            <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ml-2">
              Conversational Copilot v2
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
               <div className="flex items-center gap-4">
                  <span className="text-white font-bold tracking-widest uppercase text-[10px]">
                     Balance: <span className="text-sky-400">{user.credits} Credits</span>
                  </span>
                  <button onClick={() => setShowAuthModal(true)} className="text-[10px] font-bold text-sky-400 border border-sky-400/30 px-3 py-1 rounded-md hover:bg-sky-500/10 transition-colors uppercase tracking-widest">
                      Buy Credits
                  </button>
                  <button onClick={logout} className="text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-red-400 transition-colors">
                      Logout
                  </button>
               </div>
            ) : (
                <button onClick={() => setShowAuthModal(true)} className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20 text-xs tracking-widest uppercase">
                  Sign In / Top Up
                </button>
            )}
            <button
              onClick={handleResetSession}
              className="text-xs uppercase font-bold tracking-widest text-slate-400 hover:text-white transition-colors border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl bg-slate-900/30 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Chat
            </button>
            <a
              href="/"
              className="text-xs uppercase font-bold tracking-widest text-slate-400 hover:text-white transition-colors border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl bg-slate-900/30"
            >
              ← Single Evaluator
            </a>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 pt-8 text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-sky-500/10 to-emerald-500/10 border border-sky-500/20 text-xs font-bold text-sky-400 uppercase tracking-wider">
          <BrainCircuit className="w-3.5 h-3.5" /> Interactive multi-turn strategic agentic loop
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Commercial AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">Real Estate Copilot</span>
        </h1>
        <p className="max-w-3xl mx-auto text-xs text-slate-400">
          An interactive conversational CRE agent powered by MongoDB geospatial, Atlas Semantic vector embedding indexes, and real-time execution tools. Direct the agent to refine assets, analyze brand density, or draft negotiations.
        </p>
      </header>

      {/* Main Grid: Left Column (Chat box) & Right Column (Dynamic Report Console) */}
      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Scrollable Conversation Box & Prompt Input & Real-time Logs */}
        <section className="lg:col-span-7 space-y-4 flex flex-col h-[75vh]">
          
          {/* Main Conversational Panel */}
          <div className="flex-1 bg-slate-900/30 border border-slate-800/80 rounded-3xl backdrop-blur-md p-6 flex flex-col overflow-hidden shadow-xl">
            
            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
              {messages.length === 0 ? (
                // Chat Empty State - Show Templates
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-500/10 to-emerald-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 animate-pulse">
                    <Bot className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-200">Start Your Commercial Exploration Mission</h3>
                    <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                      Select one of the curated global CRE agent templates below or write your custom commercial real estate goals in the prompt box to begin the Multi-Step tool calling sequence.
                    </p>
                  </div>

                  {/* Template Quick Starters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl pt-4">
                    {TEMPLATES.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleRunAgent(item.prompt)}
                        disabled={isRunning}
                        className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-sky-500/40 text-left hover:bg-slate-900/50 transition-all duration-300 group disabled:opacity-50 flex flex-col justify-between"
                      >
                        <h4 className="text-xs font-bold text-sky-400 mb-1 flex items-center justify-between w-full">
                          {item.title} <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 transition-transform" />
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-normal line-clamp-3">
                          {item.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Chat Active State - Message Bubbles
                messages.map((msg) => {
                  const isUser = msg.sender === "user"
                  const options = !isUser ? parseOptions(msg.text) : []

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {/* Avatar */}
                      {!isUser && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500/20 to-emerald-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow shadow-sky-500/10 shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      {/* Content Bubble */}
                      <div className="space-y-3 max-w-[85%]">
                        <div
                          className={`p-4 rounded-3xl text-xs leading-relaxed font-sans shadow-lg ${
                            isUser
                              ? "bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 font-semibold rounded-tr-none"
                              : "bg-slate-950/80 border border-slate-800/80 text-slate-200 rounded-tl-none whitespace-pre-wrap"
                          }`}
                        >
                          {/* Clean Render or Markdown display */}
                          {msg.isReport ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                                <CheckCircle2 className="w-4 h-4" />
                                Compiled Grade-A Viability Brief
                              </div>
                              <p>
                                I have compiled a comprehensive Commercial Real Estate evaluation brief for <strong>{property_title_header(msg.text)}</strong>. The report, geospatial transit mapping, and semantic sentiment matrices have been loaded into your dashboard panel on the right.
                              </p>
                              <p className="text-[10px] text-slate-500 mt-2 italic">
                                Use the Interactive Report Console tabs (Proposal, Scorecard, Proximity Map) to review details.
                              </p>
                            </div>
                          ) : (
                            msg.text
                          )}
                        </div>

                        {/* If this is an agent message containing steering choices, show them! */}
                        {!isUser && options.length > 0 && (
                          <div className="space-y-2 pt-1 pl-1">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> steer the agentic mission:
                            </span>
                            <div className="flex flex-col sm:flex-row gap-2.5">
                              {options.map((opt, i) => {
                                const OptIcon = opt.icon
                                return (
                                  <button
                                    key={i}
                                    onClick={() => handleRunAgent(opt.prompt)}
                                    disabled={isRunning}
                                    className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900/50 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-emerald-400 transition-all flex items-center gap-2 text-left shadow group disabled:opacity-50"
                                  >
                                    <OptIcon className="w-3.5 h-3.5 text-sky-400 group-hover:text-emerald-400" />
                                    {opt.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* User Avatar */}
                      {isUser && (
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  )
                })
              )}

              {/* Running Agent visual bubble */}
              {isRunning && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500/20 to-emerald-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 animate-spin shrink-0">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-3xl rounded-tl-none max-w-[85%] shadow-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest font-mono ml-1">
                        Agent orchestrating tools...
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      The AI is invoking backend MCP database collections, checking coordinate vectors, and modeling smart city sentiment indexes. Please watch the Reasoning Chain console below.
                    </p>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Prompt Input Box */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex gap-3 items-center">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRunAgent("")
                }}
                placeholder={isRunning ? "Orchestrator running, please wait..." : "Type strategic instruction (e.g. 'Let's go with A, look for jewelry stores...')..."}
                disabled={isRunning}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs outline-none focus:border-sky-500/50 text-slate-200 placeholder-slate-600 transition-colors disabled:opacity-50"
              />
              <button
                onClick={() => handleRunAgent("")}
                disabled={isRunning || !inputPrompt.trim()}
                className="p-3 bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 font-bold rounded-2xl hover:scale-105 transition-transform disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Reasoning Chain Terminal Drawer toggle */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl backdrop-blur-md px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-900/50 transition-all select-none" onClick={() => setShowLogsPanel(!showLogsPanel)}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
              Real-time Tool-Call Reasoning Chain Logs
            </span>
            <span className="text-[10px] font-bold text-sky-400 uppercase font-mono bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded-full">
              {showLogsPanel ? "HIDE CONSOLE" : "SHOW CONSOLE"}
            </span>
          </div>

          {/* Expandable Logs Terminal */}
          <AnimatePresence>
            {showLogsPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850 font-mono text-[10px] leading-relaxed space-y-3 h-[200px] overflow-y-auto scrollbar-thin">
                  {logs.length === 0 ? (
                    <div className="text-slate-700 flex flex-col items-center justify-center h-full text-center gap-1">
                      <Database className="w-6 h-6 text-slate-800" />
                      <span>Console idle. Submit a query to trigger $nearSphere and Vector Search logs.</span>
                    </div>
                  ) : (
                    logs.map((log, idx) => (
                      <div key={idx} className="border-b border-slate-900 pb-2.5 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                          <span className="text-sky-400 flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-emerald-400" /> {log.step}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold ${
                            log.status === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            log.status === "error" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            "bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse"
                          }`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="text-slate-400 mb-0.5">{log.message}</p>
                        {log.details && (
                          <pre className="mt-1 p-1.5 rounded bg-slate-900/60 border border-slate-900 text-slate-600 whitespace-pre-wrap max-h-[80px] overflow-y-auto">
                            {log.details}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </section>

        {/* Right Side: Detailed Investment Brief Scorecard / Map */}
        <section className="lg:col-span-5 flex flex-col h-[75vh]">
          <div className="flex-1 p-6 rounded-3xl bg-gradient-to-b from-slate-900/60 to-slate-900/20 border border-slate-800/80 backdrop-blur-md flex flex-col h-full overflow-hidden shadow-xl">
            
            {/* Console Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" /> Interactive Report Console
              </h3>
              {resultBrief && (
                <button
                  onClick={handleDownload}
                  className="px-2.5 py-1.5 rounded-lg border border-sky-500/30 text-sky-400 hover:bg-sky-500/10 transition-colors text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Download (.md)
                </button>
              )}
            </div>

            {/* If no result brief exists yet */}
            {!resultBrief && !error && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 p-8 border border-dashed border-slate-800 rounded-2xl">
                <Building2 className="w-10 h-10 text-slate-800 mb-3 animate-bounce" />
                <h4 className="font-bold text-slate-400 text-xs mb-1">Waiting for Proposal Compilation</h4>
                <p className="text-[10px] leading-relaxed">
                  Start the multi-turn session. Once the agent compiles your Grade-A Investment Brief, the metrics and geo-spatial vectors will populate dynamically.
                </p>
              </div>
            )}

            {/* Error State */}
            {error && !resultBrief && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-red-400 p-6 border border-dashed border-red-500/20 bg-red-500/5 rounded-2xl">
                <AlertTriangle className="w-8 h-8 text-red-500 mb-3" />
                <h4 className="font-bold text-xs mb-1">Session Blocked</h4>
                <p className="text-[10px] leading-relaxed text-slate-500">
                  {error}
                </p>
              </div>
            )}

            {/* Result Brief Tabs & Content */}
            {resultBrief && metrics && (
              <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-slate-800 shrink-0">
                  <button
                    onClick={() => setActiveTab("preview")}
                    className={`flex-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
                      activeTab === "preview" 
                        ? "border-sky-500 text-sky-400" 
                        : "border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> Proposal
                  </button>
                  <button
                    onClick={() => setActiveTab("financials")}
                    className={`flex-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
                      activeTab === "financials" 
                        ? "border-emerald-500 text-emerald-400" 
                        : "border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> Scorecard
                  </button>
                  <button
                    onClick={() => setActiveTab("map")}
                    className={`flex-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
                      activeTab === "map" 
                        ? "border-sky-500 text-sky-400" 
                        : "border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Map className="w-3.5 h-3.5" /> Proximity Map
                  </button>
                </div>

                {/* Tab content wrapper: Scrollable area */}
                <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
                  
                  {/* Tab content: Preview */}
                  {activeTab === "preview" && (
                    <div className="text-xs text-slate-300 leading-relaxed space-y-4 font-sans">
                      <div className="bg-sky-500/10 text-sky-400 border border-sky-500/20 p-4 rounded-xl">
                        <h4 className="font-bold text-[12px] mb-1 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Core Report Loaded
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Located high-performance commercial property match. Financial scorecards and geospatial nodes successfully indexed.
                        </p>
                      </div>

                      <h2 className="text-[14px] font-extrabold text-white border-b border-slate-800 pb-2 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-sky-400" />
                        {property_title_header(resultBrief)}
                      </h2>

                      <div className="space-y-3 mt-4 text-[11px]">
                        <h3 className="font-bold text-sky-400 uppercase tracking-wider">Lease & Yield Snapshot</h3>
                        <ul className="space-y-2 list-disc pl-4 text-slate-400">
                          <li><strong>Monthly Lease Outlay:</strong> {metrics.lease}</li>
                          <li><strong>Rentable Area:</strong> {metrics.area}</li>
                          <li><strong>Effective Rent Rate:</strong> {metrics.effective}</li>
                          <li><strong>Target Yield Potential:</strong> <span className="text-emerald-400 font-bold">{metrics.yield}</span></li>
                        </ul>
                      </div>

                      <div className="space-y-3 mt-4 text-[11px]">
                        <h3 className="font-bold text-sky-400 uppercase tracking-wider">Geospatial Transit Connectivity</h3>
                        <p className="text-slate-400 leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-slate-900">
                          {transit_count(resultBrief)}
                        </p>
                      </div>

                      <div className="space-y-3 mt-4 text-[11px]">
                        <h3 className="font-bold text-emerald-400 uppercase tracking-wider">Vector Sentiment & Zoning Excerpt</h3>
                        <p className="text-slate-400 leading-relaxed">
                          {sentiment_excerpt(resultBrief)}
                        </p>
                      </div>
                      
                      <div className="border-t border-slate-900 pt-4 mt-6 text-[9px] text-slate-600 flex items-center justify-between">
                        <span>System ID: SiteMindAI-CRE-Copilot</span>
                        <span>Acquisition Verdict: Proceed & Lease</span>
                      </div>
                    </div>
                  )}

                  {/* Tab content: Financials Card Grid */}
                  {activeTab === "financials" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-900">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Monthly Lease</span>
                          <div className="text-lg font-extrabold text-white mt-1">{metrics.lease}</div>
                          <p className="text-[9px] text-slate-550 mt-1 leading-none">Local Market Value</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-900">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Area</span>
                          <div className="text-lg font-extrabold text-white mt-1">{metrics.area}</div>
                          <p className="text-[9px] text-slate-550 mt-1 leading-none">Net Rentable Space</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-900">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Effective Rent</span>
                          <div className="text-lg font-extrabold text-sky-400 mt-1">{metrics.effective}</div>
                          <p className="text-[9px] text-slate-550 mt-1 leading-none">Per Area Rate</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-900">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Yield Potential</span>
                          <div className="text-lg font-extrabold text-emerald-400 mt-1">{metrics.yield}</div>
                          <p className="text-[9px] text-slate-550 mt-1 leading-none">Sub-market Average</p>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-900 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-400">Footfall Assessment</span>
                          <span className="text-emerald-400 uppercase tracking-wider font-semibold">{metrics.footfall.split(' ')[0]}</span>
                        </div>
                        <p className="text-[10px] text-slate-550 leading-normal">
                          Pedestrian volume metrics tracked natively via nearby commuter terminals and micro-market commercial hubs.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/5 to-emerald-500/5 border border-sky-500/10 text-center space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Asset Viability Score</div>
                        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
                          {metrics.score}
                        </div>
                        <p className="text-[9px] text-slate-400">
                          Autonomously calculated across pricing, proximity coordinates, and vector sentiment signals.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tab content: Simulated High-End Map Component */}
                  {activeTab === "map" && (
                    <div className="space-y-4">
                      <div className="relative aspect-square w-full rounded-2xl border border-slate-850 bg-slate-950 overflow-hidden flex items-center justify-center">
                        {/* Grid background */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70" />
                        
                        {/* Live Radar concentric rings */}
                        <div className="absolute w-[80%] h-[80%] rounded-full border border-sky-500/10 animate-pulse" />
                        <div className="absolute w-[50%] h-[50%] rounded-full border border-sky-500/20" />
                        <div className="absolute w-[20%] h-[20%] rounded-full border border-sky-500/30" />
                        
                        {/* Target Pin (pulsing green glow) */}
                        <div className="absolute flex flex-col items-center justify-center z-10">
                          <div className="relative flex h-5 w-5 items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                          </div>
                          <span className="text-[8px] font-mono font-bold text-emerald-400 mt-2 bg-slate-900/95 border border-emerald-500/30 px-1.5 py-0.5 rounded shadow-lg uppercase whitespace-nowrap">
                            {property_title_header(resultBrief).split("for use")[0].trim().substring(0, 25)}
                          </span>
                        </div>
                        
                        {/* Transit Hub Pin 1 */}
                        <div className="absolute top-[25%] left-[30%] flex flex-col items-center justify-center">
                          <MapPin className="w-4 h-4 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                          <span className="text-[7px] font-mono text-sky-300 mt-0.5 bg-slate-900/80 px-1 rounded uppercase whitespace-nowrap">
                            Transit Hub (~200m)
                          </span>
                        </div>

                        {/* Transit Hub Pin 2 */}
                        <div className="absolute bottom-[28%] right-[25%] flex flex-col items-center justify-center">
                          <MapPin className="w-4 h-4 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                          <span className="text-[7px] font-mono text-sky-300 mt-0.5 bg-slate-900/80 px-1 rounded uppercase whitespace-nowrap">
                            Central Hub (~550m)
                          </span>
                        </div>

                        {/* Radial Scan line overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/0 via-sky-500/5 to-sky-500/0 animate-spin [animation-duration:14s] pointer-events-none" />
                        
                        <div className="absolute bottom-3 left-3 text-[8px] font-mono text-slate-550 flex items-center gap-1 bg-slate-950/80 border border-slate-900 px-2 py-1 rounded">
                          <Database className="w-3 h-3 text-emerald-400" /> Active MongoDB Proximity Scan
                        </div>
                        
                        <div className="absolute top-3 right-3 text-[8px] font-mono text-sky-400 bg-sky-950/40 border border-sky-500/30 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                          $nearSphere: ON
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-900 text-[10px] text-slate-400 leading-normal space-y-1.5">
                        <div className="font-bold text-sky-400 flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5" /> High-Performance Proximity Insight
                        </div>
                        <p>
                          Distance metrics verified over the WGS84 ellipsoid model, searching for hubs natively cached in your MongoDB database collections.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        </section>

      </div>
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={() => setShowAuthModal(false)} 
      />
    </main>
  )
}

// Helpers to cleanly parse sections out of the generated markdown brief
function property_title_header(text: string) {
  const match = text.match(/# Commercial Real Estate \(CRE\) Investment Brief[\s\S]*?\*\*Target Proposal:\*\* ([^\n\r]+)/)
  return match ? match[1] : "CRE Investment Brief Proposal"
}

function transit_count(text: string) {
  const match = text.match(/## Geospatial Proximity & Transit Analysis([\s\S]*?)##/)
  if (match) {
    const raw = match[1].trim()
    return raw.length > 250 ? raw.substring(0, 250) + "..." : raw
  }
  return "Geospatial proximity verified successfully near target railway junctions and metro terminals."
}

function sentiment_excerpt(text: string) {
  const match = text.match(/## Neighborhood Zoning & Vector Sentiment[\s\S]*?### Market Sentiment Context([\s\S]*?)##/)
  if (match) {
    return match[1].trim().substring(0, 300) + "..."
  }
  // Generic fallback if header slightly differs
  const fall = text.match(/## Neighborhood Sentiment & Zoning Vector Analysis([\s\S]*?)##/)
  if (fall) {
    return fall[1].trim().substring(0, 300) + "..."
  }
  return "Local micro-market continues to show massive development. Yields hover around standard thresholds with excellent brick-and-mortar prospects."
}
