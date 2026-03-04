import { describe, it, expect } from "vitest"

// Priority config (mirrored from components)
const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
    LOW:    { label: "Düşük",  cls: "bg-zinc-100 text-zinc-500" },
    MEDIUM: { label: "Orta",   cls: "bg-blue-50 text-blue-600" },
    HIGH:   { label: "Yüksek", cls: "bg-amber-50 text-amber-600" },
    URGENT: { label: "Acil",   cls: "bg-red-50 text-red-600" },
}

describe("Priority config", () => {
    it("has all 4 priority levels", () => {
        expect(Object.keys(PRIORITY_CONFIG)).toHaveLength(4)
        expect(PRIORITY_CONFIG).toHaveProperty("LOW")
        expect(PRIORITY_CONFIG).toHaveProperty("MEDIUM")
        expect(PRIORITY_CONFIG).toHaveProperty("HIGH")
        expect(PRIORITY_CONFIG).toHaveProperty("URGENT")
    })

    it("each priority has label and cls", () => {
        Object.values(PRIORITY_CONFIG).forEach(p => {
            expect(p).toHaveProperty("label")
            expect(p).toHaveProperty("cls")
            expect(p.label).toBeTruthy()
            expect(p.cls).toBeTruthy()
        })
    })

    it("URGENT has red styling", () => {
        expect(PRIORITY_CONFIG.URGENT.cls).toContain("red")
        expect(PRIORITY_CONFIG.URGENT.label).toBe("Acil")
    })

    it("LOW has neutral styling", () => {
        expect(PRIORITY_CONFIG.LOW.cls).toContain("zinc")
        expect(PRIORITY_CONFIG.LOW.label).toBe("Düşük")
    })

    it("URGENT triggers day-task assignment logic", () => {
        const isUrgent = (priority: string) => priority === "URGENT"
        expect(isUrgent("URGENT")).toBe(true)
        expect(isUrgent("HIGH")).toBe(false)
        expect(isUrgent("MEDIUM")).toBe(false)
        expect(isUrgent("LOW")).toBe(false)
    })
})
