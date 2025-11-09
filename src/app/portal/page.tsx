import PortalView from "@/components/PortalView";

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Clinic Portal</div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <PortalView />
      </main>
    </div>
  );
}
