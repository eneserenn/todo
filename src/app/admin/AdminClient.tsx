"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface Setting {
    key: string
    label: string
    group: string
    value: string
}

interface Prompt {
    name: string
    label: string
    content: string
    isCustomized: boolean
}

interface UserInfo {
    id: string
    name: string
    email: string
    role: string
}

interface Group {
    id: string
    name: string
    description: string | null
    color: string
    members: UserInfo[]
    managers: UserInfo[]
}

interface Props {
    settings: Setting[]
    prompts: Prompt[]
    groups: Group[]
    allUsers: UserInfo[]
}

const GROUP_COLORS = ["#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#ef4444", "#0ea5e9"]

export default function AdminClient({ settings: initialSettings, prompts: initialPrompts, groups: initialGroups, allUsers }: Props) {
    const [settings, setSettings] = useState<Setting[]>(initialSettings)
    const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts)
    const [groups, setGroups] = useState<Group[]>(initialGroups)
    const [savingKey, setSavingKey] = useState<string | null>(null)
    const [savedKey, setSavedKey] = useState<string | null>(null)

    // Group creation
    const [newGroupName, setNewGroupName] = useState("")
    const [newGroupDesc, setNewGroupDesc] = useState("")
    const [newGroupColor, setNewGroupColor] = useState("#6366f1")
    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)

    const showSaved = (key: string) => {
        setSavedKey(key)
        setTimeout(() => setSavedKey(null), 2000)
    }

    const handleSaveSetting = async (key: string) => {
        const setting = settings.find(s => s.key === key)
        if (!setting) return
        setSavingKey(key)
        try {
            await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, value: setting.value }),
            })
            toast.success("Ayar kaydedildi")
            showSaved(key)
        } finally {
            setSavingKey(null)
        }
    }

    const handleSavePrompt = async (name: string) => {
        const prompt = prompts.find(p => p.name === name)
        if (!prompt) return
        setSavingKey(name)
        try {
            await fetch("/api/admin/prompts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, content: prompt.content }),
            })
            setPrompts(prompts.map(p => p.name === name ? { ...p, isCustomized: true } : p))
            toast.success("Prompt kaydedildi")
            showSaved(name)
        } finally {
            setSavingKey(null)
        }
    }

    const handleResetPrompt = async (name: string) => {
        setSavingKey(`reset-${name}`)
        try {
            await fetch("/api/admin/prompts", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            })
            const res = await fetch("/api/admin/prompts")
            if (res.ok) {
                const data = await res.json()
                const updated = data.prompts.find((p: Prompt) => p.name === name)
                if (updated) {
                    setPrompts(prompts.map(p => p.name === name ? updated : p))
                }
            }
            toast.success("Prompt sıfırlandı")
            showSaved(`reset-${name}`)
        } finally {
            setSavingKey(null)
        }
    }

    // ---- GROUP MANAGEMENT ----
    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return
        const res = await fetch("/api/admin/groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newGroupName.trim(), description: newGroupDesc.trim(), color: newGroupColor }),
        })
        if (res.ok) {
            const { group } = await res.json()
            setGroups([...groups, group])
            setNewGroupName("")
            setNewGroupDesc("")
            setNewGroupColor("#6366f1")
            toast.success("Grup oluşturuldu")
        } else {
            const err = await res.json()
            toast.error(err.error || "Grup oluşturulamadı")
        }
    }

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm("Bu grubu silmek istediğinden emin misin?")) return
        await fetch(`/api/admin/groups/${groupId}`, { method: "DELETE" })
        setGroups(groups.filter(g => g.id !== groupId))
        toast.success("Grup silindi")
    }

    const handleAddMember = async (groupId: string, userId: string) => {
        await fetch(`/api/admin/groups/${groupId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ addMemberId: userId }),
        })
        const user = allUsers.find(u => u.id === userId)
        if (user) {
            setGroups(groups.map(g =>
                g.id === groupId ? { ...g, members: [...g.members, user] } : g
            ))
            toast.success(`${user.name} gruba eklendi`)
        }
    }

    const handleRemoveMember = async (groupId: string, userId: string) => {
        await fetch(`/api/admin/groups/${groupId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ removeMemberId: userId }),
        })
        setGroups(groups.map(g =>
            g.id === groupId ? { ...g, members: g.members.filter(m => m.id !== userId) } : g
        ))
        toast.success("Üye çıkarıldı")
    }

    const handleAddManager = async (groupId: string, userId: string) => {
        await fetch(`/api/admin/groups/${groupId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ addManagerId: userId }),
        })
        const user = allUsers.find(u => u.id === userId)
        if (user) {
            setGroups(groups.map(g =>
                g.id === groupId ? { ...g, managers: [...g.managers, user] } : g
            ))
            toast.success(`${user.name} yönetici olarak eklendi`)
        }
    }

    const handleRemoveManager = async (groupId: string, userId: string) => {
        await fetch(`/api/admin/groups/${groupId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ removeManagerId: userId }),
        })
        setGroups(groups.map(g =>
            g.id === groupId ? { ...g, managers: g.managers.filter(m => m.id !== userId) } : g
        ))
        toast.success("Yönetici çıkarıldı")
    }

    const roleLabel = (role: string) => {
        switch (role) {
            case "ADMIN": return "Admin"
            case "MANAGER": return "Yönetici"
            default: return "Çalışan"
        }
    }

    return (
        <div className="space-y-8 mt-6">
            <div>
                <h1 className="text-2xl font-bold">Admin Paneli</h1>
                <p className="text-zinc-500 text-sm mt-1">Uygulama ayarlarını buradan yönetin.</p>
            </div>

            {/* ============ USER GROUPS ============ */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">👥 Kullanıcı Grupları</CardTitle>
                    <CardDescription>Gruplar oluşturun, kullanıcı atayın ve yönetici belirleyin. Yöneticiler birden fazla grubun sorumlusu olabilir.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Create group form */}
                    <div className="flex flex-col sm:flex-row gap-2 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <Input
                            placeholder="Grup adı"
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                            className="flex-1"
                        />
                        <Input
                            placeholder="Açıklama (opsiyonel)"
                            value={newGroupDesc}
                            onChange={e => setNewGroupDesc(e.target.value)}
                            className="flex-1"
                        />
                        <div className="flex gap-1 items-center">
                            {GROUP_COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setNewGroupColor(c)}
                                    className={`w-6 h-6 rounded-full border-2 transition-all ${newGroupColor === c ? "border-zinc-900 dark:border-white scale-110" : "border-transparent"}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                        <Button onClick={handleCreateGroup} className="shrink-0">Grup Oluştur</Button>
                    </div>

                    {/* Groups list */}
                    {groups.length === 0 ? (
                        <div className="text-center text-zinc-400 py-8 border border-dashed rounded-xl">
                            Henüz grup oluşturulmadı.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {groups.map(group => (
                                <div key={group.id} className="border rounded-xl overflow-hidden">
                                    {/* Group header */}
                                    <div
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                        onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                                            <div>
                                                <span className="font-semibold">{group.name}</span>
                                                {group.description && (
                                                    <span className="text-sm text-zinc-500 ml-2">{group.description}</span>
                                                )}
                                            </div>
                                            <span className="text-xs text-zinc-400">
                                                {group.members.length} üye · {group.managers.length} yönetici
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={e => { e.stopPropagation(); handleDeleteGroup(group.id) }}
                                                className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                                            >Sil</button>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${expandedGroupId === group.id ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>

                                    {/* Expanded section */}
                                    {expandedGroupId === group.id && (
                                        <div className="border-t px-4 py-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                                            {/* Managers */}
                                            <div>
                                                <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">🔑 Yöneticiler</Label>
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {group.managers.map(m => (
                                                        <span key={m.id} className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full px-2.5 py-1 font-medium">
                                                            {m.name}
                                                            <button
                                                                onClick={() => handleRemoveManager(group.id, m.id)}
                                                                className="hover:text-red-500 ml-0.5"
                                                            >×</button>
                                                        </span>
                                                    ))}
                                                    {group.managers.length === 0 && <span className="text-xs text-zinc-400">Henüz yönetici atanmadı</span>}
                                                </div>
                                                <select
                                                    onChange={e => { if (e.target.value) handleAddManager(group.id, e.target.value); e.target.value = "" }}
                                                    className="text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>Yönetici ekle...</option>
                                                    {allUsers.filter(u => u.role === "MANAGER" && !group.managers.find(m => m.id === u.id)).map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Members */}
                                            <div>
                                                <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">👤 Üyeler</Label>
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {group.members.map(m => (
                                                        <span key={m.id} className="inline-flex items-center gap-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full px-2.5 py-1 font-medium">
                                                            {m.name}
                                                            <span className="text-[10px] text-zinc-400">({roleLabel(m.role)})</span>
                                                            <button
                                                                onClick={() => handleRemoveMember(group.id, m.id)}
                                                                className="hover:text-red-500 ml-0.5"
                                                            >×</button>
                                                        </span>
                                                    ))}
                                                    {group.members.length === 0 && <span className="text-xs text-zinc-400">Henüz üye eklenmedi</span>}
                                                </div>
                                                <select
                                                    onChange={e => { if (e.target.value) handleAddMember(group.id, e.target.value); e.target.value = "" }}
                                                    className="text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>Üye ekle...</option>
                                                    {allUsers.filter(u => !group.members.find(m => m.id === u.id)).map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} - {roleLabel(u.role)} ({u.email})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ============ AI CONNECTION SETTINGS ============ */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">🤖 AI Bağlantısı</CardTitle>
                    <CardDescription>Yerel LLM sunucusunun adresi ve kullanılacak model.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {settings.map(setting => (
                        <div key={setting.key} className="space-y-1.5">
                            <Label htmlFor={setting.key}>
                                {setting.label}
                                {setting.key === "llm_api_key" && (
                                    <span className="ml-2 text-xs text-zinc-400 font-normal">Local LLM kullanıyorsan boş bırak</span>
                                )}
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id={setting.key}
                                    type={setting.key === "llm_api_key" ? "password" : "text"}
                                    value={setting.value}
                                    onChange={e => setSettings(settings.map(s => s.key === setting.key ? { ...s, value: e.target.value } : s))}
                                    className="font-mono text-sm"
                                    placeholder={
                                        setting.key === "llm_endpoint" ? "http://localhost:11434/v1" :
                                            setting.key === "llm_api_key" ? "sk-..." :
                                                "llama3"
                                    }
                                />
                                <Button
                                    size="sm"
                                    onClick={() => handleSaveSetting(setting.key)}
                                    disabled={savingKey === setting.key}
                                    className="shrink-0"
                                >
                                    {savingKey === setting.key ? "Kaydediliyor..." : savedKey === setting.key ? "Kaydedildi ✓" : "Kaydet"}
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* ============ AI PROMPTS ============ */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">📝 AI Promptları</CardTitle>
                    <CardDescription>
                        Yapay zeka özelliklerinin sistem promptlarını özelleştirin. Sıfırla ile varsayılana dönebilirsiniz.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {prompts.map(prompt => (
                        <div key={prompt.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor={prompt.name} className="text-sm font-medium">
                                    {prompt.label}
                                    {prompt.isCustomized && (
                                        <span className="ml-2 text-xs text-purple-600 font-normal">özelleştirilmiş</span>
                                    )}
                                </Label>
                                <div className="flex gap-2">
                                    {prompt.isCustomized && (
                                        <button
                                            onClick={() => handleResetPrompt(prompt.name)}
                                            disabled={savingKey === `reset-${prompt.name}`}
                                            className="text-xs text-zinc-400 hover:text-zinc-600 disabled:opacity-50"
                                        >
                                            {savingKey === `reset-${prompt.name}` ? "Sıfırlanıyor..." : "Sıfırla"}
                                        </button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSavePrompt(prompt.name)}
                                        disabled={savingKey === prompt.name}
                                        className="h-7 px-3 text-xs"
                                    >
                                        {savingKey === prompt.name ? "Kaydediliyor..." : savedKey === prompt.name ? "Kaydedildi ✓" : "Kaydet"}
                                    </Button>
                                </div>
                            </div>
                            <textarea
                                id={prompt.name}
                                value={prompt.content}
                                onChange={e => setPrompts(prompts.map(p => p.name === prompt.name ? { ...p, content: e.target.value } : p))}
                                rows={4}
                                className="w-full text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
