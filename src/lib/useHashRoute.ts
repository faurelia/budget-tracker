import { useEffect, useState } from 'react'
import { ROUTES, type Route } from '../types'

function parseHash(hash: string): Route {
  const candidate = hash.replace(/^#\/?/, '').split(/[/?]/)[0]
  return (ROUTES as readonly string[]).includes(candidate)
    ? (candidate as Route)
    : 'dashboard'
}

/** Minimal hash router: `#/transactions`, `#/budgets`, ... */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    const handleHashChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return route
}
