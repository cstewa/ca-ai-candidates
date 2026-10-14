import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container empty-state">
      <h3>Page not found</h3>
      <p>That race or candidate isn't in the guide. <Link to="/races" style={{ textDecoration: 'underline' }}>Browse all races</Link>.</p>
    </div>
  )
}
