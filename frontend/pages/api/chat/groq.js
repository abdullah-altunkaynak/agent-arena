export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const localApiBase = "http://127.0.0.1:8000";
    const remoteApiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.agentarena.me";
    const apiBase = process.env.NODE_ENV === "development" ? localApiBase : remoteApiBase;

    try {
        const upstream = await fetch(`${apiBase}/api/chat/groq`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(req.body || {}),
        });

        const data = await upstream.json();
        if (!upstream.ok) {
            const message = data?.detail || data?.error || "Groq request failed";
            return res.status(upstream.status).json({ error: message });
        }

        const answer = data?.answer;
        if (!answer) {
            return res.status(502).json({ error: "No response from Groq" });
        }

        return res.status(200).json({ answer });
    } catch (error) {
        return res.status(502).json({ error: "Failed to connect to Groq" });
    }
}
