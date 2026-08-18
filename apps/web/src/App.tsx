import { DEV_USER } from "@terrarium/contracts";

export default function App() {
  return (
    <main className="min-h-screen bg-zinc-950 p-8 font-sans text-zinc-100">
      <h1 className="text-2xl font-semibold">Terrarium</h1>
      <p className="mt-2 text-zinc-400">Parent UI stub. Prompt shell lands in P1-S2.</p>
      <p className="mt-4 text-sm text-zinc-500">actor: {DEV_USER}</p>
    </main>
  );
}
