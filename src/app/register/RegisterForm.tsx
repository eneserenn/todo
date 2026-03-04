"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegisterForm({ managers }: { managers: { id: string, name: string }[] }) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [role, setRole] = useState<"ADMIN" | "MANAGER" | "EMPLOYEE">("EMPLOYEE")

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const name = formData.get("name") as string
        const email = formData.get("email") as string
        const password = formData.get("password") as string
        const managerId = formData.get("managerId") as string

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name, email, password, role,
                    managerId: role === "EMPLOYEE" ? managerId : undefined
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Registration failed")
            }

            router.push("/login")
        } catch (err: any) {
            setError(err.message)
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <Card className="w-full max-w-sm shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">Hesap Oluştur</CardTitle>
                    <CardDescription>
                        Todo App ekibine katıl
                    </CardDescription>
                </CardHeader>
                <form onSubmit={onSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="name">Ad Soyad</Label>
                            <Input id="name" name="name" placeholder="Ad Soyad" required disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">E-posta</Label>
                            <Input id="email" name="email" type="email" placeholder="m@example.com" required disabled={isLoading} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Rol</Label>
                            <select
                                id="role"
                                name="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value as any)}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="EMPLOYEE">Çalışan</option>
                                <option value="MANAGER">Yönetici</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>

                        {role === "EMPLOYEE" && (
                            <div className="space-y-2">
                                <Label htmlFor="managerId">Yönetici Seç</Label>
                                <select
                                    id="managerId"
                                    name="managerId"
                                    required
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">-- Yönetici Seçin --</option>
                                    {managers.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="password">Şifre</Label>
                            <Input id="password" name="password" type="password" required disabled={isLoading} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Kaydediliyor..." : "Kayıt Ol"}
                        </Button>
                        <div className="text-sm text-center text-zinc-500">
                            Zaten hesabın var mı?{" "}
                            <Link href="/login" className="text-blue-600 hover:text-blue-500 hover:underline">
                                Giriş yap
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
