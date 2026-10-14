export function Loading() {
  return <div className="loading" role="status">Loading candidates…</div>
}

export function LoadError() {
  return (
    <div className="empty-state" role="alert">
      <h3>Couldn't load the guide</h3>
      <p>Please check your connection and refresh the page.</p>
    </div>
  )
}
