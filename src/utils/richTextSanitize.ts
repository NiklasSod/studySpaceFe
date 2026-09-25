import DOMPurify from 'dompurify'

/**
 * Mirrors the backend `RichTextSanitizer` allowlist so HTML rendered on the
 * client is treated the same way it was sanitized on the server.
 *
 * Allowed tags:      p, br, b, strong, i, em, u, s, ul, ol, li, h1-h4, a, span
 * Allowed attrs:     href, style
 * Allowed schemes:   http, https, mailto (plus relative URLs)
 */
const ALLOWED_TAGS = [
  'p',
  'br',
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'a',
  'span',
]

const ALLOWED_ATTR = ['href', 'style']

const ALLOWED_URI_REGEXP =
  /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i

export function sanitizeRichText(html: string | null | undefined): string {
  return DOMPurify.sanitize(html ?? '', {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
    ALLOW_ARIA_ATTR: false,
    ALLOW_DATA_ATTR: false,
  })
}
