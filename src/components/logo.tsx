/** Three amp stacks on a line: the backline. */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="8" width="5" height="11" rx="1" fill="var(--accent)" />
      <rect x="9.5" y="4" width="5" height="15" rx="1" fill="var(--accent)" opacity="0.75" />
      <rect x="17" y="10" width="5" height="9" rx="1" fill="var(--accent)" opacity="0.5" />
      <rect x="1" y="20.5" width="22" height="1.5" rx="0.75" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
