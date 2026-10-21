import { useEffect, useState } from 'react'
import { parseRoute, type Route } from './lib/routing'
import { Landing } from './views/Landing'
import { Room } from './views/Room'
import { CreateRoomForm } from './views/create/CreateRoomForm'

/**
 * Three screens, hash routed: landing, create, room.
 * No router dependency, because a router would be more code than this.
 */
export default function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash))

  useEffect(() => {
    const onHash = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route.name === 'create') return <CreateRoomForm />
  if (route.name === 'room') return <Room roomId={route.roomId} />
  return <Landing />
}
