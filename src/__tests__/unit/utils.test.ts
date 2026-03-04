import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

describe("cn() utility", () => {
    it("joins class names", () => {
        expect(cn("foo", "bar")).toBe("foo bar")
    })

    it("handles conditional classes", () => {
        expect(cn("base", false && "hidden", "visible")).toBe("base visible")
    })

    it("merges conflicting tailwind classes (last wins)", () => {
        const result = cn("bg-red-500", "bg-blue-500")
        expect(result).toBe("bg-blue-500")
    })

    it("handles undefined and null", () => {
        expect(cn("base", undefined, null as any)).toBe("base")
    })

    it("handles empty string", () => {
        expect(cn("", "foo")).toBe("foo")
    })
})
