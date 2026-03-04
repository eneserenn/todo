"use client"

import { useState, useEffect } from "react"
import { format, startOfToday } from "date-fns"
import ReactMarkdown from "react-markdown"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import DateTimeline from "./DateTimeline"
import TaskList from "./TaskList"
import PoolView from "./PoolView"
import EmployeeTasksView from "./EmployeeTasksView"
import AiSuggestionCard from "./AiSuggestionCard"
import TemplatesView from "./TemplatesView"
import DailyQuote from "./DailyQuote"

export default function DashboardClient({ user }: { user: any }) {
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday())
    const [summary, setSummary] = useState<string | null>(null)
    const [generatingSummary, setGeneratingSummary] = useState<null | "daily" | "team" | "weekly">(null)

    const handleSummarize = async (type: "daily" | "team" | "weekly") => {
        setGeneratingSummary(type)
        setSummary(null)
        try {
            const endpointMap = {
                daily: "/api/ai/summary",
                team: "/api/ai/manager-summary",
                weekly: "/api/ai/weekly-summary",
            }
            const res = await fetch(endpointMap[type], {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dateStr: selectedDate.toISOString() }),
            })
            if (res.ok) {
                const data = await res.json()
                setSummary(data.summary)
            }
        } catch (e) {
            console.error("Summary Generation failed", e)
            setSummary("Özet oluşturulamadı. Yerel LLM'in çalıştığından emin ol.")
        } finally {
            setGeneratingSummary(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex flex-col space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Hoş geldin, {user.name}</h1>
                    <p className="text-muted-foreground">
                        Görev panonuna genel bakış.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        onClick={() => handleSummarize("daily")}
                        disabled={generatingSummary !== null}
                        variant="outline"
                        className="bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-900/40"
                    >
                        {generatingSummary === "daily" ? "Özetleniyor..." : "Günümü Özetle"}
                    </Button>
                    {user.role === "MANAGER" && (
                        <>
                            <Button
                                onClick={() => handleSummarize("team")}
                                disabled={generatingSummary !== null}
                                variant="outline"
                                className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/40"
                            >
                                {generatingSummary === "team" ? "Özetleniyor..." : "Ekip Gününü Özetle"}
                            </Button>
                            <Button
                                onClick={() => handleSummarize("weekly")}
                                disabled={generatingSummary !== null}
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/40"
                            >
                                {generatingSummary === "weekly" ? "Özetleniyor..." : "Bu Haftayı Özetle"}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {summary && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50 relative text-sm text-purple-900 dark:text-purple-200 shadow-sm">
                    <span className="absolute top-3 right-4 cursor-pointer text-purple-400 hover:text-purple-600" onClick={() => setSummary(null)}>✕</span>
                    <strong className="block mb-3 font-semibold">✨ AI Özeti</strong>
                    <div className="prose prose-sm max-w-none dark:prose-invert
                        prose-headings:text-purple-900 dark:prose-headings:text-purple-200
                        prose-p:text-purple-900 dark:prose-p:text-purple-200
                        prose-strong:text-purple-900 dark:prose-strong:text-purple-200
                        prose-li:text-purple-900 dark:prose-li:text-purple-200
                        prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5
                        prose-p:my-1 prose-headings:my-2
                        prose-h1:text-base prose-h2:text-sm prose-h3:text-sm">
                        <ReactMarkdown>{summary}</ReactMarkdown>
                    </div>
                </div>
            )}

            <DailyQuote />
            <AiSuggestionCard />

            <Tabs defaultValue="tasks" className="w-full">
                <TabsList className={`grid w-full max-w-2xl ${user.role === "MANAGER" ? "grid-cols-4" : "grid-cols-3"}`}>
                    <TabsTrigger value="tasks">Görevlerim</TabsTrigger>
                    <TabsTrigger value="pool">Görev Havuzu</TabsTrigger>
                    {user.role === "MANAGER" && (
                        <TabsTrigger value="employees">Çalışanlar</TabsTrigger>
                    )}
                    <TabsTrigger value="templates">Templateler</TabsTrigger>
                </TabsList>
                <TabsContent value="tasks" className="mt-6 space-y-6">
                    <div className="flex flex-col space-y-2">
                        <h2 className="text-xl font-semibold">Takvim</h2>
                        <p className="text-sm text-muted-foreground">
                            {format(selectedDate, "EEEE, MMMM d, yyyy")}
                        </p>
                    </div>
                    <DateTimeline selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                    <TaskList date={selectedDate} user={user} />
                </TabsContent>
                <TabsContent value="pool">
                    <PoolView user={user} selectedDate={selectedDate} />
                </TabsContent>
                {user.role === "MANAGER" && (
                    <TabsContent value="employees">
                        <EmployeeTasksView selectedDate={selectedDate} />
                    </TabsContent>
                )}
                <TabsContent value="templates">
                    <TemplatesView user={user} selectedDate={selectedDate} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
