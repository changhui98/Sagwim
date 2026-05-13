import { useId, type SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const BASE: IconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
}

export function BrandLogo(props: IconProps) {
  const rawId = useId()
  const gradId = `sagwim-strokeA-${rawId.replace(/:/g, '')}`
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      aria-hidden
      focusable={false}
      {...props}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9580" />
          <stop offset="55%" stopColor="#FF6B6B" />
          <stop offset="100%" stopColor="#E63E5C" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="248" height="248" rx="56"
        fill="none" stroke="#f08080" strokeWidth="4" />
      <g stroke={`url(#${gradId})`} strokeWidth="26" strokeLinecap="round" fill="none">
        <path d="M128 78 L72 184" />
        <path d="M128 78 L184 184" />
      </g>
      <circle cx="128" cy="78" r="4" fill="#FFFFFF" opacity={0.8} />
    </svg>
  )
}

export function HomeIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="44 44 168 168" fill="none" aria-hidden focusable={false} {...props}>
      <g stroke="currentColor" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round">
        <path d="M68 130 L128 72 L188 130 L188 188 L68 188 Z" />
        <path d="M110 188 L110 152 L146 152 L146 188" />
      </g>
    </svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="44 44 168 168" fill="none" aria-hidden focusable={false} {...props}>
      <g stroke="currentColor" strokeWidth="10" strokeLinecap="round">
        <circle cx="114" cy="114" r="38" />
        <line x1="142" y1="142" x2="186" y2="186" />
      </g>
    </svg>
  )
}

export function SavedIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="44 44 168 168" fill="none" aria-hidden focusable={false} {...props}>
      <g stroke="currentColor" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round">
        <rect x="64" y="56" width="128" height="144" rx="14" />
        <line x1="88" y1="96" x2="168" y2="96" />
        <line x1="88" y1="128" x2="168" y2="128" />
        <line x1="88" y1="160" x2="140" y2="160" />
      </g>
    </svg>
  )
}

export function IdeaIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="44 44 168 168" fill="none" aria-hidden focusable={false} {...props}>
      <g stroke="currentColor" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round">
        <path d="M100 144 C78 122 86 78 128 78 C170 78 178 122 156 144 L156 162 L100 162 Z" />
        <line x1="106" y1="176" x2="150" y2="176" />
        <line x1="114" y1="190" x2="142" y2="190" />
      </g>
    </svg>
  )
}

export function HeartIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="44 44 168 168" fill="none" aria-hidden focusable={false} {...props}>
      <g stroke="currentColor" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round">
        <path d="M128 176 C128 176 68 140 68 98 C68 76 86 60 108 64 C118 66 126 72 128 78 C130 72 138 66 148 64 C170 60 188 76 188 98 C188 140 128 176 128 176 Z" />
      </g>
    </svg>
  )
}

export function PlusSquareIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="44 44 168 168" fill="none" aria-hidden focusable={false} {...props}>
      <g stroke="currentColor" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round">
        <rect x="68" y="68" width="120" height="120" rx="18" />
        <line x1="128" y1="98" x2="128" y2="158" />
        <line x1="98" y1="128" x2="158" y2="128" />
      </g>
    </svg>
  )
}

export function UserCircleIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="44 44 168 168" fill="none" aria-hidden focusable={false} {...props}>
      <g stroke="currentColor" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round">
        <circle cx="128" cy="128" r="64" />
        <circle cx="128" cy="110" r="22" />
        <path d="M84 178 C92 158 108 150 128 150 C148 150 164 158 172 178" />
      </g>
    </svg>
  )
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="44 44 168 168" fill="none" aria-hidden focusable={false} {...props}>
      <g stroke="currentColor" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round">
        <path d="M128 70 L80 86 L80 132 Q80 174 128 192 Q176 174 176 132 L176 86 Z" />
        <path d="M102 130 L122 150 L156 114" />
      </g>
    </svg>
  )
}

/** 가로 점 세 개 — menu-meatballs-svgrepo-com.svg 기반 */
export function MenuMeatballsIcon(props: IconProps) {
  return (
    <svg {...BASE} strokeWidth={1.5} {...props}>
      <path d="M3.5 12C3.5 11.1716 4.17157 10.5 5 10.5C5.82843 10.5 6.5 11.1716 6.5 12C6.5 12.8284 5.82843 13.5 5 13.5C4.17157 13.5 3.5 12.8284 3.5 12Z" />
      <path d="M10.5 12C10.5 11.1716 11.1716 10.5 12 10.5C12.8284 10.5 13.5 11.1716 13.5 12C13.5 12.8284 12.8284 13.5 12 13.5C11.1716 13.5 10.5 12.8284 10.5 12Z" />
      <path d="M17.5 12C17.5 11.1716 18.1716 10.5 19 10.5C19.8284 10.5 20.5 11.1716 20.5 12C20.5 12.8284 19.8284 13.5 19 13.5C18.1716 13.5 17.5 12.8284 17.5 12Z" />
    </svg>
  )
}

/** 2×2 그리드(더 보기) */
export function GridEvenMoreIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="44 44 168 168" fill="none" aria-hidden focusable={false} {...props}>
      <g stroke="currentColor" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round">
        <rect x="76" y="76" width="46" height="46" rx="8" />
        <rect x="134" y="76" width="46" height="46" rx="8" />
        <rect x="76" y="134" width="46" height="46" rx="8" />
        <rect x="134" y="134" width="46" height="46" rx="8" />
      </g>
    </svg>
  )
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </svg>
  )
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}

export function ActivityIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M3 12h4l3-7 4 14 3-7h4" />
    </svg>
  )
}

export function BookmarkIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M6 4h12v17l-6-4-6 4Z" />
    </svg>
  )
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <circle cx="12" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M10 17l-5-5 5-5" />
      <path d="M5 12h12" />
      <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
    </svg>
  )
}
