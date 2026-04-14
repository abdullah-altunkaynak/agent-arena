import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, SendHorizonal, Sparkles, LoaderCircle } from "lucide-react";

const INITIAL_ASSISTANT_MESSAGE = {
    role: "assistant",
    content:
        "Hi, I am the Agent Arena AI assistant. Ask me about our agents, scenarios, technology stack, or artificial intelligence workflows.",
};

export default function AIChatSection() {
    const [messages, setMessages] = useState([INITIAL_ASSISTANT_MESSAGE]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const messagesContainerRef = useRef(null);

    const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

    useEffect(() => {
        if (!messagesContainerRef.current) return;
        messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages, loading]);

    const sendMessage = async (event) => {
        event.preventDefault();
        const content = input.trim();
        if (!content || loading) return;

        const nextMessages = [...messages, { role: "user", content }];
        setMessages(nextMessages);
        setInput("");
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/chat/groq", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: nextMessages }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || "AI request failed");
            }

            setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
        } catch (requestError) {
            setError(requestError.message || "AI request failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="ai-chat" className="px-6 pt-8 pb-12">
            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="rounded-2xl border border-cyan-400/20 glass overflow-hidden"
                >
                    <div className="px-6 py-5 border-b border-cyan-400/10 bg-cyan-400/5 flex items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-1">Featured capability</p>
                            <h2 className="font-display font-bold text-2xl text-spark flex items-center gap-2">
                                <MessageSquare size={22} className="text-cyan-400" />
                                AI Chat powered by Groq
                            </h2>
                            <p className="text-wire text-sm mt-2">
                                Ask anything about Agent Arena, technology, artificial intelligence, agents, and our latest blog insights.
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-acid-400/10 border border-acid-400/20 text-acid-400">
                            <Sparkles size={12} />
                            LIVE CHAT
                        </span>
                    </div>

                    <div ref={messagesContainerRef} className="p-4 sm:p-6 space-y-3 max-h-[420px] overflow-y-auto bg-abyss/70">
                        {messages.map((message, index) => (
                            <div
                                key={`${message.role}-${index}`}
                                className={`w-full flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed border ${message.role === "user"
                                        ? "bg-cyan-400/12 border-cyan-400/25 text-spark"
                                        : "bg-forge border-[rgba(255,255,255,.08)] text-wire"
                                        }`}
                                >
                                    {message.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex items-center gap-2 text-cyan-400 text-sm font-mono">
                                <LoaderCircle size={14} className="animate-spin" />
                                Thinking...
                            </div>
                        )}
                    </div>

                    <form onSubmit={sendMessage} className="p-4 sm:p-6 border-t border-cyan-400/10 bg-void/70">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                placeholder="Ask Agent Arena AI anything..."
                                className="flex-1 px-4 py-3 rounded-xl bg-forge border border-[rgba(255,255,255,.08)] text-spark placeholder:text-mist focus:outline-none focus:border-cyan-400/35"
                            />
                            <button
                                type="submit"
                                disabled={!canSend}
                                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-mono text-sm font-medium bg-cyan-400/15 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <SendHorizonal size={14} />
                                Send
                            </button>
                        </div>
                        {error && <p className="text-rose-400 text-xs font-mono mt-3">{error}</p>}
                    </form>
                </motion.div>
            </div>
        </section>
    );
}
