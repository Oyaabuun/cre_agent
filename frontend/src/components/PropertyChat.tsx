"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, User, Bot, Loader2, MessageSquare } from "lucide-react"
import { BACKEND_URL } from "@/lib/utils"

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface PropertyChatProps {
    evaluationData: any;
}

export function PropertyChat({ evaluationData }: PropertyChatProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim()
        }

        setMessages(prev => [...prev, userMessage])
        setInput("")
        setIsLoading(true)

        try {
            const response = await fetch(`${BACKEND_URL}/chat/property`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    evaluation_data: evaluationData,
                    message: userMessage.content
                })
            })

            const data = await response.json()
            
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.response
            }

            setMessages(prev => [...prev, assistantMessage])
        } catch (error) {
            console.error("Chat error:", error)
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Sorry, I encountered an error. Please try again later."
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="glass-dark rounded-3xl overflow-hidden border border-slate-800 flex flex-col h-[500px]">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Ask About This Property</h3>
                        <p className="text-xs text-slate-500">I can explain specific risks or benefits of this evaluation.</p>
                    </div>
                </div>
            </div>

            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
            >
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                        <Bot className="w-12 h-12 text-slate-500" />
                        <p className="text-sm text-slate-400 max-w-[200px]">
                            Ask anything about the evaluation, pricing, or risks.
                        </p>
                    </div>
                )}
                
                <AnimatePresence>
                    {messages.map((m) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`flex gap-3 max-w-[80%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                    m.role === "user" ? "bg-sky-500/20 text-sky-400" : "bg-emerald-500/20 text-emerald-400"
                                }`}>
                                    {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>
                                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                                    m.role === "user" 
                                        ? "bg-sky-500/10 text-sky-100 rounded-tr-none border border-sky-500/20" 
                                        : "bg-slate-800/80 text-slate-300 rounded-tl-none border border-slate-700/50"
                                }`}>
                                    {m.content}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                                <span className="text-sm text-slate-500">AI is thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 bg-slate-900/60 border-t border-slate-800">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Type your question..."
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 pl-4 pr-14 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 p-2 rounded-xl bg-sky-500 text-white hover:bg-sky-400 disabled:opacity-50 disabled:grayscale transition-all"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
