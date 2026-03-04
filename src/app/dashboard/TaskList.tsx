"use client"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
    LOW: { label: "Düşük", cls: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
    MEDIUM: { label: "Orta", cls: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    HIGH: { label: "Yüksek", cls: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
    URGENT: { label: "Acil", cls: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
}

const RECURRENCE_OPTIONS = [
    { value: "", label: "Tekrar yok" },
    { value: "daily", label: "Her gün" },
    { value: "weekdays", label: "Hafta içi" },
    { value: "weekly", label: "Haftalık" },
]

const TAG_COLORS = ["#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"]

interface TaskListProps {
    date: Date
    user: any
}

export default function TaskList({ date, user }: TaskListProps) {
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [newTaskTitle, setNewTaskTitle] = useState("")
    const [newTaskDescription, setNewTaskDescription] = useState("")
    const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM")
    const [newTaskRecurrence, setNewTaskRecurrence] = useState("")

    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
    const [commentTaskId, setCommentTaskId] = useState<string | null>(null)
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
    const [newSubtaskDescription, setNewSubtaskDescription] = useState("")
    const [generatingAi, setGeneratingAi] = useState<string | null>(null)


    const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null)
    const [editingDescriptionValue, setEditingDescriptionValue] = useState("")
    const [fixingDescription, setFixingDescription] = useState<string | null>(null)

    // Comments
    const [comments, setComments] = useState<any[]>([])
    const [newComment, setNewComment] = useState("")
    const [loadingComments, setLoadingComments] = useState(false)

    // Tags
    const [userTags, setUserTags] = useState<any[]>([])
    const [tagInput, setTagInput] = useState("")
    const [tagTaskId, setTagTaskId] = useState<string | null>(null)

    // Drag & Drop
    const [dragId, setDragId] = useState<string | null>(null)
    const [dragOverId, setDragOverId] = useState<string | null>(null)

    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null)
    const formattedDate = format(date, "yyyy-MM-dd")

    useEffect(() => {
        const fetchTasks = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/tasks?date=${formattedDate}`)
                if (res.ok) {
                    const data = await res.json()
                    setTasks(data.tasks)
                }
            } catch (err) {
                console.error("Failed to load tasks", err)
            } finally {
                setLoading(false)
            }
        }
        fetchTasks()
    }, [formattedDate])

    // Fetch user tags
    useEffect(() => {
        fetch("/api/tags")
            .then(r => r.ok ? r.json() : { tags: [] })
            .then(d => setUserTags(d.tags || []))
            .catch(() => { })
    }, [])

    useEffect(() => {
        if (editingDescriptionId && descriptionTextareaRef.current) {
            descriptionTextareaRef.current.focus()
            descriptionTextareaRef.current.setSelectionRange(
                descriptionTextareaRef.current.value.length,
                descriptionTextareaRef.current.value.length
            )
        }
    }, [editingDescriptionId])

    // ---- COMMENTS ----
    const loadComments = async (taskId: string) => {
        if (commentTaskId === taskId) {
            setCommentTaskId(null)
            return
        }
        setCommentTaskId(taskId)
        setLoadingComments(true)
        try {
            const res = await fetch(`/api/tasks/${taskId}/comments`)
            if (res.ok) {
                const data = await res.json()
                setComments(data.comments)
            }
        } catch { setComments([]) }
        finally { setLoadingComments(false) }
    }

    const handleAddComment = async (taskId: string) => {
        if (!newComment.trim()) return
        const res = await fetch(`/api/tasks/${taskId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: newComment.trim() }),
        })
        if (res.ok) {
            const { comment } = await res.json()
            setComments([...comments, comment])
            setNewComment("")
            toast.success("Yorum eklendi")
        }
    }

    // ---- TAGS ----
    const handleAddTag = async (taskId: string) => {
        if (!tagInput.trim()) return
        const tagRes = await fetch("/api/tags", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: tagInput.trim(), color: TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)] }),
        })
        if (tagRes.ok) {
            const { tag } = await tagRes.json()
            // Connect tag to task
            await fetch(`/api/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ connectTagId: tag.id }),
            })
            setTasks(tasks.map(t => t.id === taskId ? { ...t, tags: [...(t.tags || []), tag] } : t))
            if (!userTags.find(ut => ut.id === tag.id)) setUserTags([...userTags, tag])
            setTagInput("")
            setTagTaskId(null)
            toast.success(`"${tag.name}" etiketi eklendi`)
        }
    }

    const handleRemoveTag = async (taskId: string, tagId: string) => {
        await fetch(`/api/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ disconnectTagId: tagId }),
        })
        setTasks(tasks.map(t => t.id === taskId ? { ...t, tags: (t.tags || []).filter((tg: any) => tg.id !== tagId) } : t))
    }

    // ---- DRAG & DROP ----
    const handleDragStart = (id: string) => setDragId(id)
    const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverId(id) }
    const handleDragEnd = () => { setDragId(null); setDragOverId(null) }
    const handleDrop = async (targetId: string) => {
        if (!dragId || dragId === targetId) return
        const newTasks = [...tasks]
        const fromIdx = newTasks.findIndex(t => t.id === dragId)
        const toIdx = newTasks.findIndex(t => t.id === targetId)
        const [moved] = newTasks.splice(fromIdx, 1)
        newTasks.splice(toIdx, 0, moved)
        setTasks(newTasks)
        setDragId(null)
        setDragOverId(null)
        // Save sort order
        newTasks.forEach((t, idx) => {
            fetch(`/api/tasks/${t.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sortOrder: idx }),
            })
        })
    }

    // ---- TASK ACTIONS ----
    const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, isCompleted: !currentStatus } : t))
        await fetch(`/api/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isCompleted: !currentStatus }),
        })
        toast.success(!currentStatus ? "Görev tamamlandı! ✅" : "Görev geri açıldı")
    }

    const handleDeleteTask = async (taskId: string) => {
        setTasks(tasks.filter(t => t.id !== taskId))
        await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
        toast.success("Görev silindi")
    }

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTaskTitle.trim()) return

        const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: newTaskTitle,
                description: newTaskDescription,
                date: date.toISOString(),
                priority: newTaskPriority,
                recurrence: newTaskRecurrence || undefined,
            }),
        })

        if (res.ok) {
            const { task } = await res.json()
            setTasks([...tasks, { ...task, subtasks: [], tags: [] }])
            setNewTaskTitle("")
            setNewTaskDescription("")
            setNewTaskPriority("MEDIUM")
            setNewTaskRecurrence("")
            toast.success("Yeni görev oluşturuldu")
        }
    }

    const handleChangePriority = async (taskId: string, priority: string) => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, priority } : t))
        await fetch(`/api/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ priority }),
        })
    }

    const handleStartEditDescription = (taskId: string, currentDescription: string) => {
        setEditingDescriptionId(taskId)
        setEditingDescriptionValue(currentDescription || "")
    }

    const handleSaveDescription = async (taskId: string) => {
        const trimmed = editingDescriptionValue.trim()
        setTasks(tasks.map(t => t.id === taskId ? { ...t, description: trimmed } : t))
        setEditingDescriptionId(null)
        setEditingDescriptionValue("")

        await fetch(`/api/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: trimmed }),
        })
        toast.success("Açıklama kaydedildi")
    }

    const handleCancelEditDescription = () => {
        setEditingDescriptionId(null)
        setEditingDescriptionValue("")
    }

    const handleFixDescription = async (taskId: string) => {
        setFixingDescription(taskId)
        try {
            const res = await fetch("/api/ai/fix-description", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskId }),
            })
            if (res.ok) {
                const { description } = await res.json()
                setTasks(tasks.map(t => t.id === taskId ? { ...t, description } : t))
                toast.success("Açıklama AI ile düzeltildi")
            }
        } catch (e) {
            console.error("AI fix description failed", e)
            toast.error("AI düzeltme başarısız")
        } finally {
            setFixingDescription(null)
        }
    }

    const handleToggleSubtask = async (taskId: string, subtaskId: string, currentStatus: boolean) => {
        setTasks(tasks.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    subtasks: t.subtasks.map((s: any) => s.id === subtaskId ? { ...s, isCompleted: !currentStatus } : s)
                }
            }
            return t
        }))

        await fetch(`/api/subtasks/${subtaskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isCompleted: !currentStatus }),
        })
    }

    const handleDeleteSubtask = async (taskId: string, subtaskId: string) => {
        setTasks(tasks.map(t => {
            if (t.id === taskId) {
                return { ...t, subtasks: t.subtasks.filter((s: any) => s.id !== subtaskId) }
            }
            return t
        }))
        await fetch(`/api/subtasks/${subtaskId}`, { method: "DELETE" })
    }

    const handleCreateSubtask = async (taskId: string, e: React.FormEvent) => {
        e.preventDefault()
        if (!newSubtaskTitle.trim()) return

        const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newSubtaskTitle, description: newSubtaskDescription || undefined }),
        })

        if (res.ok) {
            const { subtask } = await res.json()
            setTasks(tasks.map(t => {
                if (t.id === taskId) {
                    return { ...t, subtasks: [...t.subtasks, subtask] }
                }
                return t
            }))
            setNewSubtaskTitle("")
            setNewSubtaskDescription("")
            toast.success("Alt görev eklendi")
        }
    }

    const handleGenerateAiSubtasks = async (taskId: string) => {
        setGeneratingAi(taskId)
        try {
            const res = await fetch(`/api/ai/subtasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskId }),
            })
            if (res.ok) {
                const { subtasks } = await res.json()
                setTasks(tasks.map(t => {
                    if (t.id === taskId) {
                        return { ...t, subtasks: [...(t.subtasks || []), ...subtasks] }
                    }
                    return t
                }))
                setExpandedTaskId(taskId)
                toast.success("AI alt görevler oluşturuldu ✨")
            }
        } catch (e) {
            console.error("AI Generation failed", e)
            toast.error("AI oluşturma başarısız")
        } finally {
            setGeneratingAi(null)
        }
    }

    return (
        <div className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{format(date, "d MMM")} Görevleri</h2>
            </div>

            <div className="space-y-2">
                {loading ? (
                    <div className="animate-pulse space-y-3">
                        <div className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full"></div>
                        <div className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full"></div>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center p-8 border border-dashed rounded-xl text-zinc-500">
                        Bu gün için görev yok.
                    </div>
                ) : (
                    tasks.map((task) => (
                        <Card
                            key={task.id}
                            draggable
                            onDragStart={() => handleDragStart(task.id)}
                            onDragOver={(e) => handleDragOver(e, task.id)}
                            onDragEnd={handleDragEnd}
                            onDrop={() => handleDrop(task.id)}
                            className={`overflow-hidden transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${dragOverId === task.id ? "ring-2 ring-blue-400 ring-offset-2" : ""} ${dragId === task.id ? "opacity-50" : ""}`}
                        >
                            <CardContent className="p-0">
                                <div className="p-4 flex flex-col space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                                            {/* Drag handle */}
                                            <div className="mt-2 text-zinc-300 dark:text-zinc-600 cursor-grab shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" /></svg>
                                            </div>
                                            <div className="mt-1 relative flex items-center justify-center shrink-0">
                                                <input
                                                    type="checkbox"
                                                    checked={task.isCompleted}
                                                    onChange={() => handleToggleTask(task.id, task.isCompleted)}
                                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-zinc-300 bg-white transition-all checked:border-blue-500 checked:bg-blue-500 hover:border-blue-400 dark:border-zinc-700 dark:bg-zinc-950 dark:checked:border-blue-600 dark:checked:bg-blue-600 focus:outline-none"
                                                />
                                                <svg
                                                    className="pointer-events-none absolute h-3.5 w-3.5 stroke-white opacity-0 peer-checked:opacity-100 transition-opacity"
                                                    fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div className={`flex flex-col flex-1 min-w-0 ${task.isCompleted ? "opacity-50" : ""}`}>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-base font-medium transition-all ${task.isCompleted ? "line-through text-zinc-500" : ""}`}>
                                                        {task.title}
                                                    </span>
                                                    <select
                                                        value={task.priority || "MEDIUM"}
                                                        onChange={e => handleChangePriority(task.id, e.target.value)}
                                                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none ${PRIORITY_CONFIG[task.priority || "MEDIUM"]?.cls}`}
                                                    >
                                                        {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                                                            <option key={k} value={k}>{v.label}</option>
                                                        ))}
                                                    </select>
                                                    {task.recurrence && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">
                                                            🔄 {RECURRENCE_OPTIONS.find(r => r.value === task.recurrence)?.label}
                                                        </span>
                                                    )}
                                                    {/* Tags inline */}
                                                    {(task.tags || []).map((tag: any) => (
                                                        <span
                                                            key={tag.id}
                                                            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white cursor-pointer hover:opacity-80"
                                                            style={{ backgroundColor: tag.color }}
                                                            onClick={() => handleRemoveTag(task.id, tag.id)}
                                                            title="Kaldırmak için tıkla"
                                                        >
                                                            #{tag.name}
                                                        </span>
                                                    ))}
                                                    <button
                                                        onClick={() => setTagTaskId(tagTaskId === task.id ? null : task.id)}
                                                        className="text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors"
                                                        title="Etiket ekle"
                                                    >+</button>
                                                </div>

                                                {/* Tag input */}
                                                {tagTaskId === task.id && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <input
                                                            value={tagInput}
                                                            onChange={e => setTagInput(e.target.value)}
                                                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(task.id) } }}
                                                            placeholder="Etiket adı..."
                                                            className="text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 w-28 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                                            autoFocus
                                                        />
                                                        {userTags.length > 0 && (
                                                            <div className="flex gap-1">
                                                                {userTags.slice(0, 4).map(ut => (
                                                                    <button
                                                                        key={ut.id}
                                                                        onClick={async () => {
                                                                            await fetch(`/api/tasks/${task.id}`, {
                                                                                method: "PATCH",
                                                                                headers: { "Content-Type": "application/json" },
                                                                                body: JSON.stringify({ connectTagId: ut.id }),
                                                                            })
                                                                            setTasks(tasks.map(t => t.id === task.id ? { ...t, tags: [...(t.tags || []), ut] } : t))
                                                                            setTagTaskId(null)
                                                                            toast.success(`"${ut.name}" eklendi`)
                                                                        }}
                                                                        className="text-[10px] px-1.5 py-0.5 rounded-full text-white hover:opacity-80"
                                                                        style={{ backgroundColor: ut.color }}
                                                                    >#{ut.name}</button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Description Section */}
                                                {editingDescriptionId === task.id ? (
                                                    <div className="mt-1.5">
                                                        <textarea
                                                            ref={descriptionTextareaRef}
                                                            value={editingDescriptionValue}
                                                            onChange={(e) => setEditingDescriptionValue(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Escape") handleCancelEditDescription()
                                                                if (e.key === "Enter" && e.ctrlKey) handleSaveDescription(task.id)
                                                            }}
                                                            rows={2}
                                                            className="w-full text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-2.5 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            placeholder="Açıklama ekle..."
                                                        />
                                                        <div className="flex gap-1.5 mt-1">
                                                            <button onClick={() => handleSaveDescription(task.id)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Kaydet</button>
                                                            <span className="text-xs text-zinc-300">·</span>
                                                            <button onClick={handleCancelEditDescription} className="text-xs text-zinc-400 hover:text-zinc-600">İptal</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="group/desc flex items-start gap-2 mt-1">
                                                        <span
                                                            onClick={() => handleStartEditDescription(task.id, task.description)}
                                                            className={`text-sm cursor-text flex-1 min-w-0 ${task.description ? "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700" : "text-zinc-300 dark:text-zinc-600 hover:text-zinc-400"}`}
                                                        >
                                                            {task.description || "Açıklama ekle..."}
                                                        </span>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover/desc:opacity-100 transition-opacity shrink-0">
                                                            <button
                                                                onClick={() => handleFixDescription(task.id)}
                                                                disabled={fixingDescription === task.id || !task.description}
                                                                title="AI ile düzelt"
                                                                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 disabled:opacity-40 transition-colors"
                                                            >
                                                                {fixingDescription === task.id ? "..." : "✏️"}
                                                            </button>
                                                            <button
                                                                onClick={() => handleGenerateAiSubtasks(task.id)}
                                                                disabled={generatingAi === task.id}
                                                                title="AI alt görev oluştur"
                                                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40 transition-colors"
                                                            >
                                                                {generatingAi === task.id ? "..." : "✨"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center space-x-3 mt-1">
                                                    <button
                                                        onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                    >
                                                        {task.subtasks?.length || 0} Alt Görev
                                                    </button>
                                                    <button
                                                        onClick={() => handleGenerateAiSubtasks(task.id)}
                                                        disabled={generatingAi === task.id}
                                                        className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1 disabled:opacity-50"
                                                    >
                                                        {generatingAi === task.id ? "Oluşturuluyor..." : "✨ AI Oluştur"}
                                                    </button>
                                                    <button
                                                        onClick={() => loadComments(task.id)}
                                                        className="text-xs text-zinc-500 hover:text-zinc-700 font-medium"
                                                    >
                                                        💬 Notlar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <button onClick={() => handleDeleteTask(task.id)} className="text-zinc-400 hover:text-red-500 transition-colors shrink-0 ml-2 mt-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                        </button>
                                    </div>

                                    {/* Subtasks Section */}
                                    {expandedTaskId === task.id && (
                                        <div className="pl-10 pr-2 pt-2 pb-1 space-y-2 border-t">
                                            {task.subtasks?.map((subtask: any) => (
                                                <div key={subtask.id} className="flex items-start justify-between group">
                                                    <div className="flex items-start space-x-3 flex-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={subtask.isCompleted}
                                                            onChange={() => handleToggleSubtask(task.id, subtask.id, subtask.isCompleted)}
                                                            className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-blue-600 focus:ring-blue-600 mt-0.5 shrink-0"
                                                        />
                                                        <div className="flex flex-col min-w-0">
                                                            <span className={`text-sm ${subtask.isCompleted ? "line-through text-zinc-400" : "text-zinc-700 dark:text-zinc-300"}`}>
                                                                {subtask.title}
                                                            </span>
                                                            {subtask.description && (
                                                                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{subtask.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleDeleteSubtask(task.id, subtask.id)} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all mt-0.5 shrink-0">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
                                                    </button>
                                                </div>
                                            ))}
                                            <form onSubmit={(e) => handleCreateSubtask(task.id, e)} className="flex flex-col gap-1.5 mt-2 pt-2">
                                                <div className="flex items-center gap-2">
                                                    <Input size={1} className="h-8 text-sm" placeholder="Alt görev ekle..." value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} />
                                                    <Button type="submit" size="sm" className="h-8 px-3 text-xs shrink-0">Ekle</Button>
                                                </div>
                                                <Input size={1} className="h-7 text-xs" placeholder="Açıklama (opsiyonel)" value={newSubtaskDescription} onChange={(e) => setNewSubtaskDescription(e.target.value)} />
                                            </form>
                                        </div>
                                    )}

                                    {/* Comments Section */}
                                    {commentTaskId === task.id && (
                                        <div className="pl-10 pr-2 pt-2 pb-1 border-t space-y-2">
                                            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">💬 Notlar</div>
                                            {loadingComments ? (
                                                <div className="text-xs text-zinc-400">Yükleniyor...</div>
                                            ) : comments.length === 0 ? (
                                                <div className="text-xs text-zinc-400">Henüz not yok.</div>
                                            ) : (
                                                comments.map((c: any) => (
                                                    <div key={c.id} className="bg-zinc-50 dark:bg-zinc-900 rounded-lg px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{c.authorName}</span>
                                                            <span className="text-[10px] text-zinc-400">{new Date(c.createdAt).toLocaleString("tr-TR", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</span>
                                                        </div>
                                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">{c.content}</p>
                                                    </div>
                                                ))
                                            )}
                                            <div className="flex gap-2">
                                                <input
                                                    value={newComment}
                                                    onChange={e => setNewComment(e.target.value)}
                                                    onKeyDown={e => { if (e.key === "Enter") handleAddComment(task.id) }}
                                                    placeholder="Not ekle..."
                                                    className="flex-1 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                />
                                                <Button size="sm" className="h-8 text-xs" onClick={() => handleAddComment(task.id)}>Gönder</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <form onSubmit={handleCreateTask} className="flex flex-col gap-2 relative mt-4 pt-4 border-t">
                <div className="flex flex-col sm:flex-row gap-2 items-start">
                    <div className="flex-1 flex flex-col gap-2 w-full">
                        <Input
                            placeholder="Ne yapılacak?"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            className="font-medium"
                        />
                        <div className="flex gap-2 flex-wrap">
                            <Input
                                placeholder="Açıklama (opsiyonel)"
                                value={newTaskDescription}
                                onChange={(e) => setNewTaskDescription(e.target.value)}
                                className="text-sm text-zinc-600 dark:text-zinc-400 flex-1 min-w-[150px]"
                            />
                            <select
                                value={newTaskPriority}
                                onChange={e => setNewTaskPriority(e.target.value)}
                                className="text-sm border border-input bg-background rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
                            >
                                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                            <select
                                value={newTaskRecurrence}
                                onChange={e => setNewTaskRecurrence(e.target.value)}
                                className="text-sm border border-input bg-background rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
                            >
                                {RECURRENCE_OPTIONS.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <Button type="submit" className="w-full sm:w-auto h-auto min-h-[40px] sm:min-h-[88px]">Görev Oluştur</Button>
                </div>
            </form>
        </div>
    )
}
