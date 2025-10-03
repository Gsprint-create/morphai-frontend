export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card w-full max-w-md space-y-3 text-center">
        <h1 className="text-2xl font-bold">You’re offline</h1>
        <p className="opacity-80">
          Some features (like swapping) need a connection. Try again when you’re back online.
        </p>
      </div>
    </main>
  );
}
