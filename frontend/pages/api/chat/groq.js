const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT =
    "You are Agent Arena AI assistant. Help users understand Agent Arena features, scenarios, agents, and AI/technology topics with concise and practical answers.";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "Missing GROQ_API_KEY on server" });
    }

    const { question, messages } = req.body || {};
    const normalizedMessages = Array.isArray(messages)
        ? messages
            .filter((m) => m && typeof m.content === "string" && ["user", "assistant"].includes(m.role))
            .slice(-10)
        : [];

    const fallbackQuestion = typeof question === "string" ? question.trim() : "";

    if (!normalizedMessages.length && !fallbackQuestion) {
        return res.status(400).json({ error: "Question is required" });
    }

    try {
        const chatMessages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...normalizedMessages,
            ...(fallbackQuestion ? [{ role: "user", content: fallbackQuestion }] : []),
        ];

        const upstream = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                temperature: 0.4,
                max_tokens: 700,
                messages: chatMessages,
            }),
        });

        const data = await upstream.json();
        if (!upstream.ok) {
            const message = data?.error?.message || "Groq request failed";
            return res.status(upstream.status).json({ error: message });
        }

        const answer = data?.choices?.[0]?.message?.content;
        if (!answer) {
            return res.status(502).json({ error: "No response from Groq" });
        }

        return res.status(200).json({ answer });
    } catch (error) {
        return res.status(502).json({ error: "Failed to connect to Groq" });
    }
}
