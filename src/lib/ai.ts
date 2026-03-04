import OpenAI from "openai"
import prisma from "./prisma"

// Cache to avoid hitting DB on every AI call
let cachedConfig: { endpoint: string; apiKey: string; model: string } | null = null
let cacheTime = 0
const CACHE_TTL = 60_000 // 1 minute

async function getAiConfig() {
    const now = Date.now()
    if (cachedConfig && now - cacheTime < CACHE_TTL) {
        return cachedConfig
    }

    try {
        const settings = await prisma.setting.findMany({
            where: { key: { in: ["llm_endpoint", "llm_api_key", "llm_model"] } },
        })

        const get = (key: string, fallback: string) =>
            settings.find((s) => s.key === key)?.value || fallback

        cachedConfig = {
            endpoint: get("llm_endpoint", process.env.LOCAL_LLM_URL || "http://host.docker.internal:11434/v1"),
            apiKey: get("llm_api_key", "local-no-key"),
            model: get("llm_model", "llama3"),
        }
        cacheTime = now
    } catch {
        // DB not ready yet — use env fallbacks
        cachedConfig = {
            endpoint: process.env.LOCAL_LLM_URL || "http://host.docker.internal:11434/v1",
            apiKey: "local-no-key",
            model: "llama3",
        }
    }

    return cachedConfig
}

export async function getAiClient() {
    const config = await getAiConfig()
    const client = new OpenAI({
        apiKey: config.apiKey || "local-no-key",
        baseURL: config.endpoint,
    })
    return { client, model: config.model }
}

// Keep a simple default export for backward compat (used by routes that already import it)
const openai = new OpenAI({
    apiKey: "local-no-key",
    baseURL: process.env.LOCAL_LLM_URL || "http://host.docker.internal:11434/v1",
})

export default openai
