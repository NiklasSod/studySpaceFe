import { useState } from 'react'
import type { ImagePoint } from '../../types/resource'

interface InteractiveImageViewerProps {
  url: string
  points: ImagePoint[]
}

/**
 * Renders an interactive image with numbered markers. The image is kept at its
 * natural width inside a horizontally scrollable container (these images are
 * wide, e.g. 4:1). Clicking a marker shows its text and voice note.
 */
function InteractiveImageViewer({ url, points }: InteractiveImageViewerProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const selectedPoint = selected === null ? undefined : points[selected]

  return (
    <div>
      <div
        className="overflow-auto mb-2"
        style={{
          border: '1px solid var(--input-border)',
          borderRadius: '6px',
          backgroundColor: 'var(--input-bg)',
        }}
      >
        <div style={{ position: 'relative', width: 'fit-content' }}>
          <img
            src={url}
            alt=""
            style={{ display: 'block', maxWidth: 'none', height: 'auto' }}
          />
          {points.map((point, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelected(index)}
              className="btn btn-sm rounded-circle d-inline-flex align-items-center justify-content-center p-0"
              style={{
                position: 'absolute',
                left: `${point.x * 100}%`,
                top: `${point.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: '26px',
                height: '26px',
                fontWeight: 600,
                backgroundColor:
                  selected === index
                    ? 'var(--btn-bg)'
                    : 'var(--link-color)',
                color: selected === index ? 'var(--btn-text)' : '#fff',
                border: '2px solid rgba(255,255,255,0.85)',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.25)',
              }}
              aria-label={`Point ${index + 1}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {selectedPoint && (
        <div
          className="rounded p-2 small"
          style={{
            backgroundColor: 'var(--input-bg)',
            border: '1px solid var(--input-border)',
          }}
        >
          <div className="fw-semibold mb-1">
            {selected !== null && selected + 1}. {selectedPoint.text}
          </div>
          {selectedPoint.audioUrl && (
            <audio
              controls
              preload="none"
              src={selectedPoint.audioUrl}
              className="w-100"
            />
          )}
        </div>
      )}
    </div>
  )
}

export default InteractiveImageViewer
