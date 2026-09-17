import type { SVGProps } from 'react'

/* A small stroke-icon set, drawn to a 24px grid at 1.6 weight so it sits
 * comfortably beside the Outfit UI type. */

const paths = {
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 4 4',
  close: 'M6 6l12 12M18 6L6 18',
  bookmark: 'M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1Z',
  note: 'M6 3h8l4 4v14H6V3Zm8 0v4h4M9 12h6M9 16h4',
  share: 'M12 3v12M12 3 8 7m4-4 4 4M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5',
  play: 'M8 5l11 7-11 7V5Z',
  pause: 'M9 5v14M15 5v14',
  chevronRight: 'm9 5 7 7-7 7',
  chevronLeft: 'm15 5-7 7 7 7',
  chevronDown: 'm5 9 7 7 7-7',
  sun: 'M12 6.5A5.5 5.5 0 1 0 12 17.5 5.5 5.5 0 0 0 12 6.5ZM12 1.5v2M12 20.5v2M22.5 12h-2M3.5 12h-2M19.4 4.6l-1.4 1.4M6 18l-1.4 1.4M19.4 19.4 18 18M6 6 4.6 4.6',
  moon: 'M20 13.4A8.5 8.5 0 0 1 10.6 4a8.5 8.5 0 1 0 9.4 9.4Z',
  leaf: 'M5 19c0-7 4-13 14-14 0 9-3 15-11 15a9 9 0 0 1-3-1Zm1 0C8 15 11 11 17 6',
  grid: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  filter: 'M4 5h16l-6 7v6l-4 2v-8L4 5Z',
  map: 'M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Zm0 0v13m6-10.5v13',
  sound: 'M5 9v6h3.5L13 19V5L8.5 9H5Zm11.5-.5a5 5 0 0 1 0 7m2.5-9.5a8.5 8.5 0 0 1 0 12',
  mute: 'M5 9v6h3.5L13 19V5L8.5 9H5Zm11 1 4 4m0-4-4 4',
  download: 'M12 3v11m0 0-4-4m4 4 4-4M5 17v3h14v-3',
  check: 'm5 12 4.5 4.5L19 7',
  plus: 'M12 5v14M5 12h14',
  compass: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm3.5 5.5-2 5-5 2 2-5 5-2Z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z',
  book: 'M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2V5Zm16 0a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 0 2-2V5Z',
  route: 'M6 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12-10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 0v2a4 4 0 0 1-4 4h-4a4 4 0 0 0-4 4',
  arrowRight: 'M4 12h15m0 0-5-5m5 5-5 5',
  arrowLeft: 'M20 12H5m0 0 5-5m-5 5 5 5',
  seedling: 'M12 21v-7m0 0c0-3.3-2.7-6-6-6H4v2c0 2.8 2.2 5 5 5h3Zm0 0c0-4 3-7 7-7h1v1c0 3.3-2.7 6-6 6h-2Z',
  drop: 'M12 3s6 6.5 6 10.5a6 6 0 0 1-12 0C6 9.5 12 3 12 3Z',
  alert: 'M12 4 3 20h18L12 4Zm0 6v5m0 3h.01',
  layers: 'm12 3 9 5-9 5-9-5 9-5Zm9 9-9 5-9-5m18 4-9 5-9-5',
  eye: 'M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Zm10 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  reset: 'M4 12a8 8 0 1 1 2.5 5.8M4 12V7m0 5h5',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8.4-2.5.1-.5-.1-.5 1.7-1.3-1.7-3-2 .7a7.6 7.6 0 0 0-1.7-1L16.3 5h-3.5l-.4 2a7.6 7.6 0 0 0-1.7 1l-2-.7-1.7 3 1.7 1.3-.1.5.1.5-1.7 1.3 1.7 3 2-.7c.5.4 1.1.7 1.7 1l.4 2h3.5l.4-2c.6-.3 1.2-.6 1.7-1l2 .7 1.7-3-1.7-1.3Z',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4h.01M11 11h1v6h1',
  expand: 'M4 9V4h5M20 15v5h-5M20 9V4h-5M4 15v5h5',
  cursor: 'm6 4 12 6-5 1.6L10.6 17 6 4Z',
  quiz: 'M12 4a6 6 0 0 1 4 10.2V17H8v-2.8A6 6 0 0 1 12 4Zm-2 13h4m-2 0v3',
} as const

export type IconName = keyof typeof paths

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
  /** Solid icons fill instead of stroke — used for the active bookmark. */
  solid?: boolean
}

export function Icon({ name, size = 20, solid = false, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={solid ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={solid ? 0 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  )
}
