import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock Prisma before importing aiConfig
vi.mock("@/lib/prisma", () => ({
    default: {
        setting: {
            findUnique: vi.fn(),
        },
    },
}))

// OpenAI throws in jsdom (browser-like) env — mock with a real constructor function
vi.mock("openai", () => {
    function OpenAI(this: any, opts: any) {
        this._opts = opts
        this.chat = { completions: { create: vi.fn() } }
    }
    return { default: OpenAI }
})

import prisma from "@/lib/prisma"
import { getAiSettings, createAiClient } from "@/lib/aiConfig"

describe("getAiSettings()", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns defaults when DB has no settings", async () => {
        vi.mocked(prisma.setting.findUnique).mockResolvedValue(null)

        const settings = await getAiSettings()

        expect(settings).toHaveProperty("endpoint")
        expect(settings).toHaveProperty("model")
        expect(settings).toHaveProperty("apiKey")
        expect(settings.model).toBe("llama3")
    })

    it("returns DB values when settings exist", async () => {
        vi.mocked(prisma.setting.findUnique).mockImplementation(({ where }: any) => {
            if (where.key === "llm_endpoint") return Promise.resolve({ id: "1", key: "llm_endpoint", value: "http://custom:11434/v1", label: "Endpoint", group: "ai", createdAt: new Date(), updatedAt: new Date() })
            if (where.key === "llm_model") return Promise.resolve({ id: "2", key: "llm_model", value: "mistral", label: "Model", group: "ai", createdAt: new Date(), updatedAt: new Date() })
            if (where.key === "llm_api_key") return Promise.resolve({ id: "3", key: "llm_api_key", value: "sk-test", label: "API Key", group: "ai", createdAt: new Date(), updatedAt: new Date() })
            return Promise.resolve(null)
        })

        const settings = await getAiSettings()

        expect(settings.endpoint).toBe("http://custom:11434/v1")
        expect(settings.model).toBe("mistral")
        expect(settings.apiKey).toBe("sk-test")
    })
})

describe("createAiClient()", () => {
    it("returns an OpenAI-compatible client", () => {
        const client = createAiClient("http://localhost:11434/v1", "test-key")
        expect(client).toBeDefined()
        expect(client.chat).toBeDefined()
        expect(client.chat.completions).toBeDefined()
    })
})
