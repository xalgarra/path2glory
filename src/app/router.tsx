import { useState, useEffect } from 'react'

export type Route =
  | { name: 'campaign-list' }
  | { name: 'campaign-detail'; campaignId: string }
  | { name: 'hero-new'; campaignId: string }
  | { name: 'hero-sheet'; campaignId: string; heroId: string }
  | { name: 'backup' }

function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '')

  const heroNewMatch = path.match(/^\/campaigns\/([^/]+)\/heroes\/new$/)
  if (heroNewMatch) return { name: 'hero-new', campaignId: heroNewMatch[1] }

  const heroSheetMatch = path.match(/^\/campaigns\/([^/]+)\/heroes\/([^/]+)$/)
  if (heroSheetMatch) return { name: 'hero-sheet', campaignId: heroSheetMatch[1], heroId: heroSheetMatch[2] }

  const detailMatch = path.match(/^\/campaigns\/([^/]+)$/)
  if (detailMatch) return { name: 'campaign-detail', campaignId: detailMatch[1] }

  if (path === '/backup') return { name: 'backup' }

  return { name: 'campaign-list' }
}

export function navigate(route: Route): void {
  if (route.name === 'campaign-list') {
    window.location.hash = '#/campaigns'
  } else if (route.name === 'campaign-detail') {
    window.location.hash = `#/campaigns/${route.campaignId}`
  } else if (route.name === 'hero-new') {
    window.location.hash = `#/campaigns/${route.campaignId}/heroes/new`
  } else if (route.name === 'hero-sheet') {
    window.location.hash = `#/campaigns/${route.campaignId}/heroes/${route.heroId}`
  } else {
    window.location.hash = '#/backup'
  }
}

export function useHashRouter(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = '#/campaigns'
    }
    const handle = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', handle)
    return () => window.removeEventListener('hashchange', handle)
  }, [])

  return route
}
