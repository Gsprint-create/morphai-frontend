// src/components/TopBar.tsx
type TopBarProps = { email?: string | null };

export default function TopBar({ email }: TopBarProps) {
  return (
    <header className="w-full border-b border-white/10">
      <div className="container py-4 flex items-center justify-between">
        <div className="text-lg font-semibold">MorphAI</div>
        <div className="text-sm opacity-80">
          {email ? <>Signed in as <span className="font-medium">{email}</span></> : "Not signed in"}
        </div>
      </div>
    </header>
  );
}
