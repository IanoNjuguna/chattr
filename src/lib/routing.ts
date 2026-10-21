/** Hash routing. No dependency, because there are exactly three screens. */
export type Route =
  | { name: 'landing' }
  | { name: 'create' }
  | { name: 'room'; roomId: bigint }

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '')
  if (path === '/new') return { name: 'create' }
  const match = path.match(/^\/r\/(\d+)$/)
  if (match) return { name: 'room', roomId: BigInt(match[1]) }
  return { name: 'landing' }
}

export function go(path: string): void {
  window.location.hash = path
}

export function roomPath(roomId: bigint | number | string): string {
  return `#/r/${roomId}`
}

/** The shareable link for a room, absolute so it can be pasted into a chat. */
export function roomLink(roomId: bigint | number | string): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/r/${roomId}`
}
