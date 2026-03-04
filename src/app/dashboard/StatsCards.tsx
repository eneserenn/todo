"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"

export default function StatsCards() {
    const [stats, setStats] = useState<any>(null)

    useEffect(() => {
        fetch("/api/stats")
            .then(r => r.ok ? r.json() : null)
            .then(setStats)
            .catch(() => { })
    }, [])

    if (!stats) return null

    const cards = [
        {
            label: "Bugün Tamamlanan",
            value: `${stats.todayCompleted}/${stats.todayTotal}`,
            icon: "✅",
            color: "from-emerald-500/10 to-emerald-500/5 border-emerald-200 dark:border-emerald-800/50",
            textColor: "text-emerald-700 dark:text-emerald-300",
        },
        {
            label: "Bekleyen",
            value: stats.todayPending,
            icon: "⏳",
            color: "from-amber-500/10 to-amber-500/5 border-amber-200 dark:border-amber-800/50",
            textColor: "text-amber-700 dark:text-amber-300",
        },
        {
            label: "Haftalık Verimlilik",
            value: `%${stats.weekPercent}`,
            icon: "📊",
            color: "from-blue-500/10 to-blue-500/5 border-blue-200 dark:border-blue-800/50",
            textColor: "text-blue-700 dark:text-blue-300",
        },
        {
            label: "Gün Serisi",
            value: `${stats.streak} 🔥`,
            icon: "",
            color: "from-purple-500/10 to-purple-500/5 border-purple-200 dark:border-purple-800/50",
            textColor: "text-purple-700 dark:text-purple-300",
        },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cards.map(c => (
                <Card key={c.label} className={`bg-gradient-to-br ${c.color} border overflow-hidden`}>
                    <CardContent className="p-4 text-center">
                        <div className={`text-2xl font-bold ${c.textColor}`}>{c.value}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{c.icon} {c.label}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
