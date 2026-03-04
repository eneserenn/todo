"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface TemplatesViewProps {
    user: any
    selectedDate: Date
}

type SubtaskForm = { id?: string; title: string; description: string }

function SubtaskList({
    items,
    onUpdate,
    onRemove,
    onAdd,
}: {
    items: SubtaskForm[]
    onUpdate: (i: number, field: keyof SubtaskForm, value: string) => void
    onRemove: (i: number) => void
    onAdd: () => void
}) {
    return (
        <div className="space-y-1.5">
            {items.length > 0 && (
                <div className="text-xs font-medium text-zinc-500">Alt Görevler</div>
            )}
            {items.map((st, i) => (
                <div key={i} className="flex gap-1.5 items-center">
                    <Input
                        placeholder="Alt görev başlığı *"
                        value={st.title}
                        onChange={e => onUpdate(i, "title", e.target.value)}
                        className="h-7 text-xs flex-1"
                    />
                    <Input
                        placeholder="Açıklama (opsiyonel)"
                        value={st.description}
                        onChange={e => onUpdate(i, "description", e.target.value)}
                        className="h-7 text-xs flex-1"
                    />
                    <button
                        onClick={() => onRemove(i)}
                        className="text-zinc-400 hover:text-red-500 px-1 text-lg leading-none shrink-0"
                    >×</button>
                </div>
            ))}
            <button onClick={onAdd} className="text-xs text-indigo-600 hover:text-indigo-800">
                + Alt görev ekle
            </button>
        </div>
    )
}

function AiButtons({
    onSuggest,
    onFixDesc,
    suggesting,
    fixing,
    suggestDisabled,
    fixDisabled,
}: {
    onSuggest: () => void
    onFixDesc: () => void
    suggesting: boolean
    fixing: boolean
    suggestDisabled: boolean
    fixDisabled: boolean
}) {
    return (
        <div className="flex gap-2 flex-wrap">
            <button
                type="button"
                onClick={onSuggest}
                disabled={suggestDisabled || suggesting}
                className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                {suggesting ? "Öneriliyor..." : "✨ AI Subtask Öner"}
            </button>
            <button
                type="button"
                onClick={onFixDesc}
                disabled={fixDisabled || fixing}
                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                {fixing ? "İyileştiriliyor..." : "✏️ Açıklamayı İyileştir"}
            </button>
        </div>
    )
}

export default function TemplatesView({ user, selectedDate }: TemplatesViewProps) {
    const [templates, setTemplates] = useState<any[]>([])
    const [groupMembers, setGroupMembers] = useState<any[]>([])
    const [userGroups, setUserGroups] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Görev oluşturma
    const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null)
    const [taskTitle, setTaskTitle] = useState("")
    const [taskDate, setTaskDate] = useState(format(selectedDate, "yyyy-MM-dd"))
    const [taskAssignee, setTaskAssignee] = useState(user.id)
    const [creating, setCreating] = useState(false)

    // Yeni template formu
    const [showNewForm, setShowNewForm] = useState(false)
    const [newTemplateName, setNewTemplateName] = useState("")
    const [newTemplateDesc, setNewTemplateDesc] = useState("")
    const [newTemplateSubtasks, setNewTemplateSubtasks] = useState<SubtaskForm[]>([])
    const [newTemplateGroups, setNewTemplateGroups] = useState<string[]>([])
    const [savingTemplate, setSavingTemplate] = useState(false)

    // Edit
    const [editingTemplate, setEditingTemplate] = useState<any | null>(null)
    const [editName, setEditName] = useState("")
    const [editDesc, setEditDesc] = useState("")
    const [editSubtasks, setEditSubtasks] = useState<SubtaskForm[]>([])
    const [editGroups, setEditGroups] = useState<string[]>([])
    const [savingEdit, setSavingEdit] = useState(false)

    // Delete confirm
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    // AI
    const [generatingAi, setGeneratingAi] = useState<"new" | "edit" | null>(null)
    const [fixingDesc, setFixingDesc] = useState<"new" | "edit" | null>(null)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            const [tRes, mRes, gRes] = await Promise.all([
                fetch("/api/templates"),
                fetch("/api/groups/members"),
                fetch("/api/groups"),
            ])
            if (tRes.ok) setTemplates((await tRes.json()).templates || [])
            if (mRes.ok) setGroupMembers((await mRes.json()).members || [])
            if (gRes.ok) setUserGroups((await gRes.json()).groups || [])
            setLoading(false)
        }
        load()
    }, [])

    useEffect(() => {
        setTaskDate(format(selectedDate, "yyyy-MM-dd"))
    }, [selectedDate])

    // ---- TEMPLATE SEÇİMİ ----
    const handleSelectTemplate = (t: any) => {
        if (selectedTemplate?.id === t.id) {
            setSelectedTemplate(null)
            return
        }
        if (editingTemplate) return // edit modundayken seçim engelle
        setSelectedTemplate(t)
        setTaskTitle(t.name)
        setTaskAssignee(user.id)
    }

    // ---- GÖREV OLUŞTUR ----
    const handleCreateFromTemplate = async () => {
        if (!selectedTemplate || !taskTitle.trim()) return
        setCreating(true)
        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: taskTitle.trim(),
                    date: new Date(taskDate).toISOString(),
                    assignedToId: taskAssignee,
                    priority: "MEDIUM",
                }),
            })

            if (!res.ok) {
                toast.error((await res.json()).error || "Görev oluşturulamadı")
                return
            }

            const { task } = await res.json()

            if (selectedTemplate.subtasks?.length) {
                await Promise.all(
                    selectedTemplate.subtasks.map((st: any) =>
                        fetch(`/api/tasks/${task.id}/subtasks`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ title: st.title, description: st.description }),
                        })
                    )
                )
            }

            const assigneeName = taskAssignee === user.id
                ? "görev listene"
                : `${groupMembers.find(m => m.id === taskAssignee)?.name ?? "kişinin"} listesine`
            toast.success(`Görev ${assigneeName} eklendi ✅`)
            setSelectedTemplate(null)
            setTaskTitle("")
            setTaskAssignee(user.id)
        } catch {
            toast.error("Bir hata oluştu")
        } finally {
            setCreating(false)
        }
    }

    // ---- EDIT ----
    const handleStartEdit = (t: any, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingTemplate(t)
        setEditName(t.name)
        setEditDesc(t.description || "")
        setEditSubtasks(t.subtasks?.map((st: any) => ({
            id: st.id,
            title: st.title,
            description: st.description || "",
        })) || [])
        setEditGroups(t.groups?.map((g: any) => g.id) || [])
        setSelectedTemplate(null)
        setConfirmDeleteId(null)
    }

    const handleSaveEdit = async () => {
        if (!editName.trim()) return
        setSavingEdit(true)
        try {
            const res = await fetch(`/api/templates/${editingTemplate.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName,
                    description: editDesc,
                    subtasks: editSubtasks.filter(st => st.title.trim()),
                    groupIds: editGroups,
                }),
            })
            if (res.ok) {
                const { template } = await res.json()
                setTemplates(templates.map(t => t.id === template.id ? template : t))
                setEditingTemplate(null)
                toast.success("Template güncellendi")
            }
        } finally {
            setSavingEdit(false)
        }
    }

    const updateEditSubtask = (i: number, field: keyof SubtaskForm, value: string) => {
        const updated = [...editSubtasks]
        updated[i] = { ...updated[i], [field]: value }
        setEditSubtasks(updated)
    }

    // ---- DELETE ----
    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirmDeleteId === id) {
            // İkinci tıklama: gerçekten sil
            doDelete(id)
        } else {
            setConfirmDeleteId(id)
        }
    }

    const doDelete = async (id: string) => {
        const res = await fetch(`/api/templates/${id}`, { method: "DELETE" })
        if (res.ok) {
            setTemplates(templates.filter(t => t.id !== id))
            if (selectedTemplate?.id === id) setSelectedTemplate(null)
            if (editingTemplate?.id === id) setEditingTemplate(null)
            setConfirmDeleteId(null)
            toast.success("Template silindi")
        }
    }

    // ---- CREATE ----
    const handleSaveNewTemplate = async () => {
        if (!newTemplateName.trim()) return
        setSavingTemplate(true)
        try {
            const res = await fetch("/api/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newTemplateName.trim(),
                    description: newTemplateDesc.trim() || undefined,
                    subtasks: newTemplateSubtasks.filter(st => st.title.trim()),
                    groupIds: newTemplateGroups,
                }),
            })
            if (res.ok) {
                const { template } = await res.json()
                setTemplates([template, ...templates])
                setShowNewForm(false)
                setNewTemplateName("")
                setNewTemplateDesc("")
                setNewTemplateSubtasks([])
                setNewTemplateGroups([])
                toast.success("Template oluşturuldu")
            }
        } finally {
            setSavingTemplate(false)
        }
    }

    const updateNewSubtask = (i: number, field: keyof SubtaskForm, value: string) => {
        const updated = [...newTemplateSubtasks]
        updated[i] = { ...updated[i], [field]: value }
        setNewTemplateSubtasks(updated)
    }

    // ---- AI ----
    const handleAiSuggest = async (mode: "new" | "edit") => {
        const title = mode === "new" ? newTemplateName : editName
        const description = mode === "new" ? newTemplateDesc : editDesc
        if (!title.trim()) return

        setGeneratingAi(mode)
        try {
            const res = await fetch("/api/ai/template-subtasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description }),
            })
            if (res.ok) {
                const { suggestions } = await res.json()
                const newItems: SubtaskForm[] = suggestions.map((s: string) => ({ title: s, description: "" }))
                if (mode === "new") {
                    setNewTemplateSubtasks([...newTemplateSubtasks, ...newItems])
                } else {
                    setEditSubtasks([...editSubtasks, ...newItems])
                }
                toast.success(`${suggestions.length} alt görev önerisi eklendi ✨`)
            }
        } catch {
            toast.error("AI önerisi alınamadı")
        } finally {
            setGeneratingAi(null)
        }
    }

    const handleAiFixDesc = async (mode: "new" | "edit") => {
        const title = mode === "new" ? newTemplateName : editName
        const description = mode === "new" ? newTemplateDesc : editDesc
        if (!title.trim() || !description.trim()) return

        setFixingDesc(mode)
        try {
            const res = await fetch("/api/ai/template-description", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description }),
            })
            if (res.ok) {
                const { description: improved } = await res.json()
                if (mode === "new") setNewTemplateDesc(improved)
                else setEditDesc(improved)
                toast.success("Açıklama iyileştirildi ✏️")
            }
        } catch {
            toast.error("AI düzeltme başarısız")
        } finally {
            setFixingDesc(null)
        }
    }

    return (
        <div className="mt-6 space-y-6" onClick={() => setConfirmDeleteId(null)}>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Templateler</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Template seçerek hızlıca görev oluştur</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation()
                        setShowNewForm(!showNewForm)
                        setNewTemplateName("")
                        setNewTemplateSubtasks([])
                        setNewTemplateGroups([])
                        setEditingTemplate(null)
                    }}
                >
                    {showNewForm ? "İptal" : "+ Yeni Template"}
                </Button>
            </div>

            {/* Yeni Template Formu */}
            {showNewForm && (
                <Card className="border-dashed border-indigo-300 dark:border-indigo-700" onClick={e => e.stopPropagation()}>
                    <CardContent className="p-4 space-y-3">
                        <div className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Yeni Template Oluştur</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input
                                placeholder="Template adı *"
                                value={newTemplateName}
                                onChange={e => setNewTemplateName(e.target.value)}
                                className="h-9"
                            />
                            <Input
                                placeholder="Açıklama (opsiyonel)"
                                value={newTemplateDesc}
                                onChange={e => setNewTemplateDesc(e.target.value)}
                                className="h-9 text-sm"
                            />
                        </div>
                        {userGroups.length > 0 && (
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-500">Görünürlük (Gruplar)</label>
                                <div className="flex flex-wrap gap-2">
                                    {userGroups.map(g => (
                                        <button
                                            key={g.id}
                                            type="button"
                                            onClick={() => {
                                                if (newTemplateGroups.includes(g.id)) setNewTemplateGroups(newTemplateGroups.filter(id => id !== g.id))
                                                else setNewTemplateGroups([...newTemplateGroups, g.id])
                                            }}
                                            className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${newTemplateGroups.includes(g.id)
                                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-300"
                                                    : "bg-white border-zinc-200 text-zinc-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400"
                                                }`}
                                        >
                                            {g.name}
                                        </button>
                                    ))}
                                    {newTemplateGroups.length === 0 && <span className="text-[11px] text-zinc-400 py-1 pl-1">Sadece sen görebilirsin (Özel)</span>}
                                </div>
                            </div>
                        )}
                        <AiButtons
                            onSuggest={() => handleAiSuggest("new")}
                            onFixDesc={() => handleAiFixDesc("new")}
                            suggesting={generatingAi === "new"}
                            fixing={fixingDesc === "new"}
                            suggestDisabled={!newTemplateName.trim()}
                            fixDisabled={!newTemplateName.trim() || !newTemplateDesc.trim()}
                        />
                        <SubtaskList
                            items={newTemplateSubtasks}
                            onUpdate={updateNewSubtask}
                            onRemove={i => setNewTemplateSubtasks(newTemplateSubtasks.filter((_, j) => j !== i))}
                            onAdd={() => setNewTemplateSubtasks([...newTemplateSubtasks, { title: "", description: "" }])}
                        />
                        <div className="flex gap-2 pt-1">
                            <Button size="sm" className="h-8" onClick={handleSaveNewTemplate} disabled={savingTemplate || !newTemplateName.trim()}>
                                {savingTemplate ? "Kaydediliyor..." : "Kaydet"}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 text-zinc-500" onClick={() => setShowNewForm(false)}>
                                İptal
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Template Kartları */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : templates.length === 0 ? (
                <div className="text-center py-16 border border-dashed rounded-xl text-zinc-500">
                    <p className="text-sm">Henüz template yok.</p>
                    <p className="text-xs text-zinc-400 mt-1">"+ Yeni Template" ile oluşturabilirsin.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(t => {
                        const isSelected = selectedTemplate?.id === t.id
                        const isEditing = editingTemplate?.id === t.id
                        const isConfirmDelete = confirmDeleteId === t.id
                        const canManage = t.createdById === user.id || user.role === "ADMIN"
                        return (
                            <Card
                                key={t.id}
                                onClick={() => handleSelectTemplate(t)}
                                className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${isEditing
                                        ? "ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-900/20"
                                        : isSelected
                                            ? "ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                            : "hover:ring-1 hover:ring-indigo-300"
                                    }`}
                            >
                                <div className={`h-1.5 ${isEditing ? "bg-amber-400" : "bg-indigo-500"}`} />
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-semibold text-sm leading-tight">{t.name}</h3>
                                        {canManage && (
                                            <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                                                {/* Edit butonu */}
                                                <button
                                                    onClick={e => handleStartEdit(t, e)}
                                                    className={`text-zinc-400 hover:text-amber-500 transition-colors ${isEditing ? "text-amber-500" : ""}`}
                                                    title="Düzenle"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                </button>
                                                {/* Delete / Confirm */}
                                                {isConfirmDelete ? (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-red-500">Emin misin?</span>
                                                        <button
                                                            onClick={e => { e.stopPropagation(); doDelete(t.id) }}
                                                            className="text-[10px] text-red-500 hover:text-red-700 font-medium"
                                                        >Evet</button>
                                                        <button
                                                            onClick={e => { e.stopPropagation(); setConfirmDeleteId(null) }}
                                                            className="text-[10px] text-zinc-400 hover:text-zinc-600"
                                                        >Hayır</button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={e => handleDeleteClick(t.id, e)}
                                                        className="text-zinc-300 hover:text-red-500 transition-colors"
                                                        title="Sil"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {t.description && (
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{t.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                                        <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">
                                            {t.subtasks?.length || 0} alt görev
                                        </span>
                                        {t.createdBy?.name && <span>· {t.createdBy.name}</span>}
                                    </div>
                                    {t.subtasks?.length > 0 && (
                                        <ul className="space-y-0.5 mt-1">
                                            {t.subtasks.slice(0, 3).map((st: any) => (
                                                <li key={st.id} className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                                                    <span className="w-1 h-1 rounded-full bg-zinc-300 shrink-0" />
                                                    <span className="truncate">{st.title}</span>
                                                </li>
                                            ))}
                                            {t.subtasks.length > 3 && (
                                                <li className="text-[11px] text-zinc-400 ml-2.5">+{t.subtasks.length - 3} daha...</li>
                                            )}
                                        </ul>
                                    )}
                                    {t.groups?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {t.groups.map((g: any) => (
                                                <span key={g.id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                                    {g.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Edit Paneli */}
            {editingTemplate && (
                <div className="border rounded-xl p-5 bg-white dark:bg-zinc-900 shadow-sm space-y-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-amber-400 rounded-full" />
                        <h3 className="font-semibold text-sm text-amber-600 dark:text-amber-400">Template Düzenle</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-500">Başlık *</label>
                            <Input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                placeholder="Template adı"
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-500">Açıklama</label>
                            <Input
                                value={editDesc}
                                onChange={e => setEditDesc(e.target.value)}
                                placeholder="Açıklama (opsiyonel)"
                                className="h-9 text-sm"
                            />
                        </div>
                    </div>

                    {userGroups.length > 0 && (
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-500">Görünürlük (Gruplar)</label>
                            <div className="flex flex-wrap gap-2">
                                {userGroups.map(g => (
                                    <button
                                        key={g.id}
                                        type="button"
                                        onClick={() => {
                                            if (editGroups.includes(g.id)) setEditGroups(editGroups.filter(id => id !== g.id))
                                            else setEditGroups([...editGroups, g.id])
                                        }}
                                        className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${editGroups.includes(g.id)
                                                ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-300"
                                                : "bg-white border-zinc-200 text-zinc-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400"
                                            }`}
                                    >
                                        {g.name}
                                    </button>
                                ))}
                                {editGroups.length === 0 && <span className="text-[11px] text-zinc-400 py-1 pl-1">Sadece sen görebilirsin (Özel)</span>}
                            </div>
                        </div>
                    )}

                    <AiButtons
                        onSuggest={() => handleAiSuggest("edit")}
                        onFixDesc={() => handleAiFixDesc("edit")}
                        suggesting={generatingAi === "edit"}
                        fixing={fixingDesc === "edit"}
                        suggestDisabled={!editName.trim()}
                        fixDisabled={!editName.trim() || !editDesc.trim()}
                    />

                    <SubtaskList
                        items={editSubtasks}
                        onUpdate={updateEditSubtask}
                        onRemove={i => setEditSubtasks(editSubtasks.filter((_, j) => j !== i))}
                        onAdd={() => setEditSubtasks([...editSubtasks, { title: "", description: "" }])}
                    />

                    <div className="flex gap-2">
                        <Button onClick={handleSaveEdit} disabled={savingEdit || !editName.trim()} className="h-9">
                            {savingEdit ? "Güncelleniyor..." : "Güncelle"}
                        </Button>
                        <Button variant="ghost" className="h-9 text-zinc-500" onClick={() => setEditingTemplate(null)}>
                            İptal
                        </Button>
                    </div>
                </div>
            )}

            {/* Görev Oluşturma Formu */}
            {selectedTemplate && (
                <div className="border rounded-xl p-5 bg-white dark:bg-zinc-900 shadow-sm space-y-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                        <h3 className="font-semibold text-sm">
                            <span className="text-indigo-600">{selectedTemplate.name}</span> şablonundan görev oluştur
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-500">Başlık</label>
                            <Input
                                value={taskTitle}
                                onChange={e => setTaskTitle(e.target.value)}
                                placeholder="Görev başlığı"
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-500">Tarih</label>
                            <input
                                type="date"
                                value={taskDate}
                                onChange={e => setTaskDate(e.target.value)}
                                className="w-full h-9 text-sm border border-input bg-background rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-500">Atanacak kişi</label>
                        <select
                            value={taskAssignee}
                            onChange={e => setTaskAssignee(e.target.value)}
                            className="w-full h-9 text-sm border border-input bg-background rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value={user.id}>Kendim ({user.name})</option>
                            {groupMembers.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        {groupMembers.length === 0 && (
                            <p className="text-xs text-zinc-400">Henüz bir gruba dahil değilsin.</p>
                        )}
                    </div>

                    {selectedTemplate.subtasks?.length > 0 && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
                            <div className="text-xs font-medium text-indigo-700 dark:text-indigo-400 mb-1.5">
                                Eklenecek {selectedTemplate.subtasks.length} alt görev:
                            </div>
                            <ul className="space-y-0.5">
                                {selectedTemplate.subtasks.map((st: any) => (
                                    <li key={st.id} className="text-xs text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                                        {st.title}
                                        {st.description && <span className="text-indigo-400">— {st.description}</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button onClick={handleCreateFromTemplate} disabled={creating || !taskTitle.trim()} className="h-9">
                            {creating ? "Oluşturuluyor..." : "Görev Oluştur"}
                        </Button>
                        <Button variant="ghost" className="h-9 text-zinc-500" onClick={() => setSelectedTemplate(null)}>
                            İptal
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
