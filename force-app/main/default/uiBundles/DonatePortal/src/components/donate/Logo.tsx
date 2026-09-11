/** Tidewell mark: three ripples. Decorative — the organisation name sits beside it. */
export function Logo({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="23" fill="#12302c" />
      <path d="M8 24c5-4 11-4 16 0s11 4 16 0" fill="none" stroke="#f6f1e7" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 31c4.5-3.5 9.5-3.5 14 0s9.5 3.5 14 0" fill="none" stroke="#f6f1e7" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
      <path d="M12 17c4-3 8-3 12 0s8 3 12 0" fill="none" stroke="#b93f22" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
