import { getFileCategory } from "@/lib/drive-types";

interface FileIconProps {
  mimeType: string;
  size?: number;
  className?: string;
}

const iconColors: Record<string, string> = {
  folder: "#4f8ef7",
  image: "#34d399",
  video: "#a78bfa",
  audio: "#f472b6",
  pdf: "#f87171",
  spreadsheet: "#34d399",
  document: "#60a5fa",
  presentation: "#fb923c",
  archive: "#fbbf24",
  code: "#a78bfa",
  file: "#94a3b8",
};

export function FileIcon({ mimeType, size = 24, className }: FileIconProps) {
  const category = getFileCategory(mimeType);
  const color = iconColors[category] ?? iconColors.file;

  const icons: Record<string, React.ReactNode> = {
    folder: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 7C3 5.9 3.9 5 5 5H10L12 7H19C20.1 7 21 7.9 21 9V17C21 18.1 20.1 19 19 19H5C3.9 19 3 18.1 3 17V7Z" fill={color} opacity="0.9" />
        <path d="M3 9H21" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      </svg>
    ),
    image: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="3" fill={color} opacity="0.15" />
        <rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="1.5" />
        <circle cx="8.5" cy="8.5" r="1.5" fill={color} />
        <path d="M21 15L16 10L9 17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    video: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="3" fill={color} opacity="0.15" />
        <rect x="2" y="4" width="20" height="16" rx="3" stroke={color} strokeWidth="1.5" />
        <path d="M10 9L16 12L10 15V9Z" fill={color} />
      </svg>
    ),
    audio: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="3" fill={color} opacity="0.15" />
        <rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="1.5" />
        <path d="M9 18V9L18 6V15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="7" cy="18" r="2" fill={color} />
        <circle cx="16" cy="15" r="2" fill={color} />
      </svg>
    ),
    pdf: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="2" width="12" height="18" rx="2" fill={color} opacity="0.15" />
        <rect x="3" y="2" width="12" height="18" rx="2" stroke={color} strokeWidth="1.5" />
        <path d="M15 2L21 8V22H9M15 2V8H21" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 13H11M7 16H11M7 10H9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    spreadsheet: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" fill={color} opacity="0.15" />
        <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.5" />
        <path d="M3 9H21M3 15H21M9 3V21M15 3V21" stroke={color} strokeWidth="1" opacity="0.6" />
      </svg>
    ),
    document: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 2V8H20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 13H16M8 17H13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    presentation: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="14" rx="2" fill={color} opacity="0.15" />
        <rect x="2" y="3" width="20" height="14" rx="2" stroke={color} strokeWidth="1.5" />
        <path d="M12 17V21M8 21H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 12L11 9L13 11L15 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    archive: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="4" rx="1" fill={color} />
        <rect x="3" y="7" width="18" height="14" rx="2" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" />
        <path d="M10 11H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    code: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" fill={color} opacity="0.15" />
        <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.5" />
        <path d="M8 9L5 12L8 15M16 9L19 12L16 15M13 8L11 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    file: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M13 2H6C5.4 2 5 2.4 5 3V21C5 21.6 5.4 22 6 22H18C18.6 22 19 21.6 19 21V8L13 2Z" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M13 2V8H19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  };

  return (
    <span className={className} aria-hidden="true" style={{ display: "inline-flex", alignItems: "center" }}>
      {icons[category] ?? icons.file}
    </span>
  );
}
