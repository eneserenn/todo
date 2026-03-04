"use client"

import { useEffect, useState } from "react"
import { getDailyQuote, type Quote } from "@/lib/quotes"

const FILM_ICON = "🎬"
const BOOK_ICON = "📖"

export default function DailyQuote() {
    const [quote, setQuote] = useState<Quote | null>(null)
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        setQuote(getDailyQuote())
        const dismissed = sessionStorage.getItem("quote-dismissed")
        if (dismissed) setVisible(false)
    }, [])

    if (!quote || !visible) return null

    const icon = quote.type === "movie" ? FILM_ICON : BOOK_ICON
    const label = quote.type === "movie" ? "Film" : "Kitap"

    return (
        <div className="relative rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800/40 px-5 py-4 text-amber-900 dark:text-amber-200 shadow-sm">
            <button
                onClick={() => { setVisible(false); sessionStorage.setItem("quote-dismissed", "1") }}
                className="absolute top-3 right-4 text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 text-sm leading-none"
                aria-label="Kapat"
            >
                ✕
            </button>

            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2 tracking-wide uppercase">
                Günün Repliği
            </p>

            <blockquote className="text-sm italic leading-relaxed font-medium mb-3">
                &ldquo;{quote.quote}&rdquo;
            </blockquote>

            <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                <span>{icon}</span>
                <span className="font-semibold">{quote.source}</span>
                <span className="text-amber-400 dark:text-amber-600">·</span>
                <span>{label}</span>
            </div>
        </div>
    )
}
