export default function App() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-3 w-24 rounded-full"
          style={{ backgroundColor: 'var(--color-bp-pink)' }}
        />
        <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--color-bp-text)' }}>
          BPTG{' '}
          <span style={{ color: 'var(--color-bp-pink)' }}>Schedule</span>{' '}
          Solver
        </h1>
        <p style={{ color: 'var(--color-bp-muted)' }} className="text-sm">
          Blackpink the Game · Optimal puzzle solver
        </p>
      </div>

      <div
        className="rounded-xl border px-8 py-6 text-center text-sm"
        style={{
          backgroundColor: 'var(--color-bp-surface)',
          borderColor: 'var(--color-bp-border)',
          color: 'var(--color-bp-muted)',
        }}
      >
        <p>🚧 Building phase by phase — come back soon.</p>
      </div>
    </div>
  );
}
