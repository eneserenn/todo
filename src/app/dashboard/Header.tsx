"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export default function DashboardHeader({ user }: { user: any }) {
    const [dark, setDark] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const stored = localStorage.getItem("theme")
        const isDark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)
        setDark(isDark)
        document.documentElement.classList.toggle("dark", isDark)
        setMounted(true)
    }, [])

    const toggleDark = () => {
        const next = !dark
        setDark(next)
        document.documentElement.classList.toggle("dark", next)
        localStorage.setItem("theme", next ? "dark" : "light")
    }

    return (
        <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 items-center gap-4 px-4 md:px-8 justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="font-semibold text-lg hover:opacity-80 transition-opacity">
                        Todo App
                    </Link>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
                        {user.role}
                    </span>
                    {user.role === "ADMIN" && (
                        <Link
                            href="/admin"
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors"
                        >
                            Admin Paneli
                        </Link>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleDark}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
                        aria-label="Toggle dark mode"
                    >
                        {mounted && (dark ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
                        ))}
                    </button>
                    <span className="text-sm font-medium">{user.name}</span>
                    <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
                        Çıkış Yap
                    </Button>
                </div>
            </div>
        </header>
    )
}
