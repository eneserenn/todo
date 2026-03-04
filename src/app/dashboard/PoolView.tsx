"use client"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
    LOW:    { label: "Düşük",  cls: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
    MEDIUM: { label: "Orta",   cls: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    HIGH:   { label: "Yüksek", cls: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
    URGENT: { label: "Acil",   cls: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
}

interface PoolViewProps {
    user: any
    selectedDate: Date
}

// ─── Shared task card with subtasks + AI ───────────────────────────────────
function PoolTaskCard({
    task,
    onDelete,
    onUpdateDescription,
    onChangePriority,
    actionSlot,
}: {
    task: any
    onDelete: (id: string) => void
    onUpdateDescription: (id: string, desc: string) => void
    onChangePriority: (id: string, priority: string) => void
    actionSlot: React.ReactNode
}) {
    const [subtasks, setSubtasks] = useState<any[]>(task.subtasks || [])
    const [expandedSubtasks, setExpandedSubtasks] = useState(false)
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("")

    const [editingDesc, setEditingDesc] = useState(false)
    const [descValue, setDescValue] = useState(task.description || "")
    const [fixingDesc, setFixingDesc] = useState(false)
    const [generatingAi, setGeneratingAi] = useState(false)

    const descRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (editingDesc && descRef.current) {
            descRef.current.focus()
            descRef.current.setSelectionRange(descRef.current.value.length, descRef.current.value.length)
        }
    }, [editingDesc])

    const saveDesc = async () => {
        const trimmed = descValue.trim()
        setEditingDesc(false)
        onUpdateDescription(task.id, trimmed)
        await fetch(`/api/tasks/${task.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: trimmed }),
        })
    }

    const handleFixDesc = async () => {
        if (!descValue.trim()) return
        setFixingDesc(true)
        try {
            const res = await fetch("/api/ai/fix-description", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskId: task.id }),
            })
            if (res.ok) {
                const { description } = await res.json()
                setDescValue(description)
                onUpdateDescription(task.id, description)
            }
        } finally {
            setFixingDesc(false)
        }
    }

    const handleGenerateSubtasks = async () => {
        setGeneratingAi(true)
        try {
            const res = await fetch("/api/ai/subtasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskId: task.id }),
            })
            if (res.ok) {
                const { subtasks: generated } = await res.json()
                setSubtasks(prev => [...prev, ...generated])
                setExpandedSubtasks(true)
            }
        } finally {
            setGeneratingAi(false)
        }
    }

    const handleToggleSubtask = async (subtaskId: string, current: boolean) => {
        setSubtasks(s => s.map(x => x.id === subtaskId ? { ...x, isCompleted: !current } : x))
        await fetch(`/api/subtasks/${subtaskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isCompleted: !current }),
        })
    }

    const handleDeleteSubtask = async (subtaskId: string) => {
        setSubtasks(s => s.filter(x => x.id !== subtaskId))
        await fetch(`/api/subtasks/${subtaskId}`, { method: "DELETE" })
    }

    const handleAddSubtask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSubtaskTitle.trim()) return
        const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newSubtaskTitle }),
        })
        if (res.ok) {
            const { subtask } = await res.json()
            setSubtasks(s => [...s, subtask])
            setNewSubtaskTitle("")
        }
    }

    return (
        <Card className="overflow-hidden hover:shadow-md transition-all">
            <CardContent className="p-0">
                <div className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                            <span className="font-medium text-base leading-snug">{task.title}</span>
                            <select
                                value={task.priority || "MEDIUM"}
                                onChange={e => onChangePriority(task.id, e.target.value)}
                                className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-1 shrink-0 ${PRIORITY_CONFIG[task.priority || "MEDIUM"]?.cls}`}
                            >
                                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {actionSlot}
                            <button
                                onClick={() => onDelete(task.id)}
                                className="text-zinc-400 hover:text-red-500 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </div>

                    {/* Description */}
                    {editingDesc ? (
                        <div>
                            <textarea
                                ref={descRef}
                                value={descValue}
                                onChange={e => setDescValue(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Escape") setEditingDesc(false)
                                    if (e.key === "Enter" && e.ctrlKey) saveDesc()
                                }}
                                rows={2}
                                className="w-full text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-2.5 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Açıklama ekle..."
                            />
                            <div className="flex gap-2 mt-1">
                                <button onClick={saveDesc} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Kaydet</button>
                                <span className="text-xs text-zinc-300">·</span>
                                <button onClick={() => setEditingDesc(false)} className="text-xs text-zinc-400 hover:text-zinc-600">İptal</button>
                            </div>
                        </div>
                    ) : (
                        <div className="group/desc flex items-start gap-2">
                            <span
                                onClick={() => setEditingDesc(true)}
                                className={`text-sm cursor-text flex-1 ${descValue ? "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" : "text-zinc-300 dark:text-zinc-600 hover:text-zinc-400"}`}
                            >
                                {descValue || "Açıklama ekle..."}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover/desc:opacity-100 transition-opacity shrink-0">
                                <button
                                    onClick={handleFixDesc}
                                    disabled={fixingDesc || !descValue}
                                    title="AI ile düzelt"
                                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {fixingDesc ? (
                                        <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/><path d="m15 5 3 3"/></svg>
                                    )}
                                    <span className="hidden sm:inline">{fixingDesc ? "Düzeltiliyor..." : "Düzelt"}</span>
                                </button>
                                <span className="text-zinc-300 text-xs">·</span>
                                <button
                                    onClick={handleGenerateSubtasks}
                                    disabled={generatingAi}
                                    title="AI ile alt görev oluştur"
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {generatingAi ? (
                                        <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                                    )}
                                    <span className="hidden sm:inline">{generatingAi ? "Oluşturuluyor..." : "Alt Görevler"}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Subtask toggle + AI generate */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setExpandedSubtasks(!expandedSubtasks)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                            {subtasks.length} Alt Görev
                        </button>
                        <button
                            onClick={handleGenerateSubtasks}
                            disabled={generatingAi}
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1 disabled:opacity-50"
                        >
                            {generatingAi ? "Oluşturuluyor..." : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                                    AI Oluştur
                                </>
                            )}
                        </button>
                    </div>

                    {/* Subtasks panel */}
                    {expandedSubtasks && (
                        <div className="pl-4 pr-1 pt-2 pb-1 space-y-2 border-t">
                            {subtasks.map(s => (
                                <div key={s.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={s.isCompleted}
                                            onChange={() => handleToggleSubtask(s.id, s.isCompleted)}
                                            className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-blue-600"
                                        />
                                        <span className={`text-sm ${s.isCompleted ? "line-through text-zinc-400" : "text-zinc-700 dark:text-zinc-300"}`}>
                                            {s.title}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteSubtask(s.id)}
                                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                                    </button>
                                </div>
                            ))}
                            <form onSubmit={handleAddSubtask} className="flex gap-2 mt-2 pt-1">
                                <Input
                                    size={1}
                                    className="h-7 text-sm"
                                    placeholder="Alt görev ekle..."
                                    value={newSubtaskTitle}
                                    onChange={e => setNewSubtaskTitle(e.target.value)}
                                />
                                <Button type="submit" size="sm" className="h-7 px-3 text-xs">Ekle</Button>
                            </form>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

// ─── Manager Assign Panel ────────────────────────────────────────────────────
function AssignPanel({
    taskId,
    taskPriority,
    employees,
    selectedDate,
    onAssigned,
}: {
    taskId: string
    taskPriority: string
    employees: { id: string; name: string }[]
    selectedDate: Date
    onAssigned: (taskId: string) => void
}) {
    const [open, setOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState("")
    const [loading, setLoading] = useState(false)

    const handleAssign = async () => {
        if (!selectedUserId) return
        setLoading(true)
        try {
            const res = await fetch(`/api/pool/${taskId}/assign-employee`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: selectedUserId,
                    dateStr: selectedDate.toISOString(),
                }),
            })
            if (res.ok) {
                onAssigned(taskId)
                setOpen(false)
            }
        } finally {
            setLoading(false)
        }
    }

    if (!open) {
        return (
            <Button
                size="sm"
                onClick={() => setOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
            >
                Ata ▾
            </Button>
        )
    }

    return (
        <div className="flex flex-col gap-2 min-w-[180px] p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-10">
            <p className="text-xs text-zinc-500">
                {taskPriority === "URGENT"
                    ? "Acil — günün görevi olarak atanacak"
                    : "Acil değil — kişisel pool'a atanacak"}
            </p>
            <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="text-sm border border-input bg-background rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
            >
                <option value="">Çalışan seç...</option>
                {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
            </select>
            <div className="flex gap-2">
                <Button size="sm" onClick={handleAssign} disabled={!selectedUserId || loading} className="flex-1 text-xs h-7">
                    {loading ? "..." : "Ata"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setOpen(false)} className="text-xs h-7">İptal</Button>
            </div>
        </div>
    )
}

// ─── Main PoolView ──────────────────────────────────────────────────────────
export default function PoolView({ user, selectedDate }: PoolViewProps) {
    const [activeTab, setActiveTab] = useState<"personal" | "shared">("personal")

    // Shared pool
    const [sharedTasks, setSharedTasks] = useState<any[]>([])
    const [sharedLoading, setSharedLoading] = useState(true)
    const [newSharedTitle, setNewSharedTitle] = useState("")
    const [newSharedDescription, setNewSharedDescription] = useState("")
    const [newSharedPriority, setNewSharedPriority] = useState("MEDIUM")

    // Personal pool
    const [personalTasks, setPersonalTasks] = useState<any[]>([])
    const [personalLoading, setPersonalLoading] = useState(true)
    const [newPersonalTitle, setNewPersonalTitle] = useState("")
    const [newPersonalDescription, setNewPersonalDescription] = useState("")
    const [newPersonalPriority, setNewPersonalPriority] = useState("MEDIUM")
    const [assigningId, setAssigningId] = useState<string | null>(null)

    // Manager employees
    const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])

    useEffect(() => {
        fetchSharedTasks()
        fetchPersonalTasks()
        if (user.role === "MANAGER") {
            fetch("/api/manager/employees")
                .then(r => r.json())
                .then(d => setEmployees(d.employees || []))
                .catch(() => {})
        }
    }, [])

    // ── Shared ────────────────────────────────────────────────
    const fetchSharedTasks = async () => {
        setSharedLoading(true)
        try {
            const res = await fetch("/api/pool")
            if (res.ok) setSharedTasks((await res.json()).tasks || [])
        } finally {
            setSharedLoading(false)
        }
    }

    const handleCreateSharedTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSharedTitle.trim()) return
        const res = await fetch("/api/pool", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newSharedTitle, description: newSharedDescription, priority: newSharedPriority }),
        })
        if (res.ok) {
            const { task } = await res.json()
            setSharedTasks(prev => [{ ...task, subtasks: task.subtasks || [] }, ...prev])
            setNewSharedTitle("")
            setNewSharedDescription("")
            setNewSharedPriority("MEDIUM")
        }
    }

    const handleClaimTask = async (taskId: string) => {
        setSharedTasks(prev => prev.filter(t => t.id !== taskId))
        await fetch(`/api/pool/claim/${taskId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dateStr: new Date().toISOString() }),
        })
    }

    const handleSharedChangePriority = async (taskId: string, priority: string) => {
        setSharedTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority } : t))
        await fetch(`/api/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ priority }),
        })
    }

    // ── Personal ──────────────────────────────────────────────
    const fetchPersonalTasks = async () => {
        setPersonalLoading(true)
        try {
            const res = await fetch("/api/pool/personal")
            if (res.ok) setPersonalTasks((await res.json()).tasks || [])
        } finally {
            setPersonalLoading(false)
        }
    }

    const handleCreatePersonalTask = async (e: React.FormEvent) => {
        e.preventDefault()
        const title = newPersonalTitle.trim()
        if (!title) return
        const res = await fetch("/api/pool/personal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description: newPersonalDescription, priority: newPersonalPriority }),
        })
        if (res.ok) {
            const { task } = await res.json()
            setPersonalTasks(prev => [{ ...task, subtasks: task.subtasks || [] }, ...prev])
            setNewPersonalTitle("")
            setNewPersonalDescription("")
            setNewPersonalPriority("MEDIUM")
        }
    }

    const handleAssignToDay = async (taskId: string) => {
        setAssigningId(taskId)
        try {
            const res = await fetch(`/api/pool/personal/${taskId}/assign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dateStr: selectedDate.toISOString() }),
            })
            if (res.ok) setPersonalTasks(prev => prev.filter(t => t.id !== taskId))
        } finally {
            setAssigningId(null)
        }
    }

    const handlePersonalChangePriority = async (taskId: string, priority: string) => {
        setPersonalTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority } : t))
        await fetch(`/api/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ priority }),
        })
    }

    const tabClass = (tab: "personal" | "shared") =>
        `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab
            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`

    const PrioritySelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="text-sm border border-input bg-background rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
        >
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
            ))}
        </select>
    )

    return (
        <div className="space-y-6 mt-6">
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-fit">
                <button className={tabClass("personal")} onClick={() => setActiveTab("personal")}>Kişisel Pool</button>
                <button className={tabClass("shared")} onClick={() => setActiveTab("shared")}>Ekip Havuzu</button>
            </div>

            {/* ── Kişisel Pool ── */}
            {activeTab === "personal" && (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold">Kişisel Pool</h2>
                        <p className="text-sm text-zinc-500 mt-0.5">
                            Backlog'unuzu buraya ekleyin. Hazır olduğunuzda <strong>{format(selectedDate, "d MMM")}</strong>'e alın.
                        </p>
                    </div>

                    <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                        <CardContent className="pt-4 pb-4">
                            <form onSubmit={handleCreatePersonalTask} className="flex flex-col gap-2">
                                <Input
                                    placeholder="Task başlığı..."
                                    value={newPersonalTitle}
                                    onChange={e => setNewPersonalTitle(e.target.value)}
                                    className="bg-white dark:bg-zinc-950"
                                />
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Açıklama (opsiyonel)"
                                        value={newPersonalDescription}
                                        onChange={e => setNewPersonalDescription(e.target.value)}
                                        className="bg-white dark:bg-zinc-950 text-sm flex-1"
                                    />
                                    <PrioritySelect value={newPersonalPriority} onChange={setNewPersonalPriority} />
                                    <Button type="submit" className="shrink-0">Ekle</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="space-y-2">
                        {personalLoading ? (
                            <div className="animate-pulse space-y-2">
                                <div className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full" />
                                <div className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full" />
                            </div>
                        ) : personalTasks.length === 0 ? (
                            <div className="text-center p-8 border border-dashed rounded-xl text-zinc-500">
                                Kişisel pool'unuz boş. Yukarıdan task ekleyin.
                            </div>
                        ) : personalTasks.map(task => (
                            <div key={task.id} className="border-l-4 border-l-emerald-500 rounded-lg">
                                <PoolTaskCard
                                    task={task}
                                    onDelete={id => setPersonalTasks(prev => prev.filter(t => t.id !== id))}
                                    onUpdateDescription={(id, desc) => setPersonalTasks(prev => prev.map(t => t.id === id ? { ...t, description: desc } : t))}
                                    onChangePriority={handlePersonalChangePriority}
                                    actionSlot={
                                        <Button
                                            size="sm"
                                            onClick={() => handleAssignToDay(task.id)}
                                            disabled={assigningId === task.id}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs whitespace-nowrap"
                                        >
                                            {assigningId === task.id ? "..." : `→ ${format(selectedDate, "d MMM")}'e Al`}
                                        </Button>
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Ekip Havuzu ── */}
            {activeTab === "shared" && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Ekip Havuzu</h2>

                    {user.role === "MANAGER" && (
                        <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Havuza Ekle</CardTitle>
                                <CardDescription>Ekibinin claim edebileceği tasklar oluştur.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateSharedTask} className="flex flex-col gap-2">
                                    <Input
                                        placeholder="Task başlığı..."
                                        value={newSharedTitle}
                                        onChange={e => setNewSharedTitle(e.target.value)}
                                        className="bg-white dark:bg-zinc-950"
                                    />
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Açıklama (opsiyonel)"
                                            value={newSharedDescription}
                                            onChange={e => setNewSharedDescription(e.target.value)}
                                            className="bg-white dark:bg-zinc-950 text-sm flex-1"
                                        />
                                        <PrioritySelect value={newSharedPriority} onChange={setNewSharedPriority} />
                                        <Button type="submit" className="shrink-0">Ekle</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    <div className="space-y-2">
                        {sharedLoading ? (
                            <div className="animate-pulse space-y-2">
                                <div className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full" />
                                <div className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full" />
                            </div>
                        ) : sharedTasks.length === 0 ? (
                            <div className="text-center p-8 border border-dashed rounded-xl text-zinc-500">
                                {user.role === "MANAGER" ? "Havuz boş. Ekibine task ekle." : "Şu an havuzda görev yok."}
                            </div>
                        ) : sharedTasks.map(task => (
                            <div key={task.id} className="border-l-4 border-l-blue-500 rounded-lg">
                                <PoolTaskCard
                                    task={task}
                                    onDelete={id => setSharedTasks(prev => prev.filter(t => t.id !== id))}
                                    onUpdateDescription={(id, desc) => setSharedTasks(prev => prev.map(t => t.id === id ? { ...t, description: desc } : t))}
                                    onChangePriority={handleSharedChangePriority}
                                    actionSlot={
                                        user.role === "MANAGER" ? (
                                            <AssignPanel
                                                taskId={task.id}
                                                taskPriority={task.priority || "MEDIUM"}
                                                employees={employees}
                                                selectedDate={selectedDate}
                                                onAssigned={id => setSharedTasks(prev => prev.filter(t => t.id !== id))}
                                            />
                                        ) : (
                                            <Button
                                                size="sm"
                                                onClick={() => handleClaimTask(task.id)}
                                                className="bg-blue-600 hover:bg-blue-700 text-xs"
                                            >
                                                Talep Et
                                            </Button>
                                        )
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
