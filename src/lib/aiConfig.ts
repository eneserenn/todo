import OpenAI from "openai"
import prisma from "./prisma"

export async function getAiSettings(): Promise<{ model: string; endpoint: string; apiKey: string }> {
    const [endpointSetting, modelSetting, apiKeySetting] = await Promise.all([
        prisma.setting.findUnique({ where: { key: "llm_endpoint" } }),
        prisma.setting.findUnique({ where: { key: "llm_model" } }),
        prisma.setting.findUnique({ where: { key: "llm_api_key" } }),
    ])

    return {
        endpoint: endpointSetting?.value || process.env.LOCAL_LLM_URL || "http://localhost:11434/v1",
        model: modelSetting?.value || "llama3",
        apiKey: apiKeySetting?.value || "local-no-key",
    }
}

export function createAiClient(endpoint: string, apiKey: string): OpenAI {
    return new OpenAI({
        apiKey,
        baseURL: endpoint,
    })
}
