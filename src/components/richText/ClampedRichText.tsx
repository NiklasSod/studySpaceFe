import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { sanitizeRichText } from '../../utils/richTextSanitize'

interface ClampedRichTextProps {
  html?: string | null
  lines?: number
  className?: string
}

/**
 * Renders sanitized rich-text HTML with a line clamp and a read more/less
 * toggle, mirroring the behaviour of `ClampedText` for plain text.
 */
export default function ClampedRichText({
  html,
  lines = 3,
  className,
}: ClampedRichTextProps) {
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [hasOverflow, setHasOverflow] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const clean = useMemo(() => sanitizeRichText(html), [html])

  useEffect(() => {
    const el = contentRef.current
    if (!el || expanded) return

    const measure = () => {
      setHasOverflow(el.scrollHeight > el.clientHeight)
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [clean, expanded])

  const clampStyle = expanded
    ? undefined
    : ({
        display: '-webkit-box',
        WebkitLineClamp: lines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      } as CSSProperties)

  return (
    <>
      <div
        ref={contentRef}
        className={`rich-text-display rich-text-clamped ${className ?? ''}`.trim()}
        style={clampStyle}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
      {hasOverflow && (
        <button
          type="button"
          className="btn btn-link btn-sm p-0 text-decoration-none"
          style={{ position: 'relative', zIndex: 1 }}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </>
  )
}
