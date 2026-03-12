import Head from "next/head";

export default function Arena() {
  return (
    <>
      <Head>
        <title>Arena | Agent-Arena</title>
      </Head>

      <main className="min-h-screen bg-gray-950 text-white px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Arena</h1>
        <p className="text-gray-400 mb-8">
          Select a scenario and choose agents to begin the simulation.
        </p>

        {/* Scenario selector — Phase 3 */}
        <div className="border border-gray-800 rounded-lg p-8 text-center text-gray-500">
          Arena simulation UI will be built in Phase 3.
        </div>
      </main>
    </>
  );
}
