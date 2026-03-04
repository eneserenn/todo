"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface Message {
    role: "user" | "assistant"
    content: string
}

export default function AiChatPanel() {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Auto-scroll on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, loading])

    // Focus input when panel opens
    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300)
        }
    }, [open])

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || loading) return

        const userMessage: Message = { role: "user", content: input.trim() }
        const newMessages = [...messages, userMessage]
        setMessages(newMessages)
        setInput("")
        setLoading(true)

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages }),
            })
            if (res.ok) {
                const data = await res.json()
                setMessages([...newMessages, { role: "assistant", content: data.message }])
            } else {
                setMessages([
                    ...newMessages,
                    { role: "assistant", content: "⚠️ Bir hata oluştu. Lütfen AI modelinin çalıştığından emin ol." },
                ])
            }
        } catch {
            setMessages([
                ...newMessages,
                { role: "assistant", content: "⚠️ Bağlantı kurulamadı. Local LLM'in çalıştığından emin ol." },
            ])
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {/* Floating trigger button */}
            <button
                onClick={() => setOpen(!open)}
                className={`
          fixed bottom-5 right-5 z-50 
          w-10 h-10 rounded-full 
          bg-gradient-to-br from-violet-600 to-indigo-600 
          text-white shadow-lg shadow-violet-500/30
          hover:shadow-xl hover:shadow-violet-500/40 hover:scale-105
          active:scale-95
          transition-all duration-200
          flex items-center justify-center
        `}
                aria-label="AI Asistan"
            >
                {open ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    </svg>
                )}
            </button>

            {/* Chat Panel */}
            <div
                className={`
          fixed top-0 right-0 z-40
          h-full w-full sm:w-[420px]
          bg-white dark:bg-zinc-950
          border-l border-zinc-200 dark:border-zinc-800
          shadow-2xl
          transform transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}
          flex flex-col
        `}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">AI Asistan</h3>
                            <p className="text-xs text-zinc-500">Görevlerini konuşarak yönet</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setMessages([])}
                        className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        Temizle
                    </button>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    {messages.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500">
                                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-zinc-700 dark:text-zinc-300 text-sm">Merhaba! 👋</p>
                                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                                    Görevlerini planlaman, önceliklendirmen veya günün hakkında konuşman için buradayım.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {[
                                    "Bugün ne yapmalıyım?",
                                    "Görevlerimi önceliklendir",
                                    "Verimliliğimi nasıl artırırım?",
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => {
                                            setInput(suggestion)
                                            setTimeout(() => handleSend(), 50)
                                        }}
                                        className="
                      text-xs px-3 py-1.5 rounded-full
                      bg-violet-50 text-violet-700 
                      hover:bg-violet-100 
                      dark:bg-violet-900/30 dark:text-violet-300 
                      dark:hover:bg-violet-900/50
                      border border-violet-100 dark:border-violet-800/50
                      transition-colors
                    "
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`
                  max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                  ${msg.role === "user"
                                        ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-md shadow-md"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-md border border-zinc-200 dark:border-zinc-700"
                                    }
                `}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3 border border-zinc-200 dark:border-zinc-700">
                                <div className="flex items-center space-x-1.5">
                                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <form
                    onSubmit={handleSend}
                    className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 bg-white dark:bg-zinc-950"
                >
                    <div className="flex items-center space-x-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Bir şey sor..."
                            disabled={loading}
                            className="
                flex-1 bg-zinc-100 dark:bg-zinc-900 
                border border-zinc-200 dark:border-zinc-700 
                rounded-xl px-4 py-2.5 text-sm 
                placeholder:text-zinc-400
                focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400
                disabled:opacity-50
                transition-all
              "
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="
                w-10 h-10 rounded-xl
                bg-gradient-to-br from-violet-600 to-indigo-600
                text-white
                flex items-center justify-center
                hover:shadow-lg hover:shadow-violet-500/30
                active:scale-95
                disabled:opacity-40 disabled:hover:shadow-none
                transition-all duration-200
                shrink-0
              "
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m5 12 7-7 7 7" /><path d="M12 19V5" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>

            {/* Backdrop overlay on mobile */}
            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm sm:hidden"
                />
            )}
        </>
    )
}
