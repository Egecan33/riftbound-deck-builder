// Placeholder until the UI task lands (plan Task 11).
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col justify-center gap-3 px-6">
      <h1 className="text-3xl font-semibold">Riftbound Forge</h1>
      <p className="text-mist">
        Deck builder and theorycrafting tool for the Riftbound TCG. The app is under construction: run{' '}
        <code className="text-rift">pnpm sync</code> once the data stage lands.
      </p>
      <p className="text-xs text-mist">
        Fan project, not endorsed by Riot Games.
      </p>
    </main>
  );
}
