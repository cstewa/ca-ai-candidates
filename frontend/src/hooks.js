import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Scroll to #id in the URL once the page's content has rendered.
export function useHashScroll(ready) {
  const { hash } = useLocation()
  useEffect(() => {
    if (!ready || !hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'instant', block: 'start' })
  }, [ready, hash])
}
