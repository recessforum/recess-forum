export function RecessMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#26364A" />
      <g transform="translate(20,14)">
        <circle cx="30" cy="8" r="3.5" fill="#F7F6F3" />
        <rect x="28" y="10" width="4" height="6" fill="#F7F6F3" />
        <path d="M10,42 Q10,15 30,15 Q50,15 50,42 L56,50 Q56,56 50,56 L10,56 Q4,56 4,50 Z" fill="#F7F6F3" />
        <rect x="4" y="56" width="52" height="4" rx="2" fill="#F7F6F3" />
        <line x1="30" y1="60" x2="30" y2="66" stroke="#F7F6F3" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="30" cy="71" r="4.5" fill="#B08D45" />
      </g>
    </svg>
  );
}
