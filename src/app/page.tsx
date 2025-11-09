import Link from "next/link";
import ChatTriage from "@/components/ChatTriage";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Footcare Clinic</div>
          <nav className="text-sm text-zinc-700">
            <Link href="/portal" className="hover:underline">Client Portal</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Triage Assistant</h1>
        <ChatTriage />
      </main>
    </div>
  );
}
