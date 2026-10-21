import { useState } from 'react'

// Shares the current page (e.g. /my-ballot?zip=94110). Uses the phone's share sheet when
// there is one, otherwise copies the link.
export default function ShareButton({ text, className = '', label = 'Share' }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: document.title, text, url }) } catch { /* cancelled */ }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch { /* clipboard blocked */ }
  }

  return (
    <button type="button" className={className} onClick={share} aria-label={copied ? 'Link copied' : 'Send your ballot’s AI record to a friend'}>
      {copied ? 'Link copied' : label}
    </button>
  )
}
