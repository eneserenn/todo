"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface EmployeeTasksViewProps {
    selectedDate: Date
}

export default function EmployeeTasksView({ selectedDate }: EmployeeTasksViewProps) {
    const [employees, setEmployees] = useState<any[]>([])
    const [poolTasks, setPoolTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null)

    const formattedDate = format(selectedDate, "yyyy-MM-dd")

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/manager/employees?date=${formattedDate}`)
                if (res.ok) {
                    const data = await res.json()
                    setEmployees(data.employees || [])
                    setPoolTasks(data.poolTasks || [])
                }
            } catch (err) {
                console.error("Failed to load employee data", err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [formattedDate])

    const totalTasks = employees.reduce((sum, e) => sum + e.assignedTasks.length, 0)
    const completedTasks = employees.reduce(
        (sum, e) => sum + e.assignedTasks.filter((t: any) => t.isCompleted).length, 0
    )

    return (
        <div className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                    Çalışan Görevleri — {format(selectedDate, "d MMM yyyy")}
                </h2>
            </div>

            {/* Summary Stats */}
            {!loading && (
                <div className="grid grid-cols-3 gap-3">
                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{employees.length}</div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Çalışan</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{completedTasks}/{totalTasks}</div>
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Tamamlanan</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{poolTasks.length}</div>
                            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">Havuzda Bekleyen</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Employee List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="animate-pulse space-y-3">
                        <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full"></div>
                        <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full"></div>
                        <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full"></div>
                    </div>
                ) : employees.length === 0 ? (
                    <div className="text-center p-8 border border-dashed rounded-xl text-zinc-500">
                        Henüz bağlı çalışan bulunmuyor.
                    </div>
                ) : (
                    employees.map((emp) => {
                        const empCompleted = emp.assignedTasks.filter((t: any) => t.isCompleted).length
                        const empTotal = emp.assignedTasks.length
                        const isExpanded = expandedEmployeeId === emp.id

                        return (
                            <Card
                                key={emp.id}
                                className={`overflow-hidden transition-all border-l-4 ${empTotal === 0
                                        ? "border-l-zinc-300 dark:border-l-zinc-700"
                                        : empCompleted === empTotal
                                            ? "border-l-emerald-500"
                                            : "border-l-blue-500"
                                    }`}
                            >
                                {/* Employee Header (clickable to expand) */}
                                <button
                                    onClick={() => setExpandedEmployeeId(isExpanded ? null : emp.id)}
                                    className="w-full text-left"
                                >
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            {/* Avatar placeholder */}
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                {emp.name?.charAt(0)?.toUpperCase() || "?"}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-base">{emp.name}</span>
                                                <span className="text-xs text-zinc-500">{emp.email}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            {empTotal > 0 ? (
                                                <div className="flex items-center space-x-2">
                                                    {/* Progress bar */}
                                                    <div className="w-24 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${empCompleted === empTotal ? "bg-emerald-500" : "bg-blue-500"
                                                                }`}
                                                            style={{ width: `${empTotal > 0 ? (empCompleted / empTotal) * 100 : 0}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-zinc-500 whitespace-nowrap">
                                                        {empCompleted}/{empTotal}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-400">Görev yok</span>
                                            )}
                                            <svg
                                                className={`w-4 h-4 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </CardContent>
                                </button>

                                {/* Expanded Task List */}
                                {isExpanded && (
                                    <div className="border-t px-4 pb-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                                        {empTotal === 0 ? (
                                            <p className="text-sm text-zinc-400 py-4 text-center">Bu gün için görev atanmamış.</p>
                                        ) : (
                                            <div className="space-y-2 pt-3">
                                                {emp.assignedTasks.map((task: any) => (
                                                    <div key={task.id} className="flex items-start space-x-3 group">
                                                        <div className="mt-1">
                                                            {task.isCompleted ? (
                                                                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-5 h-5 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <circle cx="12" cy="12" r="9" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 flex flex-col">
                                                            <span className={`text-sm font-medium ${task.isCompleted ? "line-through text-zinc-400" : ""}`}>
                                                                {task.title}
                                                            </span>
                                                            {task.description && (
                                                                <span className="text-xs text-zinc-500 mt-0.5">{task.description}</span>
                                                            )}
                                                            {task.isPoolTask && (
                                                                <span className="text-xs text-blue-500 mt-0.5">📋 Havuzdan alındı</span>
                                                            )}
                                                            {/* Subtasks */}
                                                            {task.subtasks?.length > 0 && (
                                                                <div className="ml-2 mt-1 space-y-1">
                                                                    {task.subtasks.map((sub: any) => (
                                                                        <div key={sub.id} className="flex items-center space-x-2">
                                                                            <span className={`w-3 h-3 rounded-sm border ${sub.isCompleted ? "bg-emerald-500 border-emerald-500" : "border-zinc-300 dark:border-zinc-600"}`} />
                                                                            <span className={`text-xs ${sub.isCompleted ? "line-through text-zinc-400" : "text-zinc-600 dark:text-zinc-400"}`}>
                                                                                {sub.title}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        )
                    })
                )}
            </div>

            {/* Unassigned Pool Tasks */}
            {!loading && poolTasks.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                        Havuzda Bekleyen Görevler ({poolTasks.length})
                    </h3>
                    {poolTasks.map((task) => (
                        <Card key={task.id} className="border-l-4 border-l-amber-400">
                            <CardContent className="p-4">
                                <div className="flex flex-col">
                                    <span className="font-medium">{task.title}</span>
                                    {task.description && (
                                        <span className="text-sm text-zinc-500 mt-1">{task.description}</span>
                                    )}
                                    <span className="text-xs text-zinc-400 mt-2">
                                        Oluşturulma: {format(new Date(task.createdAt), "d MMM yyyy")}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
