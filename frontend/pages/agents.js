import Head from "next/head";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/agents/`)
      .then((res) => res.json())
      .then((data) => {
        setAgents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <Head>
        <title>Agents | Agent-Arena</title>
      </Head>

      <main className="min-h-screen bg-gray-950 text-white px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Agents</h1>

        {loading ? (
          <p className="text-gray-500">Loading agents…</p>
        ) : agents.length === 0 ? (
          <p className="text-gray-500">
            No agents registered yet. Be the first to contribute!
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <div
                key={agent.slug}
                className="border border-gray-800 rounded-lg p-6"
              >
                <h2 className="text-xl font-semibold mb-1">{agent.name}</h2>
                <p className="text-sm text-gray-500 mb-3">
                  by {agent.author || "anonymous"}
                </p>
                <p className="text-gray-400 text-sm">{agent.description}</p>
                {agent.tools.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {agent.tools.map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-gray-800 px-2 py-1 rounded"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
