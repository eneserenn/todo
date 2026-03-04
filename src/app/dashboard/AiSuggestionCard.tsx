"use client"

import { useState, useEffect } from "react"

export default function AiSuggestionCard() {
    const [suggestion, setSuggestion] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [dismissed, setDismissed] = useState(false)

    const fetchSuggestion = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/ai/suggest", { method: "POST" })
            if (res.ok) {
                const data = await res.json()
                setSuggestion(data.suggestion)
            }
        } catch {
            setSuggestion(null)
        } finally {
            setLoading(false)
        }
    }

    if (dismissed) return null

    return (
        <div className="relative rounded-xl border border-indigo-100 dark:border-indigo-800/50 bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-950/30 dark:via-violet-950/30 dark:to-purple-950/30 p-4">
            <button
                onClick={() => setDismissed(true)}
                className="absolute top-2 right-3 text-zinc-400 hover:text-zinc-600 text-sm"
            >✕</button>

            {!suggestion && !loading && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">💡</span>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            AI&apos;dan bugün için odaklanma önerileri al
                        </span>
                    </div>
                    <button
                        onClick={fetchSuggestion}
                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium"
                    >
                        Öneri Al ✨
                    </button>
                </div>
            )}

            {loading && (
                <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-sm text-zinc-500">AI düşünüyor...</span>
                </div>
            )}

            {suggestion && !loading && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">💡</span>
                        <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Bugünkü Öneri</span>
                    </div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{suggestion}</p>
                </div>
            )}
        </div>
    )
}
