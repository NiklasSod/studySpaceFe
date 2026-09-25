import { useMemo } from 'react'
import { sanitizeRichText } from '../../utils/richTextSanitize'

interface RichTextProps {
  html?: string | null
  className?: string
}

/**
 * Renders sanitized rich-text HTML. Content is sanitized on the server and
 * again here as a defence-in-depth measure.
 */
export default function RichText({ html, className }: RichTextProps) {
  const clean = useMemo(() => sanitizeRichText(html), [html])

  return (
    <div
      className={`rich-text-display ${className ?? ''}`.trim()}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
