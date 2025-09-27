/**
 * This route serves the pre-built Sanity Studio
 * to avoid webpack module resolution issues
 */

export default function StudioPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <iframe
        src="/api/studio-static"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Sanity Studio"
      />
    </div>
  )
}