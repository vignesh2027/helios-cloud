import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5">
      <div className="text-7xl font-black font-mono" style={{ color: 'rgb(var(--border))' }}>404</div>
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'rgb(var(--fg))' }}>Page Not Found</h2>
        <p className="text-sm mt-1" style={{ color: 'rgb(var(--fg-muted))' }}>
          This route doesn&apos;t exist in the HELIOS dashboard.
        </p>
      </div>
      <Link href="/" className="btn-primary">
        ← Back to Overview
      </Link>
    </div>
  );
}
